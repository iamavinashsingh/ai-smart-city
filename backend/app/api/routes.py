from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from datetime import datetime, timezone
from typing import Annotated, List, Dict
import asyncio
import io
import logging

import cv2
import numpy as np

from ..services.ai_service import ai_service
from ..services.storage_service import storage_service
from ..services.db_service import db_service
from ..schemas.models import DetectionResponse, PotholeDetection
from ..core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Constants ─────────────────────────────────────────────────────────────────
MAX_IMAGE_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _serialize(detection: PotholeDetection) -> dict:
    """Pydantic v1/v2 compatible serializer."""
    return detection.model_dump() if hasattr(detection, "model_dump") else detection.dict()


def calculate_severity(
    detections: List[Dict],
    img_width: int,
    img_height: int,
) -> tuple[str, float]:
    """
    Compute severity level from detection count and bounding-box area ratio.

    Decision tree:
      - "Critical"  if count >= 4  OR  max_ratio > 0.20
      - "High"      if count == 3  OR  max_ratio > 0.10
      - "Moderate"  if count == 2
      - "Low"       if count == 1
      - "Normal"    if count == 0

    Returns:
        (severity_label, max_pothole_ratio)
    """
    count = len(detections)
    if count == 0:
        return "Normal", 0.0

    image_area = img_width * img_height
    max_box_area = 0.0
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        box_area = abs(x2 - x1) * abs(y2 - y1)
        max_box_area = max(max_box_area, box_area)

    max_ratio = max_box_area / image_area if image_area > 0 else 0.0

    # Decision tree (ratio checks take priority over count)
    if count >= 4 or max_ratio > 0.20:
        return "Critical", round(max_ratio, 4)
    if count == 3 or max_ratio > 0.10:
        return "High", round(max_ratio, 4)
    if count == 2:
        return "Moderate", round(max_ratio, 4)
    # count == 1
    return "Low", round(max_ratio, 4)


