"""Load a trained artifact and run a single prediction (used by tests/CLI)."""

from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd

from ml.preprocessing.clean import add_engineered_features
from ml.src.generate_dataset import FEATURE_COLUMNS

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL = PROJECT_ROOT / "ml" / "models" / "rockfall_pipeline.joblib"


def load_artifact(path: Path | None = None) -> dict:
    model_path = path or DEFAULT_MODEL
    if not model_path.exists():
        raise FileNotFoundError(f"Model artifact not found: {model_path}")
    return joblib.load(model_path)


def predict_one(features: dict, artifact: dict | None = None) -> dict:
    artifact = artifact or load_artifact()
    row = {name: features[name] for name in FEATURE_COLUMNS}
    frame = add_engineered_features(pd.DataFrame([row]))
    pipeline = artifact["pipeline"]
    pred = pipeline.predict(frame[artifact["feature_names"]])[0]
    proba = pipeline.predict_proba(frame[artifact["feature_names"]])[0]
    labels = list(pipeline.classes_)
    probabilities = {str(label): float(p) for label, p in zip(labels, proba)}
    return {
        "risk_level": str(pred),
        "probability": float(probabilities[str(pred)]),
        "class_probabilities": probabilities,
    }
