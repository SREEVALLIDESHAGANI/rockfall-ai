"""Train, compare, and serialize rockfall risk classifiers."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

from ml.preprocessing.clean import add_engineered_features, model_feature_columns
from ml.src.generate_dataset import (
    FEATURE_COLUMNS,
    RISK_LABELS,
    TARGET_COLUMN,
    generate_synthetic_dataset,
    save_raw_dataset,
)

RANDOM_STATE = 42
PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_PATH = PROJECT_ROOT / "data" / "raw" / "rockfall_synthetic_sample.csv"
PROCESSED_PATH = PROJECT_ROOT / "data" / "processed" / "rockfall_clean.csv"
SAMPLE_PATH = PROJECT_ROOT / "data" / "sample" / "prediction_examples.csv"
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "rockfall_pipeline.joblib"
METRICS_PATH = PROJECT_ROOT / "ml" / "evaluation" / "metrics.json"
PLOTS_DIR = PROJECT_ROOT / "ml" / "evaluation" / "plots"


def _load_or_create_raw() -> pd.DataFrame:
    if RAW_PATH.exists():
        df = pd.read_csv(RAW_PATH)
        notice = RAW_PATH.parent / "DATASET_NOTICE.txt"
        if not notice.exists():
            notice.write_text(
                "The development dataset is synthetic/sample data and is not a "
                "substitute for a validated field dataset.\n",
                encoding="utf-8",
            )
        return df
    save_raw_dataset(RAW_PATH)
    return pd.read_csv(RAW_PATH)


def _clean_with_train_statistics(train: pd.DataFrame, test: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    train_c = train.drop_duplicates().copy()
    test_c = test.drop_duplicates().copy()
    medians = {}
    for col in FEATURE_COLUMNS:
        medians[col] = train_c[col].median()
        train_c[col] = train_c[col].fillna(medians[col])
        test_c[col] = test_c[col].fillna(medians[col])
    train_c = train_c[train_c[TARGET_COLUMN].isin(RISK_LABELS)]
    test_c = test_c[test_c[TARGET_COLUMN].isin(RISK_LABELS)]
    return train_c.reset_index(drop=True), test_c.reset_index(drop=True)


def _build_candidates(random_state: int) -> dict[str, object]:
    return {
        "logistic_regression": LogisticRegression(
            max_iter=400,
            class_weight="balanced",
            solver="lbfgs",
        ),
        "decision_tree": DecisionTreeClassifier(
            max_depth=8,
            min_samples_leaf=12,
            class_weight="balanced",
            random_state=random_state,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=220,
            max_depth=12,
            min_samples_leaf=6,
            class_weight="balanced_subsample",
            random_state=random_state,
            n_jobs=-1,
        ),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=160,
            learning_rate=0.08,
            max_depth=3,
            random_state=random_state,
        ),
    }


def _preprocessor() -> ColumnTransformer:
    cols = model_feature_columns()
    numeric = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    return ColumnTransformer([("num", numeric, cols)], remainder="drop")


def _multiclass_auc(y_true, y_proba, labels) -> float | None:
    try:
        return float(
            roc_auc_score(y_true, y_proba, multi_class="ovr", average="macro", labels=labels)
        )
    except ValueError:
        return None


def _plot_confusion(cm, labels, path: Path) -> None:
    fig, ax = plt.subplots(figsize=(5.5, 4.5))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=labels)
    disp.plot(ax=ax, cmap="YlOrRd", colorbar=False)
    ax.set_title("Confusion matrix (held-out test, synthetic data)")
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def _plot_importances(names, values, path: Path) -> None:
    order = np.argsort(values)
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.barh(np.array(names)[order], np.array(values)[order], color="#b45309")
    ax.set_xlabel("Relative importance")
    ax.set_title("Feature importance (selected model, synthetic data)")
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def _plot_class_distribution(y: pd.Series, path: Path) -> None:
    counts = y.value_counts().reindex(RISK_LABELS)
    fig, ax = plt.subplots(figsize=(5, 4))
    ax.bar(counts.index.astype(str), counts.values, color=["#3f6212", "#b45309", "#9f1239"])
    ax.set_ylabel("Count")
    ax.set_title("Risk-class distribution (synthetic dataset)")
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def _plot_model_comparison(rows: list[dict], path: Path) -> None:
    names = [r["model"] for r in rows]
    f1s = [r["f1_macro"] for r in rows]
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.bar(names, f1s, color="#0f766e")
    ax.set_ylabel("Macro F1 (test)")
    ax.set_title("Model comparison on held-out synthetic test set")
    ax.set_ylim(0, 1)
    plt.xticks(rotation=20, ha="right")
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def _plot_feature_hist(df: pd.DataFrame, path: Path) -> None:
    cols = ["slope_angle_deg", "ucs_mpa", "rainfall_mm", "discontinuity_spacing_m"]
    fig, axes = plt.subplots(2, 2, figsize=(8, 6))
    for ax, col in zip(axes.ravel(), cols):
        ax.hist(df[col].dropna(), bins=30, color="#334155", edgecolor="white")
        ax.set_title(col)
    fig.suptitle("Selected feature distributions (synthetic data)")
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def train_and_export(random_state: int = RANDOM_STATE) -> dict:
    raw = _load_or_create_raw()
    raw = raw[raw[TARGET_COLUMN].isin(RISK_LABELS)].copy()

    train_df, test_df = train_test_split(
        raw,
        test_size=0.2,
        random_state=random_state,
        stratify=raw[TARGET_COLUMN],
    )
    train_df, test_df = _clean_with_train_statistics(train_df, test_df)
    train_df = add_engineered_features(train_df)
    test_df = add_engineered_features(test_df)

    feature_cols = model_feature_columns()
    x_train = train_df[feature_cols]
    y_train = train_df[TARGET_COLUMN]
    x_test = test_df[feature_cols]
    y_test = test_df[TARGET_COLUMN]

    processed = pd.concat([train_df, test_df], ignore_index=True)
    PROCESSED_PATH.parent.mkdir(parents=True, exist_ok=True)
    processed.to_csv(PROCESSED_PATH, index=False)

    SAMPLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    sample = processed[FEATURE_COLUMNS + ["latitude", "longitude", TARGET_COLUMN]].head(12)
    sample.to_csv(SAMPLE_PATH, index=False)

    # Mirror copies under ml/data for the requested layout.
    for dest_root in (
        PROJECT_ROOT / "ml" / "data" / "raw",
        PROJECT_ROOT / "ml" / "data" / "processed",
        PROJECT_ROOT / "ml" / "data" / "sample",
    ):
        dest_root.mkdir(parents=True, exist_ok=True)
    raw.to_csv(PROJECT_ROOT / "ml" / "data" / "raw" / "rockfall_synthetic_sample.csv", index=False)
    processed.to_csv(PROJECT_ROOT / "ml" / "data" / "processed" / "rockfall_clean.csv", index=False)
    sample.to_csv(PROJECT_ROOT / "ml" / "data" / "sample" / "prediction_examples.csv", index=False)

    labels = list(RISK_LABELS)
    comparison = []
    fitted = {}
    for name, estimator in _build_candidates(random_state).items():
        pipe = Pipeline(
            steps=[
                ("preprocess", _preprocessor()),
                ("model", estimator),
            ]
        )
        pipe.fit(x_train, y_train)
        y_pred = pipe.predict(x_test)
        y_proba = pipe.predict_proba(x_test)
        metrics = {
            "model": name,
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision_macro": float(precision_score(y_test, y_pred, average="macro", zero_division=0)),
            "recall_macro": float(recall_score(y_test, y_pred, average="macro", zero_division=0)),
            "f1_macro": float(f1_score(y_test, y_pred, average="macro", zero_division=0)),
            "roc_auc_ovr_macro": _multiclass_auc(y_test, y_proba, labels),
        }
        comparison.append(metrics)
        fitted[name] = pipe

    comparison_sorted = sorted(comparison, key=lambda r: r["f1_macro"], reverse=True)
    winner_name = comparison_sorted[0]["model"]
    winner = fitted[winner_name]

    y_pred = winner.predict(x_test)
    y_proba = winner.predict_proba(x_test)
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    report = classification_report(y_test, y_pred, labels=labels, output_dict=True, zero_division=0)

    clf = winner.named_steps["model"]
    importance = None
    if hasattr(clf, "feature_importances_"):
        importance = {
            name: float(val)
            for name, val in zip(feature_cols, clf.feature_importances_)
        }
    elif hasattr(clf, "coef_"):
        coef = np.mean(np.abs(clf.coef_), axis=0)
        importance = {name: float(val) for name, val in zip(feature_cols, coef)}

    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    _plot_confusion(cm, labels, PLOTS_DIR / "confusion_matrix.png")
    _plot_class_distribution(raw[TARGET_COLUMN], PLOTS_DIR / "risk_distribution.png")
    _plot_model_comparison(comparison, PLOTS_DIR / "model_comparison.png")
    _plot_feature_hist(processed, PLOTS_DIR / "feature_distributions.png")
    if importance:
        _plot_importances(list(importance.keys()), list(importance.values()), PLOTS_DIR / "feature_importance.png")

    class_counts = raw[TARGET_COLUMN].value_counts().to_dict()
    artifact = {
        "pipeline": winner,
        "feature_names": feature_cols,
        "class_labels": labels,
        "model_name": winner_name,
        "random_state": random_state,
        "dataset_kind": "synthetic_sample",
        "dataset_disclaimer": (
            "The development dataset is synthetic/sample data and is not a "
            "substitute for a validated field dataset."
        ),
        "feature_importance": importance,
        "selection_metric": "f1_macro",
        "selection_reason": (
            f"Selected {winner_name} because it achieved the highest macro-F1 "
            "on the held-out stratified test split among the trained candidates."
        ),
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)

    payload = {
        "dataset": {
            "kind": "synthetic_sample",
            "disclaimer": artifact["dataset_disclaimer"],
            "n_raw_rows": int(len(raw)),
            "n_train": int(len(train_df)),
            "n_test": int(len(test_df)),
            "class_counts": {k: int(v) for k, v in class_counts.items()},
            "features": FEATURE_COLUMNS,
            "engineered_features": [c for c in feature_cols if c not in FEATURE_COLUMNS],
        },
        "selected_model": winner_name,
        "selection_metric": "f1_macro",
        "selection_reason": artifact["selection_reason"],
        "test_metrics": {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision_macro": float(precision_score(y_test, y_pred, average="macro", zero_division=0)),
            "recall_macro": float(recall_score(y_test, y_pred, average="macro", zero_division=0)),
            "f1_macro": float(f1_score(y_test, y_pred, average="macro", zero_division=0)),
            "roc_auc_ovr_macro": _multiclass_auc(y_test, y_proba, labels),
            "confusion_matrix_labels": labels,
            "confusion_matrix": cm.tolist(),
            "classification_report": report,
        },
        "candidate_metrics": comparison_sorted,
        "feature_importance": importance,
        "model_path": str(MODEL_PATH.relative_to(PROJECT_ROOT)).replace("\\", "/"),
        "plots": [
            "ml/evaluation/plots/confusion_matrix.png",
            "ml/evaluation/plots/risk_distribution.png",
            "ml/evaluation/plots/model_comparison.png",
            "ml/evaluation/plots/feature_distributions.png",
            "ml/evaluation/plots/feature_importance.png",
        ],
    }
    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    (PROJECT_ROOT / "frontend" / "public" / "evaluation").mkdir(parents=True, exist_ok=True)
    for plot in PLOTS_DIR.glob("*.png"):
        dest = PROJECT_ROOT / "frontend" / "public" / "evaluation" / plot.name
        dest.write_bytes(plot.read_bytes())
    return payload


if __name__ == "__main__":
    result = train_and_export()
    print(json.dumps({k: result[k] for k in ("selected_model", "test_metrics", "candidate_metrics")}, indent=2))
