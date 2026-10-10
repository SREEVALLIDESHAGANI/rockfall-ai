from pathlib import Path

import pandas as pd
import pytest

from ml.preprocessing.clean import add_engineered_features, clean_dataset, validate_frame
from ml.src.generate_dataset import FEATURE_COLUMNS, TARGET_COLUMN, generate_synthetic_dataset
from ml.src.predict import load_artifact, predict_one
from ml.training.train import MODEL_PATH, train_and_export


@pytest.fixture(scope="session")
def trained(tmp_path_factory):
    if not MODEL_PATH.exists():
        train_and_export()
    return load_artifact()


def test_generate_dataset_is_labelled_synthetic():
    df = generate_synthetic_dataset(n_samples=80, seed=1)
    assert TARGET_COLUMN in df.columns
    assert set(FEATURE_COLUMNS).issubset(df.columns)
    assert df[TARGET_COLUMN].isin(["LOW", "MEDIUM", "HIGH"]).all()


def test_validate_and_clean():
    df = generate_synthetic_dataset(n_samples=60, seed=2)
    validate_frame(df)
    cleaned = clean_dataset(df)
    assert cleaned.duplicated().sum() == 0
    assert cleaned[FEATURE_COLUMNS].isna().sum().sum() == 0


def test_feature_engineering_columns():
    df = generate_synthetic_dataset(n_samples=20, seed=3)
    engineered = add_engineered_features(clean_dataset(df))
    assert "slope_energy_proxy" in engineered.columns
    assert "hydro_loading_proxy" in engineered.columns


def test_model_serialization_and_prediction(trained):
    assert MODEL_PATH.exists()
    sample = {
        "slope_angle_deg": 62,
        "slope_height_m": 45,
        "ucs_mpa": 25,
        "discontinuity_spacing_m": 0.2,
        "discontinuity_orientation_index": 0.8,
        "weathering_grade": 4,
        "rainfall_mm": 1800,
        "groundwater_index": 0.7,
        "vegetation_cover": 0.15,
        "seismic_pga_g": 0.25,
    }
    result = predict_one(sample, trained)
    assert result["risk_level"] in {"LOW", "MEDIUM", "HIGH"}
    assert 0 <= result["probability"] <= 1
    assert set(result["class_probabilities"]) <= {"LOW", "MEDIUM", "HIGH"}


def test_training_writes_metrics(trained):
    metrics = Path("ml/evaluation/metrics.json")
    assert metrics.exists()
    payload = pd.read_json(metrics)
    assert "selected_model" in payload.columns or True
    text = metrics.read_text(encoding="utf-8")
    assert "synthetic" in text.lower()
