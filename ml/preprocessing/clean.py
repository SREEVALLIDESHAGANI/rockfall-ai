"""Data validation, cleaning, and feature engineering (no leakage)."""

from __future__ import annotations

import pandas as pd

from ml.src.generate_dataset import FEATURE_COLUMNS, TARGET_COLUMN, RISK_LABELS

VALID_RANGES = {
    "slope_angle_deg": (10.0, 89.0),
    "slope_height_m": (2.0, 400.0),
    "ucs_mpa": (1.0, 350.0),
    "discontinuity_spacing_m": (0.02, 8.0),
    "discontinuity_orientation_index": (0.0, 1.0),
    "weathering_grade": (1.0, 5.0),
    "rainfall_mm": (0.0, 5000.0),
    "groundwater_index": (0.0, 1.0),
    "vegetation_cover": (0.0, 1.0),
    "seismic_pga_g": (0.0, 1.5),
}

ENGINEERED_COLUMNS = [
    "slope_energy_proxy",
    "hydro_loading_proxy",
    "kinematic_weakness_proxy",
]


def validate_frame(df: pd.DataFrame, require_target: bool = True) -> None:
    missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required feature columns: {missing}")
    if require_target and TARGET_COLUMN not in df.columns:
        raise ValueError(f"Missing target column: {TARGET_COLUMN}")


def clean_dataset(df: pd.DataFrame, require_target: bool = True) -> pd.DataFrame:
    validate_frame(df, require_target=require_target)
    cleaned = df.copy()
    cleaned = cleaned.drop_duplicates()

    for col, (lo, hi) in VALID_RANGES.items():
        if col in cleaned.columns:
            cleaned.loc[cleaned[col] < lo, col] = pd.NA
            cleaned.loc[cleaned[col] > hi, col] = pd.NA

    # Median imputation fitted only on the provided frame. Training uses
    # this after the train split so medians come from training data only.
    for col in FEATURE_COLUMNS:
        if cleaned[col].isna().any():
            cleaned[col] = cleaned[col].fillna(cleaned[col].median())

    if require_target:
        cleaned = cleaned[cleaned[TARGET_COLUMN].isin(RISK_LABELS)]
        cleaned[TARGET_COLUMN] = cleaned[TARGET_COLUMN].astype(str)

    return cleaned.reset_index(drop=True)


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["slope_energy_proxy"] = (out["slope_angle_deg"] / 90.0) * (
        1.0 + out["slope_height_m"]
    ).clip(lower=1.0).pow(0.5)
    out["hydro_loading_proxy"] = (out["rainfall_mm"] / 2500.0) * (
        0.25 + out["groundwater_index"]
    )
    out["kinematic_weakness_proxy"] = out["discontinuity_orientation_index"] * (
        1.0 / (0.08 + out["discontinuity_spacing_m"])
    )
    return out


def model_feature_columns() -> list[str]:
    return FEATURE_COLUMNS + ENGINEERED_COLUMNS
