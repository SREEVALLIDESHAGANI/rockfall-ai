import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.api.routes import router
from backend.app.config import get_settings
from backend.app.services.prediction import prediction_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("rockfall_ai")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not prediction_service.loaded:
        logger.warning("API started without a loaded model. POST /predict will return 503.")
    yield


settings = get_settings()
app = FastAPI(
    title="Rockfall-AI: Open-Pit Mine Early Warning System",
    description=(
        "AI-Based Rockfall Prediction and Alert System for Open-Pit Mines (Team 19, Anurag University). "
        "Evaluates geotechnical parameters, structural discontinuities, and dynamic triggers."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=500, content={"detail": "An unexpected server error occurred."})


# Include API Routes
app.include_router(router)

# Serve Frontend Production Assets (Single-Process Unified Deployment)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    logger.info("Mounting production frontend build from %s", frontend_dist)
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")
    if (frontend_dist / "evaluation").exists():
        app.mount("/evaluation", StaticFiles(directory=frontend_dist / "evaluation"), name="evaluation")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