def annotate_image(image_bytes: bytes, detections: List[Dict]) -> bytes:
    """
    Draw YOLO bounding boxes + confidence labels onto the image using OpenCV.

    Returns:
        JPEG-encoded bytes of the annotated image.
    """
    # Decode image from bytes
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        logger.warning("annotate_image: cv2.imdecode returned None, returning raw bytes.")
        return image_bytes

    h, w = img.shape[:2]

    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        conf = det.get("confidence", 0.0)

        # Box colour: red
        color = (71, 71, 239)  # BGR for #EF4747
        thickness = max(w // 200, 2)
        cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)

        # Label background
        label = f"{conf * 100:.0f}%"
        font_scale = max(w / 1200, 0.5)
        font_thickness = max(w // 400, 1)
        (tw, th), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)
        cv2.rectangle(img, (x1, y1 - th - baseline - 8), (x1 + tw + 8, y1), color, -1)
        cv2.putText(img, label, (x1 + 4, y1 - baseline - 4), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), font_thickness, cv2.LINE_AA)

    # Encode to JPEG in memory (quality 85 for good size/quality balance)
    success, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if not success:
        logger.error("annotate_image: cv2.imencode failed, returning raw bytes.")
        return image_bytes

    return buffer.tobytes()


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post(
    "/detect",
    response_model=DetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Run YOLOv12 pothole detection on an uploaded image",
)
async def detect_pothole(
    image: Annotated[UploadFile, File(description="Road image (JPEG / PNG / WebP)")],
    latitude: Annotated[float, Form(description="GPS latitude of the capture point")],
    longitude: Annotated[float, Form(description="GPS longitude of the capture point")],
):
    """
    Full edge-to-cloud inference pipeline:

    1. Validate the upload.
    2. Run YOLOv12 inference on a background thread (non-blocking).
    3. If Normal → return immediately (no upload, no DB write).
    4. Annotate image with bounding boxes via OpenCV.
    5. Upload annotated image to Cloudinary CDN.
    6. Persist geospatial detection log to MongoDB.
    7. Return structured JSON with detections & metadata.
    """
    logger.info(
        "Detection request received | file=%s | lat=%.6f | lng=%.6f",
        image.filename,
        latitude,
        longitude,
    )

    # ── 1. Input Validation ────────────────────────────────────────────────────
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        logger.warning("Rejected upload — content_type=%s", image.content_type)
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type '{image.content_type}'. Accepted: JPEG, PNG, WebP.",
        )

    image_bytes = await image.read()

    if len(image_bytes) > MAX_IMAGE_BYTES:
        logger.warning("Rejected upload — size=%d bytes (limit %d MB)", len(image_bytes), settings.MAX_IMAGE_SIZE_MB)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds maximum allowed size of {settings.MAX_IMAGE_SIZE_MB} MB.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Received an empty image file.",
        )

    # ── 2. AI Inference ────────────────────────────────────────────────────────
    try:
        logger.info("Starting YOLOv12 inference...")
        detections_raw, img_width, img_height = await ai_service.run_inference(image_bytes)
        logger.info("Inference complete — raw detections: %d (img=%dx%d)", len(detections_raw), img_width, img_height)
    except Exception as exc:
        logger.error("Inference failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI inference engine error. Please try again.",
        )

    # ── 3. Filter & Compute Severity ───────────────────────────────────────────
    pothole_detections_raw = [d for d in detections_raw if d.get("class_id") == 0]
    severity, max_ratio = calculate_severity(pothole_detections_raw, img_width, img_height)
    logger.info("Filtered detections: %d | severity: %s | max_ratio: %.4f", len(pothole_detections_raw), severity, max_ratio)

    # ── 3a. Normal Early Return ────────────────────────────────────────────────
    if severity == "Normal":
        logger.info("Normal road detected — skipping Cloudinary upload and MongoDB log.")
        return DetectionResponse(
            success=True,
            message="Normal road, not logged",
            image_url=None,
            detections=[],
            severity="Normal",
            max_pothole_ratio=0.0,
            timestamp=datetime.now(timezone.utc),
            location={"lat": latitude, "lng": longitude},
        )

    # ── 4. Annotate Image with Bounding Boxes ──────────────────────────────────
    try:
        logger.info("Annotating image with %d bounding boxes...", len(pothole_detections_raw))
        annotated_bytes = await asyncio.to_thread(annotate_image, image_bytes, pothole_detections_raw)
        logger.info("Annotation complete — annotated size: %d bytes", len(annotated_bytes))
    except Exception as exc:
        logger.warning("Annotation failed (falling back to raw image): %s", exc)
        annotated_bytes = image_bytes

    # ── 5. CDN Upload (Annotated Image) ────────────────────────────────────────
    try:
        filename = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        logger.info("Uploading annotated image to Cloudinary (filename=%s)...", filename)
        image_url = await storage_service.upload_image(annotated_bytes, filename)
        logger.info("Cloudinary upload successful: %s", image_url)
    except Exception as exc:
        logger.error("Cloudinary upload failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Storage service unavailable. Please try again.",
        )

    # ── 6. Build Pydantic Detection Objects ────────────────────────────────────
    detections = [
        PotholeDetection(bbox=d["bbox"], confidence=d["confidence"])
        for d in pothole_detections_raw
    ]

    # ── 7. Persist to MongoDB ──────────────────────────────────────────────────
    try:
        logger.info("Writing detection log to MongoDB...")
        await db_service.log_detection(
            image_url=image_url,
            latitude=latitude,
            longitude=longitude,
            detections=[_serialize(d) for d in detections],
            severity=severity,
        )
        logger.info("MongoDB log written successfully.")
    except Exception as exc:
        # Non-fatal: still return results to the client even if DB write fails.
        logger.error("MongoDB log failed (non-fatal): %s", exc, exc_info=True)

    # ── 8. Response ────────────────────────────────────────────────────────────
    return DetectionResponse(
        success=True,
        message=f"Detected {len(detections)} pothole(s). Severity: {severity}.",
        image_url=image_url,
        detections=detections,
        severity=severity,
        max_pothole_ratio=max_ratio,
        timestamp=datetime.now(timezone.utc),
        location={"lat": latitude, "lng": longitude},
    )


@router.get(
    "/potholes",
    summary="Retrieve paginated pothole detection history",
    status_code=status.HTTP_200_OK,
)
async def get_records(limit: int = 50):
    """
    Returns the most recent `limit` pothole detections from MongoDB,
    sorted by timestamp descending. Used by the Map Dashboard feed.
    """
    if not (1 <= limit <= 200):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="'limit' must be between 1 and 200.",
        )

    try:
        logger.info("Fetching latest %d pothole records...", limit)
        records = await db_service.get_all_potholes(limit)
        logger.info("Fetched %d records.", len(records))
        return {"success": True, "count": len(records), "data": records}
    except Exception as exc:
        logger.error("Failed to fetch pothole records: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Please try again.",
        )
