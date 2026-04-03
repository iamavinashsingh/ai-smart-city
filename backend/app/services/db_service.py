from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import List, Dict
from ..core.config import settings

class DBService:
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None

    def connect(self):
        """Establish connection to MongoDB Atlas."""
        self.client = AsyncIOMotorClient(settings.MONGO_URI)
        self.db = self.client[settings.DATABASE_NAME]
        self.collection = self.db[settings.COLLECTION_NAME]

    async def log_detection(self, 
                             image_url: str, 
                             latitude: float, 
                             longitude: float, 
                             detections: List[Dict],
                             severity: str):
        """Create a single geospatial document for the detection."""
        document = {
            "image_url": image_url,
            "latitude": latitude,
            "longitude": longitude,
            "location": {
                "type": "Point",
                "coordinates": [longitude, latitude] # GeoJSON format: [lng, lat]
            },
            "detections": detections,
            "severity": severity,
            "timestamp": datetime.utcnow()
        }
        result = await self.collection.insert_one(document)
        return str(result.inserted_id)

    async def get_all_potholes(self, limit: int = 50):
        """Fetch historical records for Map Grid visualization."""
        cursor = self.collection.find().sort("timestamp", -1).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

# Singleton instance
db_service = DBService()
