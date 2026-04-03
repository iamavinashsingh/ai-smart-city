from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .api.routes import router
from .core.config import settings
from .services.ai_service import ai_service
from .services.db_service import db_service
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Singleton Resource Lifecycle:
    - Load YOLO model into RAM once.
    - Connect to MongoDB Atlas.
    """
    logger.info("Starting up: Loading model and connecting to database...")
    try:
        # Load AI Model (Singleton)
        ai_service.load_model(settings.MODEL_PATH)
        
        # Initialize Database connection
        db_service.connect()
        
        logger.info("Successfully loaded AI model and connected to MongoDB.")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        # Note: In production you might want to stop the server here
        
    yield
    
    # Cleanup (if needed)
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None
)

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router
app.include_router(router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-04-03"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
