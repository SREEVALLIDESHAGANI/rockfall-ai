from backend.app.services.prediction import PredictionService, prediction_service


def test_service_loads_model():
    assert prediction_service.loaded is True
    info = prediction_service.info()
    assert info["dataset_kind"] == "synthetic_sample"
    assert info["model_name"]
