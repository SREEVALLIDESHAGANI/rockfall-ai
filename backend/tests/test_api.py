from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.prediction import prediction_service

client = TestClient(app)

VALID_PAYLOAD = {
    "slope_angle_deg": 55,
    "slope_height_m": 40,
    "ucs_mpa": 50,
    "discontinuity_spacing_m": 0.4,
    "discontinuity_orientation_index": 0.5,
    "weathering_grade": 3,
    "rainfall_mm": 900,
    "groundwater_index": 0.4,
    "vegetation_cover": 0.5,
    "seismic_pga_g": 0.12,
    "latitude": 32.1,
    "longitude": 77.2,
    "location_label": "Test slope",
}


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert "model_loaded" in body


def test_predict_valid():
    if not prediction_service.loaded:
        pytest_skip = True
    else:
        pytest_skip = False
    if pytest_skip:
        import pytest

        pytest.skip("model not trained yet")
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    assert body["risk_level"] in {"LOW", "MEDIUM", "HIGH"}
    assert 0 <= body["probability"] <= 1
    assert "disclaimer" in body
    assert body["dataset_kind"] == "synthetic_sample"


def test_predict_missing_fields():
    response = client.post("/predict", json={"slope_angle_deg": 40})
    assert response.status_code == 422


def test_predict_invalid_range():
    payload = dict(VALID_PAYLOAD)
    payload["slope_angle_deg"] = 120
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_malformed():
    response = client.post("/predict", content="not-json", headers={"Content-Type": "application/json"})
    assert response.status_code == 422


def test_model_info_when_loaded():
    response = client.get("/model/info")
    if prediction_service.loaded:
        assert response.status_code == 200
        assert "model_name" in response.json()
    else:
        assert response.status_code == 503
