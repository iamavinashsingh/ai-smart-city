from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime


# ── Detection-level schemas ────────────────────────────────────────────────────

class PotholeDetection(BaseModel):
    """Single bounding-box detection emitted by the YOLO model."""

    bbox: List[float] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="Bounding box coordinates [x1, y1, x2, y2] in pixel space.",
        examples=[[100.0, 200.0, 350.0, 420.0]],
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Detection confidence score in [0, 1].",
    )
    class_name: str = Field(default="pothole", description="Detected object class label.")

    @field_validator("bbox")
    @classmethod
    def bbox_must_be_positive(cls, v: List[float]) -> List[float]:
        if any(coord < 0 for coord in v):
            raise ValueError("All bounding-box coordinates must be ≥ 0.")
        return [round(c, 2) for c in v]


# ── Request-level schema ───────────────────────────────────────────────────────

class DetectionRequest(BaseModel):
    """
    Metadata sent alongside the image upload.
    (Not used directly in multipart routes, kept for reference / SDK generation.)
    """
    latitude: float = Field(..., ge=-90.0, le=90.0, description="GPS latitude.")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="GPS longitude.")


# ── Response schemas ───────────────────────────────────────────────────────────

class DetectionResponse(BaseModel):
    """Response body returned by the /detect endpoint."""

    success: bool
    message: str
    image_url: Optional[str] = Field(None, description="CDN URL of the annotated (WebP-compressed) image. Absent for Normal roads.")
    detections: List[PotholeDetection]
    severity: str = Field(..., description="'Normal' | 'Low' | 'Moderate' | 'High' | 'Critical'")
    max_pothole_ratio: Optional[float] = Field(None, description="Ratio of largest bbox area to image area.")
    timestamp: datetime = Field(..., description="UTC timestamp of the detection event.")
    location: dict = Field(
        ...,
        description="GPS coordinates of the capture point.",
        examples=[{"lat": 26.4499, "lng": 80.3319}],
    )


class PotholeLog(BaseModel):
    """
    Represents a historical pothole record retrieved from MongoDB.
    Used for the Map Dashboard feed.
    """
    id: Optional[str] = Field(None, alias="_id", description="MongoDB ObjectId as string.")
    image_url: str
    latitude: float
    longitude: float
    detections: List[PotholeDetection]
    severity: str = Field(..., description="'Normal' | 'Low' | 'Moderate' | 'High' | 'Critical'")
    timestamp: datetime

    model_config = {"populate_by_name": True}
