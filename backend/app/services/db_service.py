import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from pymongo import DESCENDING, errors as pymongo_errors

from ..core.config import settings

logger = logging.getLogger(__name__)


class DBService:
    """
    Async MongoDB service backed by Motor (asyncio driver).

    Connection is established once at startup and reused across all requests
    through Motor's built-in connection pooling.
    """

    def __init__(self) -> None:
        self.client: Optional[AsyncIOMotorClient] = None
        self._collection: Optional[AsyncIOMotorCollection] = None

    def connect(self) -> None:
        """
        Initialise the Motor client and resolve the target collection.

        Motor defers the actual TCP handshake until the first operation, so
        startup is fast. The `serverSelectionTimeoutMS` governs how long the
        driver will wait before raising a `ServerSelectionTimeoutError`.
        """
        logger.info("Connecting to MongoDB Atlas...")
        self.client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=settings.MONGO_TIMEOUT_MS,
        )
        self._collection = (
            self.client[settings.DATABASE_NAME][settings.COLLECTION_NAME]
        )
        logger.info(
            "MongoDB client ready (db=%s, collection=%s).",
            settings.DATABASE_NAME,
            settings.COLLECTION_NAME,
        )

    def close(self) -> None:
        """Gracefully close the Motor connection pool on shutdown."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

    @property
    def collection(self) -> AsyncIOMotorCollection:
        if self._collection is None:
            raise RuntimeError("DBService is not connected. Call connect() first.")
        return self._collection

    async def log_detection(
        self,
        *,
        image_url: str,
        latitude: float,
        longitude: float,
        detections: List[Dict[str, Any]],
        severity: str,
    ) -> str:
        """
        Persist one pothole detection event to MongoDB.

        The document follows the GeoJSON Point spec for `location` so that
        a 2dsphere index can be created in Atlas for geospatial queries.

        Returns:
            The inserted document's ``_id`` as a string.

        Raises:
            pymongo.errors.PyMongoError: on any database-level error.
        """
        document: Dict[str, Any] = {
            "image_url": image_url,
            "latitude": round(latitude, 6),
            "longitude": round(longitude, 6),
            "location": {                                   # GeoJSON Point
                "type": "Point",
                "coordinates": [round(longitude, 6), round(latitude, 6)],
            },
            "detections": detections,
            "detection_count": len(detections),
            "severity": severity,
            "timestamp": datetime.now(timezone.utc),
        }

        try:
            result = await self.collection.insert_one(document)
            inserted_id = str(result.inserted_id)
            logger.debug("Inserted detection document _id=%s", inserted_id)
            return inserted_id
        except pymongo_errors.PyMongoError as exc:
            logger.error("MongoDB insert_one failed: %s", exc, exc_info=True)
            raise

    async def get_all_potholes(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Return the *limit* most recent pothole records, sorted newest-first.

        ``_id`` (ObjectId) is converted to a string so the response is
        JSON-serialisable out of the box.

        Raises:
            pymongo.errors.PyMongoError: on any database-level error.
        """
        try:
            cursor = (
                self.collection
                .find({}, {"_id": 1, "image_url": 1, "latitude": 1, "longitude": 1,
                           "severity": 1, "timestamp": 1, "detections": 1})
                .sort("timestamp", DESCENDING)
                .limit(limit)
            )
            records: List[Dict[str, Any]] = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                records.append(doc)
            logger.debug("get_all_potholes returned %d records.", len(records))
            return records
        except pymongo_errors.PyMongoError as exc:
            logger.error("MongoDB find failed: %s", exc, exc_info=True)
            raise


# ── Module-level singleton ─────────────────────────────────────────────────────
db_service = DBService()
