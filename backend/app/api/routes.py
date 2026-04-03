from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from datetime import datetime
from ..services.ai_service import ai_service
from ..services.storage_service import storage_service
from ..services.db_service import db_service
from ..schemas.models import DetectionResponse, PotholeDetection
import json

router = APIRouter()

@router.post("/detect", response_model=DetectionResponse)
async def detect_pothole(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """The core operational pipeline for raw AI inference and compression."""
    
    # 1. Validation (Check image type)
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG/PNG images allowed.")

    image_bytes = await image.read()

    # 2. Sequential/Parallel Pipeline
    try:
        # Step A: Raw AI Inference (YOLO is most CPU-bound)
        detections_raw = await ai_service.run_inference(image_bytes)
        
        # Step B: CDN Compression & Storage (Simultaneously streaming to Cloudinary)
        # We use a human-readable timestamp for filename
        filename = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_url = await storage_service.upload_image(image_bytes, filename)
        
        # 3. Aggregation & Formating
        detections = [
            PotholeDetection(bbox=d["bbox"], confidence=d["confidence"]) 
            for d in detections_raw if d["class_id"] == 0 # Only collect class 0 (Pothole)
        ]
        
        severity = "Normal"
        if len(detections) > 3:
            severity = "Critical"
        elif len(detections) > 0:
            severity = "High"

        # 4. NoSQL Logging (MongoDB)
        await db_service.log_detection(
            image_url=image_url,
            latitude=latitude,
            longitude=longitude,
            detections=[d.model_dump() for d in detections],
            severity=severity
        )

        # 5. Client Response
        return DetectionResponse(
            success=True,
            message=f"Detected {len(detections)} potholes.",
            image_url=image_url,
            detections=detections,
            timestamp=datetime.utcnow(),
            location={"lat": latitude, "lng": longitude}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/potholes")
async def get_records(limit: int = 50):
    """Retrieve historical logs for the Map Dashboard feed."""
    try:
        records = await db_service.get_all_potholes(limit)
        return {"success": True, "data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
