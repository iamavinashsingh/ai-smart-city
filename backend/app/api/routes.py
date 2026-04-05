from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from datetime import datetime, timezone
from typing import Annotated
import logging

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


def _compute_severity(count: int) -> str:
    if count > 3:
        return "Critical"
    if count > 0:
        return "High"
    return "Normal"


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
    3. Upload compressed image to Cloudinary CDN.
    4. Persist geospatial detection log to MongoDB.
    5. Return structured JSON with detections & metadata.
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
        detections_raw = await ai_service.run_inference(image_bytes)
        logger.info("Inference complete — raw detections: %d", len(detections_raw))
    except Exception as exc:
        logger.error("Inference failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI inference engine error. Please try again.",
        )

    # ── 3. CDN Upload ──────────────────────────────────────────────────────────
    try:
        filename = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        logger.info("Uploading image to Cloudinary (filename=%s)...", filename)
        image_url = await storage_service.upload_image(image_bytes, filename)
        logger.info("Cloudinary upload successful: %s", image_url)
    except Exception as exc:
        logger.error("Cloudinary upload failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Storage service unavailable. Please try again.",
        )

    # ── 4. Aggregate Results ───────────────────────────────────────────────────
    detections = [
        PotholeDetection(bbox=d["bbox"], confidence=d["confidence"])
        for d in detections_raw
        if d.get("class_id") == 0  # class 0 == pothole
    ]
    severity = _compute_severity(len(detections))
    logger.info("Filtered detections: %d | severity: %s", len(detections), severity)

    # ── 5. Persist to MongoDB ──────────────────────────────────────────────────
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

    # ── 6. Response ────────────────────────────────────────────────────────────
    return DetectionResponse(
        success=True,
        message=f"Detected {len(detections)} pothole(s). Severity: {severity}.",
        image_url=image_url,
        detections=detections,
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
