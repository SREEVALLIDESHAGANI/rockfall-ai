from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from backend.app.config import PROJECT_ROOT, get_settings
from backend.app.schemas.prediction import PredictRequest
from ml.preprocessing.clean import add_engineered_features
from ml.src.generate_dataset import FEATURE_COLUMNS

logger = logging.getLogger("rockfall_ai")

RISK_TO_INT = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}

MESSAGES = {
    "LOW": "Modelled rockfall hazard is comparatively low for the supplied parameters.",
    "MEDIUM": "Modelled rockfall hazard is moderate. Review site conditions and monitoring needs.",
    "HIGH": "Elevated modelled rockfall hazard based on the supplied parameters.",
}

RECOMMENDATIONS = {
    "LOW": [
        "Treat this as a screening result only; confirm with a site inspection if people or assets are exposed.",
        "Keep drainage and vegetation in a maintained condition.",
        "Re-run the assessment if rainfall, excavation, or blasting conditions change.",
    ],
    "MEDIUM": [
        "Commission a qualified geotechnical / engineering-geology review before relying on this slope.",
        "Inspect discontinuities, catchment, and any existing protection measures.",
        "Consider monitoring after heavy rainfall or seismic events.",
        "Do not treat this score as a design value for barriers or berms.",
    ],
    "HIGH": [
        "Restrict access until a qualified professional has assessed the slope.",
        "Prioritise field mapping of discontinuities, groundwater, and trigger history.",
        "Evaluate engineered protection or slope treatment only through a licensed designer.",
        "This prototype cannot size rockfall fences, ditches, or anchors.",
    ],
}

DISCLAIMER = (
    "Rockfall-AI is an academic decision-support prototype. It does not replace "
    "professional geotechnical engineering, engineering geology, or statutory design. "
    "The development model was trained on synthetic/sample data and is not validated "
    "against a real rockfall inventory."
)


class ModelNotAvailableError(RuntimeError):
    pass


class PredictionService:
    def __init__(self) -> None:
        self.artifact: dict[str, Any] | None = None
        self.metrics: dict[str, Any] | None = None
        self._load()

    def _load(self) -> None:
        settings = get_settings()
        path = settings.resolved_model_path
        if not path.exists():
            logger.error("Model file missing at %s", path)
            self.artifact = None
            return
        self.artifact = joblib.load(path)
        metrics_path = PROJECT_ROOT / "ml" / "evaluation" / "metrics.json"
        if metrics_path.exists():
            self.metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        logger.info("Loaded model %s from %s", self.artifact.get("model_name"), path)

    @property
    def loaded(self) -> bool:
        return self.artifact is not None

    def require_artifact(self) -> dict[str, Any]:
        if not self.artifact:
            raise ModelNotAvailableError("The prediction model is not loaded.")
        return self.artifact

    def info(self) -> dict[str, Any]:
        artifact = self.require_artifact()
        return {
            "model_name": artifact["model_name"],
            "dataset_kind": artifact.get("dataset_kind", "unknown"),
            "dataset_disclaimer": artifact.get("dataset_disclaimer", DISCLAIMER),
            "class_labels": artifact.get("class_labels", []),
            "feature_names": artifact.get("feature_names", []),
            "feature_importance": artifact.get("feature_importance"),
            "test_metrics": None if not self.metrics else self.metrics.get("test_metrics"),
            "candidate_metrics": None if not self.metrics else self.metrics.get("candidate_metrics"),
            "selection_reason": artifact.get("selection_reason"),
        }

    def predict(self, payload: PredictRequest) -> dict[str, Any]:
        artifact = self.require_artifact()
        row = payload.model_dump()
        features = {name: row[name] for name in FEATURE_COLUMNS}
        frame = add_engineered_features(pd.DataFrame([features]))
        feature_names = artifact["feature_names"]
        pipeline = artifact["pipeline"]
        risk_level = str(pipeline.predict(frame[feature_names])[0])
        proba = pipeline.predict_proba(frame[feature_names])[0]
        labels = [str(x) for x in pipeline.classes_]
        probabilities = {label: float(p) for label, p in zip(labels, proba)}
        contributors = self._contributors(frame, artifact)
        return {
            "prediction": RISK_TO_INT.get(risk_level, -1),
            "risk_level": risk_level,
            "probability": float(probabilities.get(risk_level, 0.0)),
            "class_probabilities": probabilities,
            "message": MESSAGES[risk_level],
            "explanation": self._explain(risk_level, contributors),
            "contributing_factors": contributors,
            "recommendations": RECOMMENDATIONS[risk_level],
            "disclaimer": DISCLAIMER,
            "inputs": {k: row[k] for k in list(features) + ["latitude", "longitude", "location_label"]},
            "model_name": artifact["model_name"],
            "dataset_kind": artifact.get("dataset_kind", "synthetic_sample"),
        }

    def _contributors(self, frame: pd.DataFrame, artifact: dict[str, Any]) -> list[dict]:
        importance = artifact.get("feature_importance") or {}
        ranked = sorted(importance.items(), key=lambda kv: kv[1], reverse=True)
        top = []
        for name, weight in ranked[:5]:
            if name not in frame.columns:
                continue
            top.append(
                {
                    "feature": name,
                    "importance": round(float(weight), 4),
                    "value": round(float(frame.iloc[0][name]), 4),
                }
            )
        return top

    def _explain(self, risk_level: str, contributors: list[dict]) -> str:
        if not contributors:
            return (
                f"The classifier assigned {risk_level} using the trained pipeline. "
                "Global feature importances were not available for this estimator."
            )
        names = ", ".join(item["feature"] for item in contributors[:3])
        return (
            f"The classifier assigned {risk_level}. Among features the selected model "
            f"weighted most strongly globally were: {names}. Local influence is not a "
            "causal geotechnical diagnosis."
        )


prediction_service = PredictionService()
