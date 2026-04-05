import asyncio
import io
import logging
from typing import Optional

import cloudinary
import cloudinary.uploader

from ..core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """
    Thin async wrapper around the Cloudinary upload SDK.

    Cloudinary's Python SDK is synchronous, so every upload is dispatched
    to `asyncio.to_thread` to keep the FastAPI event loop non-blocking.
    """

    def __init__(self) -> None:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,  # Always use HTTPS URLs
        )
        logger.info("Cloudinary configured (cloud=%s).", settings.CLOUDINARY_CLOUD_NAME)

    async def upload_image(
        self,
        file_bytes: bytes,
        filename: str,
        folder: str = "potholes",
    ) -> str:
        """
        Upload *file_bytes* to Cloudinary and return the secure CDN URL.

        Images are automatically:
        - Converted to WebP for ~70-80 % size savings.
        - Compressed with Cloudinary's auto-quality algorithm.

        Args:
            file_bytes: Raw image bytes (JPEG / PNG / WebP).
            filename:   Public-ID base name (no extension needed).
            folder:     Cloudinary folder to organise uploads.

        Returns:
            Secure HTTPS URL string of the uploaded asset.

        Raises:
            RuntimeError: If Cloudinary returns no URL (upload failed silently).
            Exception:    Propagates any Cloudinary SDK exception to the caller.
        """

        def _upload() -> Optional[str]:
            result = cloudinary.uploader.upload(
                file=io.BytesIO(file_bytes),
                public_id=f"pothole_{filename}",
                folder=folder,
                quality="auto",        # Cloudinary auto-quality compression
                fetch_format="webp",   # Force WebP for maximum compression
                overwrite=False,       # Prevent accidental overwrites
                resource_type="image",
            )
            return result.get("secure_url")

        logger.debug("Uploading image '%s' to Cloudinary (folder='%s')...", filename, folder)
        url: Optional[str] = await asyncio.to_thread(_upload)

        if not url:
            raise RuntimeError(
                f"Cloudinary upload of '{filename}' succeeded but returned no URL."
            )

        logger.debug("Cloudinary upload complete: %s", url)
        return url


# ── Module-level singleton ─────────────────────────────────────────────────────
storage_service = StorageService()
