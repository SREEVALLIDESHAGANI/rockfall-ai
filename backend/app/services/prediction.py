from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from backend.app.config import PROJECT_ROOT, get_settings
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
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


def _patch_pipeline(pipeline: Any) -> None:
    """Ensure cross-version scikit-learn compatibility for unpickled estimators."""
    try:
        def patch_step(obj: Any) -> None:
            if "SimpleImputer" in type(obj).__name__:
                default_dtype = getattr(obj, "statistics_", np.array([0.0])).dtype
                if not hasattr(obj, "_fill_dtype"):
                    setattr(obj, "_fill_dtype", getattr(obj, "_fit_dtype", default_dtype))
                if not hasattr(obj, "_fit_dtype"):
                    setattr(obj, "_fit_dtype", getattr(obj, "_fill_dtype", default_dtype))

        if hasattr(pipeline, "named_steps"):
            for step in pipeline.named_steps.values():
                patch_step(step)
                if hasattr(step, "transformers_"):
                    for _, transformer, _ in step.transformers_:
                        patch_step(transformer)
                        if hasattr(transformer, "named_steps"):
                            for sub in transformer.named_steps.values():
                                patch_step(sub)
    except Exception as e:
        logger.warning("Pipeline patch notice: %s", e)


class PredictionService:
    def __init__(self) -> None:
        self.artifact: dict[str, Any] | None = None
        self.metrics: dict[str, Any] | None = None
        self._load()

    def _load(self) -> None:
        settings = get_settings()
        path = settings.resolved_model_path
        metrics_path = PROJECT_ROOT / "ml" / "evaluation" / "metrics.json"

        loaded_ok = False
        if path.exists():
            try:
                self.artifact = joblib.load(path)
                _patch_pipeline(self.artifact.get("pipeline"))
                # Smoke-test prediction with zero-vector to guarantee runtime compatibility
                if "feature_names" in self.artifact and "pipeline" in self.artifact:
                    dummy = pd.DataFrame([{col: 0.0 for col in self.artifact["feature_names"]}])
                    self.artifact["pipeline"].predict(dummy)
                loaded_ok = True
                logger.info("Loaded model %s from %s", self.artifact.get("model_name"), path)
            except Exception as exc:
                logger.warning("Pre-built model incompatible with runtime scikit-learn (%s). Retraining natively...", exc)

        if not loaded_ok:
            logger.info("Training fresh native model in runtime environment...")
            try:
                from ml.training.train import train_and_export
                self.artifact = train_and_export()
                _patch_pipeline(self.artifact.get("pipeline"))
                logger.info("Native model trained and initialized successfully: %s", self.artifact.get("model_name"))
            except Exception as train_exc:
                logger.error("Failed to train native model: %s", train_exc)
                if not self.artifact:
                    return

        if metrics_path.exists():
            try:
                self.metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
            except Exception:
                self.metrics = None

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
        try:
            risk_level = str(pipeline.predict(frame[feature_names])[0])
            proba = pipeline.predict_proba(frame[feature_names])[0]
        except (AttributeError, ValueError):
            _patch_pipeline(pipeline)
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
