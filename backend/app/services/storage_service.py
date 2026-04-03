import cloudinary
import cloudinary.uploader
import io
from ..core.config import settings

class StorageService:
    def __init__(self):
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )

    async def upload_image(self, file_bytes: bytes, filename: str) -> str:
        """Stream image to Cloudinary for auto-quality compression."""
        def upload():
            result = cloudinary.uploader.upload(
                file=io.BytesIO(file_bytes),
                public_id=f"pothole_{filename}",
                folder="potholes",
                quality="auto",  # Cloudinary applies auto-quality (80% reduction typically)
                fetch_format="webp" # Force WebP format for high compression
            )
            return result.get("secure_url")

        import asyncio
        return await asyncio.to_thread(upload)

# Singleton instance
storage_service = StorageService()
