from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .api.routes import router
from .core.config import settings
from .services.ai_service import ai_service
from .services.db_service import db_service
import logging
import time

# ── Structured Logging Setup ──────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan: Startup / Shutdown ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Singleton resource lifecycle:
    - Load YOLO model into RAM once at startup (avoids per-request overhead).
    - Connect to MongoDB Atlas connection pool.
    - Gracefully release on shutdown.
    """
    logger.info("=== Application Startup ===")
    logger.info(f"Environment : {settings.ENVIRONMENT}")
    logger.info(f"Model path  : {settings.MODEL_PATH}")

    try:
        ai_service.load_model(settings.MODEL_PATH)
        logger.info("✅ YOLO model loaded successfully.")
    except Exception as exc:
        logger.critical(f"❌ Failed to load YOLO model: {exc}", exc_info=True)
        raise  # Hard-stop — app is useless without the model

    try:
        db_service.connect()
        logger.info("✅ MongoDB connection pool established.")
    except Exception as exc:
        logger.critical(f"❌ Failed to connect to MongoDB: {exc}", exc_info=True)
        raise  # Hard-stop — logging is part of the contract

    yield  # <── app is running

    logger.info("=== Application Shutdown ===")
    db_service.close()
    logger.info("✅ MongoDB connection closed.")


# ── FastAPI App Instance ───────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Edge-to-Cloud road surface monitoring API. "
        "Accepts road images, runs YOLOv12 inference, stores results in MongoDB, "
        "and exposes geospatial pothole data for dashboard visualisation."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ── Middleware: CORS ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)


# ── Middleware: Request Logging & Timing ──────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every incoming request and its processing time."""
    start = time.perf_counter()
    logger.info(f"→ {request.method} {request.url.path}")
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error(f"Unhandled exception during {request.method} {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})
    elapsed = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time"] = f"{elapsed:.2f}ms"
    logger.info(f"← {response.status_code} {request.url.path} [{elapsed:.2f}ms]")
    return response


# ── Global Exception Handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(router, prefix="/api/v1", tags=["Pothole Detection"])


# ── Health & Root ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """Lightweight liveness probe for container orchestration."""
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["System"])
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}", "docs": "/docs"}


# ── Entry point (local dev only) ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
    )
