import asyncio
import io
import logging
from typing import List, Dict

from PIL import Image
from ultralytics import YOLO

logger = logging.getLogger(__name__)


class AIService:
    """
    Singleton wrapper around a YOLOv12 model.

    The model is loaded once at startup (via `load_model`) and kept in memory
    for the entire process lifetime, avoiding the heavy per-request cold-start.
    Inference is dispatched to a thread-pool executor so it never blocks the
    FastAPI async event loop.
    """

    def __init__(self) -> None:
        self.model: YOLO | None = None
        self._model_path: str = ""

    def load_model(self, model_path: str) -> None:
        """
        Load (or re-load) the YOLO model from *model_path*.
        Raises on failure so the calling lifespan handler can hard-stop the app.
        """
        logger.info("Loading YOLO model from '%s'...", model_path)
        self.model = YOLO(model_path)
        self._model_path = model_path
        logger.info("YOLO model '%s' loaded successfully.", model_path)

    @property
    def is_ready(self) -> bool:
        return self.model is not None

    async def run_inference(
        self,
        image_bytes: bytes,
        confidence: float = 0.25,
    ) -> List[Dict]:
        """
        Run YOLOv12 inference on *image_bytes* and return a list of detections.

        Each detection is a dict with keys:
            bbox       – [x1, y1, x2, y2] in pixel coordinates
            confidence – float in [0, 1]
            class_id   – int (0 == pothole)

        Inference is executed in a thread-pool executor to keep the event loop
        free for concurrent requests.

        Raises:
            RuntimeError: if the model has not been loaded yet.
            Exception:    propagates underlying YOLO / PIL errors to the caller.
        """
        if not self.is_ready:
            raise RuntimeError("YOLO model is not initialised. Call load_model() first.")

        def _detect() -> List[Dict]:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            results = self.model.predict(img, conf=confidence, verbose=False)

            detections: List[Dict] = []
            for result in results:
                for box in result.boxes:
                    detections.append(
                        {
                            "bbox": [round(v, 2) for v in box.xyxy[0].tolist()],
                            "confidence": round(float(box.conf[0]), 4),
                            "class_id": int(box.cls[0]),
                        }
                    )
            return detections

        logger.debug("Dispatching inference to thread pool...")
        detections = await asyncio.to_thread(_detect)
        logger.debug("Inference returned %d raw detections.", len(detections))
        return detections


# ── Module-level singleton ─────────────────────────────────────────────────────
ai_service = AIService()
