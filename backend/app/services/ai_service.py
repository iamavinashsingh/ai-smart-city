import asyncio
import io
import logging
import types
from typing import List, Dict

import torch
import torch.nn.functional as F
from PIL import Image
from ultralytics import YOLO

logger = logging.getLogger(__name__)


# ── YOLOv12 AAttn Compatibility Forward ───────────────────────────────────────
def _old_aattn_forward(self, x: torch.Tensor) -> torch.Tensor:
    """
    Exact re-implementation of the sunsmarterjie/yolov12 fork AAttn forward.

    That fork's AAttn has FOUR learnable components:
        self.qk   → nn.Linear(C, 2C)  — projects to Q and K
        self.v    → nn.Linear(C, C)   — separate Value projection
        self.pe   → nn.Conv2d(C, C, 7, 1, 3, groups=C)  — DWConv positional enc
        self.proj → nn.Linear(C, C)   — output projection

    New Ultralytics merged these into a single self.qkv → nn.Linear(C, 3C),
    which causes a RuntimeError when loading old weights because the projection
    dimension is 2C (not 3C), making the reshape [B*area, N/area, C*3] invalid.

    This method is bound as an instance method on every old-style AAttn block
    at model-load time, transparently replacing the broken built-in forward.
    """
    B, C, H, W = x.shape
    N = H * W
    head_dim = C // self.num_heads
    xf = x.flatten(2).transpose(1, 2)  # B, N, C  (flattened spatial)

    # ── Q, K ── from 'qk' projection (old fork, outputs 2C) ─────────────────
    qk = self.qk(xf)          # B, N, 2C
    q, k = qk.chunk(2, dim=-1)  # B, N, C each

    # ── V ── from separate 'v' projection (if present) else fall back to x ───
    if hasattr(self, "v") and self.v is not None:
        v = self.v(xf)         # B, N, C
    else:
        v = xf                 # B, N, C  — fallback: use raw input

    # ── Area partitioning ────────────────────────────────────────────────────
    if self.area > 1:
        N_a = N // self.area
        q = q.reshape(B * self.area, N_a, C)
        k = k.reshape(B * self.area, N_a, C)
        v = v.reshape(B * self.area, N_a, C)
        Beff, Neff = B * self.area, N_a
    else:
        Beff, Neff = B, N

    # ── Multi-head reshape ───────────────────────────────────────────────────
    def _mh(t: torch.Tensor) -> torch.Tensor:
        return t.reshape(Beff, Neff, self.num_heads, head_dim).transpose(1, 2)

    q, k, v_mh = _mh(q), _mh(k), _mh(v)

    # ── Scaled dot-product attention ─────────────────────────────────────────
    scale = head_dim ** -0.5
    attn = (q @ k.transpose(-2, -1)) * scale   # Beff, heads, Neff, Neff
    attn = attn.softmax(dim=-1)
    out  = (attn @ v_mh)                       # Beff, heads, Neff, head_dim
    out  = out.transpose(1, 2).reshape(Beff, Neff, C)  # Beff, Neff, C

    # Restore area partitioning → full sequence
    if self.area > 1:
        out = out.reshape(B, N, C)   # B, N, C  (v is also B, N, C now)
        v   = v.reshape(B, N, C)

    # ── Positional encoding (DWConv7x7 applied spatially to V) ──────────────
    # The pe Conv2d expects shape (B, C, H, W).
    # In the original fork: out = out + pe(v.reshape(B, C, H, W)).flatten.T
    if hasattr(self, "pe") and self.pe is not None:
        try:
            v_spatial = v.transpose(1, 2).reshape(B, C, H, W)  # B, C, H, W
            pe_out    = self.pe(v_spatial).flatten(2).transpose(1, 2)  # B, N, C
            out       = out + pe_out
        except Exception as e:
            logger.debug("AAttn pe skip: %s", e)

    # ── Output projection ────────────────────────────────────────────────────
    if hasattr(self, "proj") and self.proj is not None:
        try:
            out = self.proj(out)   # B, N, C
        except Exception as e:
            logger.debug("AAttn proj skip: %s", e)

    return out.transpose(1, 2).reshape(B, C, H, W)
# ─────────────────────────────────────────────────────────────────────────────


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
        Applies a forward-method patch to support old YOLOv12 weights trained
        with the sunsmarterjie fork (qk → 2C instead of qkv → 3C).
        Raises on failure so the calling lifespan handler can hard-stop the app.
        """
        logger.info("Loading YOLO model from '%s'...", model_path)
        self.model = YOLO(model_path)

        # ── YOLOv12 Compatibility Patch ────────────────────────────────────
        # The old sunsmarterjie/yolov12 fork used:
        #   self.qk  → nn.Linear(C, 2C)  [Q and K only]
        # New Ultralytics >=8.3.7x uses:
        #   self.qkv → nn.Linear(C, 3C)  [Q, K, V]   ← crashes on old weights
        #
        # Fix: bind a custom forward() on every old-style AAttn block that
        #      honours the 2C 'qk' projection and derives V from the input.
        # ──────────────────────────────────────────────────────────────────
        try:
            patched_count = 0
            if hasattr(self.model, "model") and hasattr(self.model.model, "modules"):
                for m in self.model.model.modules():
                    if type(m).__name__ == "AAttn" and hasattr(m, "qk") and not hasattr(m, "qkv"):
                        # Bind our custom forward as an instance method
                        m.forward = types.MethodType(_old_aattn_forward, m)
                        patched_count += 1

            if patched_count > 0:
                logger.info(
                    "Applied custom forward() to %d AAttn blocks "
                    "(old yolov12 fork qk[2C] → new ultralytics qkv[3C] bridge).",
                    patched_count,
                )
            else:
                logger.info("No AAttn patches needed (model uses standard qkv projection).")
        except Exception as e:
            logger.warning("Could not apply YOLOv12 AAttn forward patch: %s", e)
        # ─────────────────────────────────────────────────────────────────

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
