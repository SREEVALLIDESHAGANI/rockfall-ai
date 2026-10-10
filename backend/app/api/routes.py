from fastapi import APIRouter, HTTPException

from backend.app.schemas.prediction import (
    HealthResponse,
    ModelInfoResponse,
    PredictRequest,
    PredictResponse,
)
from backend.app.services.prediction import ModelNotAvailableError, prediction_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    loaded = prediction_service.loaded
    name = None
    kind = None
    if loaded and prediction_service.artifact:
        name = prediction_service.artifact.get("model_name")
        kind = prediction_service.artifact.get("dataset_kind")
    return HealthResponse(
        status="ok" if loaded else "degraded",
        model_loaded=loaded,
        model_name=name,
        dataset_kind=kind,
    )


@router.get("/model/info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    try:
        return ModelInfoResponse(**prediction_service.info())
    except ModelNotAvailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    try:
        return PredictResponse(**prediction_service.predict(payload))
    except ModelNotAvailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
