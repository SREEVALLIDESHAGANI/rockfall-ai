"""Reproducible synthetic development dataset for Rockfall-AI.

IMPORTANT: This generator produces SAMPLE / SYNTHETIC data for software
development and academic demonstration. It is NOT a substitute for a
validated field dataset. Do not treat generated labels as measured
rockfall events.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "slope_angle_deg",
    "slope_height_m",
    "ucs_mpa",
    "discontinuity_spacing_m",
    "discontinuity_orientation_index",
    "weathering_grade",
    "rainfall_mm",
    "groundwater_index",
    "vegetation_cover",
    "seismic_pga_g",
]

TARGET_COLUMN = "risk_level"
RISK_LABELS = ("LOW", "MEDIUM", "HIGH")

RAW_COLUMNS = FEATURE_COLUMNS + [
    "latitude",
    "longitude",
    TARGET_COLUMN,
]


def _latent_hazard_score(df: pd.DataFrame) -> np.ndarray:
    """Physically inspired scoring used only to assign synthetic labels.

    The weights encode qualitative geotechnical relationships commonly
    discussed in slope-hazard literature (steeper/taller slopes, weaker
    rock, closer discontinuities, unfavorable orientation, weathering,
    water, sparse vegetation, seismic loading). They are NOT calibrated
    to a specific site or design code.
    """
    slope_term = (df["slope_angle_deg"] / 90.0) * np.log1p(df["slope_height_m"])
    strength_term = 1.0 / (1.0 + df["ucs_mpa"] / 40.0)
    fracture_term = 1.0 / (0.05 + df["discontinuity_spacing_m"])
    kinematic_term = df["discontinuity_orientation_index"]
    weathering_term = df["weathering_grade"] / 5.0
    hydro_term = (df["rainfall_mm"] / 2500.0) * (0.3 + df["groundwater_index"])
    vegetation_term = 1.0 - df["vegetation_cover"]
    seismic_term = df["seismic_pga_g"] / 0.6

    score = (
        1.35 * slope_term
        + 1.10 * strength_term
        + 0.85 * np.clip(fracture_term / 8.0, 0, 1)
        + 0.95 * kinematic_term
        + 0.70 * weathering_term
        + 0.90 * hydro_term
        + 0.45 * vegetation_term
        + 0.55 * seismic_term
    )
    return score.to_numpy(dtype=float)


def generate_synthetic_dataset(
    n_samples: int = 1600,
    seed: int = 42,
    missing_rate: float = 0.03,
    duplicate_rate: float = 0.01,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    slope_angle = rng.uniform(18, 85, n_samples)
    slope_height = rng.gamma(shape=2.2, scale=18.0, size=n_samples)
    slope_height = np.clip(slope_height, 5, 220)
    ucs = rng.lognormal(mean=3.4, sigma=0.55, size=n_samples)
    ucs = np.clip(ucs, 8, 220)
    spacing = rng.lognormal(mean=-0.4, sigma=0.7, size=n_samples)
    spacing = np.clip(spacing, 0.05, 4.5)
    orientation = rng.beta(2.0, 2.2, n_samples)
    weathering = rng.integers(1, 6, n_samples).astype(float)
    rainfall = rng.gamma(shape=3.5, scale=280.0, size=n_samples)
    rainfall = np.clip(rainfall, 80, 3200)
    groundwater = rng.beta(2.0, 2.5, n_samples)
    vegetation = rng.beta(2.4, 2.0, n_samples)
    pga = rng.gamma(shape=2.0, scale=0.08, size=n_samples)
    pga = np.clip(pga, 0.01, 0.7)

    # Optional location context for the map UI (synthetic Himalayan-ish band).
    latitude = rng.uniform(28.0, 34.5, n_samples)
    longitude = rng.uniform(76.0, 88.5, n_samples)

    df = pd.DataFrame(
        {
            "slope_angle_deg": slope_angle,
            "slope_height_m": slope_height,
            "ucs_mpa": ucs,
            "discontinuity_spacing_m": spacing,
            "discontinuity_orientation_index": orientation,
            "weathering_grade": weathering,
            "rainfall_mm": rainfall,
            "groundwater_index": groundwater,
            "vegetation_cover": vegetation,
            "seismic_pga_g": pga,
            "latitude": latitude,
            "longitude": longitude,
        }
    )

    score = _latent_hazard_score(df)
    score = score + rng.normal(0, 0.22, n_samples)

    # Thresholds chosen so classes are usable but not perfectly balanced.
    q_low, q_high = np.quantile(score, [0.38, 0.78])
    labels = np.where(score < q_low, "LOW", np.where(score < q_high, "MEDIUM", "HIGH"))
    df[TARGET_COLUMN] = labels

    # Inject missing values for the cleaning pipeline to handle.
    numeric_cols = FEATURE_COLUMNS
    n_missing = int(n_samples * missing_rate * len(numeric_cols))
    if n_missing > 0:
        row_idx = rng.integers(0, n_samples, n_missing)
        col_idx = rng.integers(0, len(numeric_cols), n_missing)
        for r, c in zip(row_idx, col_idx):
            df.iat[r, df.columns.get_loc(numeric_cols[c])] = np.nan

    n_dup = max(1, int(n_samples * duplicate_rate))
    dup = df.sample(n=n_dup, random_state=seed)
    df = pd.concat([df, dup], ignore_index=True)

    df.attrs["dataset_kind"] = "synthetic_sample"
    df.attrs["disclaimer"] = (
        "The development dataset is synthetic/sample data and is not a "
        "substitute for a validated field dataset."
    )
    return df


def save_raw_dataset(path: Path, **kwargs) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    df = generate_synthetic_dataset(**kwargs)
    df.to_csv(path, index=False)
    readme = path.parent / "DATASET_NOTICE.txt"
    readme.write_text(
        "SYNTHETIC / SAMPLE DEVELOPMENT DATASET\n\n"
        "The development dataset is synthetic/sample data and is not a "
        "substitute for a validated field dataset.\n"
        "Labels were assigned by a reproducible scoring function plus noise.\n"
        "They are not observed rockfall inventories.\n",
        encoding="utf-8",
    )
    return path


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[2]
    out = root / "data" / "raw" / "rockfall_synthetic_sample.csv"
    save_raw_dataset(out)
    print(f"Wrote {out}")
