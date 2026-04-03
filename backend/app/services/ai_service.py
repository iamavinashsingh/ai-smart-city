import asyncio
from ultralytics import YOLO
import io
from PIL import Image
from typing import List, Dict
from ..core.config import settings

class AIService:
    def __init__(self):
        self.model = None

    def load_model(self, model_path: str):
        """Load the YOLO model once during application startup."""
        self.model = YOLO(model_path)

    async def run_inference(self, image_bytes: bytes) -> List[Dict]:
        """Run YOLO inference on a background thread to prevent blocking."""
        def detect():
            # Convert bytes to PIL Image
            img = Image.open(io.BytesIO(image_bytes))
            # Run inference
            results = self.model.predict(img, conf=0.25)
            
            detections = []
            for result in results:
                for box in result.boxes:
                    bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    confidence = float(box.conf[0])
                    detections.append({
                        "bbox": bbox,
                        "confidence": confidence,
                        "class_id": int(box.cls[0])
                    })
            return detections

        # Push to thread pool
        return await asyncio.to_thread(detect)

# Singleton instance
ai_service = AIService()
