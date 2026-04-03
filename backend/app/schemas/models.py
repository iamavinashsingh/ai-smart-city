from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PotholeDetection(BaseModel):
    bbox: List[float] = Field(..., description="[x1, y1, x2, y2] coordinates")
    confidence: float = Field(..., ge=0, le=1)
    class_name: str = "pothole"

class DetectionRequest(BaseModel):
    latitude: float
    longitude: float

class DetectionResponse(BaseModel):
    success: bool
    message: str
    image_url: str
    detections: List[PotholeDetection]
    timestamp: datetime
    location: dict = Field(..., example={"lat": 19.076, "lng": 72.877})

class PotholeLog(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    image_url: str
    latitude: float
    longitude: float
    detections: List[PotholeDetection]
    severity: str
    timestamp: datetime
