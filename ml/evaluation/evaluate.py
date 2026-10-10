from ml.training.train import METRICS_PATH, PLOTS_DIR


def describe_outputs() -> dict:
    return {
        "metrics_path": str(METRICS_PATH),
        "plots_dir": str(PLOTS_DIR),
    }
