from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]


class PredictRequest(BaseModel):
    slope_angle_deg: float = Field(..., ge=10, le=89, description="Slope face angle in degrees")
    slope_height_m: float = Field(..., ge=2, le=400, description="Vertical slope height in metres")
    ucs_mpa: float = Field(..., ge=1, le=350, description="Uniaxial compressive strength of intact rock (MPa)")
    discontinuity_spacing_m: float = Field(..., ge=0.02, le=8, description="Mean discontinuity spacing in metres")
    discontinuity_orientation_index: float = Field(
        ...,
        ge=0,
        le=1,
        description="0 = favourable orientation, 1 = highly unfavourable / daylighting",
    )
    weathering_grade: float = Field(..., ge=1, le=5, description="Weathering grade from 1 (fresh) to 5 (completely weathered)")
    rainfall_mm: float = Field(..., ge=0, le=5000, description="Representative annual or design rainfall (mm)")
    groundwater_index: float = Field(..., ge=0, le=1, description="Relative groundwater / moisture influence (0 dry – 1 saturated)")
    vegetation_cover: float = Field(..., ge=0, le=1, description="Relative vegetation cover (0 none – 1 dense)")
    seismic_pga_g: float = Field(..., ge=0, le=1.5, description="Peak ground acceleration in g")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Optional site latitude for map context")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Optional site longitude for map context")
    location_label: Optional[str] = Field(None, max_length=200)

    @field_validator("weathering_grade")
    @classmethod
    def weathering_is_whole_grade(cls, value: float) -> float:
        if abs(value - round(value)) > 1e-6:
            raise ValueError("weathering_grade must be an integer from 1 to 5")
        return float(int(round(value)))


class PredictResponse(BaseModel):
    prediction: int
    risk_level: RiskLevel
    probability: float
    class_probabilities: dict[str, float]
    message: str
    explanation: str
    contributing_factors: list[dict]
    recommendations: list[str]
    disclaimer: str
    inputs: dict
    model_name: str
    dataset_kind: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: Optional[str] = None
    dataset_kind: Optional[str] = None


class ModelInfoResponse(BaseModel):
    model_name: str
    dataset_kind: str
    dataset_disclaimer: str
    class_labels: list[str]
    feature_names: list[str]
    feature_importance: Optional[dict[str, float]] = None
    test_metrics: Optional[dict] = None
    candidate_metrics: Optional[list[dict]] = None
    selection_reason: Optional[str] = None
