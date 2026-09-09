from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_SETOSA_LIKE = {
    "sepal_length": 5.1,
    "sepal_width": 3.5,
    "petal_length": 1.4,
    "petal_width": 0.2,
}


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "up"}


def test_predict_returns_a_known_species():
    res = client.post("/predict", json=VALID_SETOSA_LIKE)
    assert res.status_code == 200

    body = res.json()
    assert body["species"] in {"setosa", "versicolor", "virginica"}
    assert set(body["probabilities"].keys()) == {"setosa", "versicolor", "virginica"}
    assert abs(sum(body["probabilities"].values()) - 1.0) < 1e-6


def test_predict_matches_the_textbook_setosa_example():
    # These measurements are a classic, unambiguous setosa example.
    res = client.post("/predict", json=VALID_SETOSA_LIKE)
    assert res.json()["species"] == "setosa"


def test_predict_rejects_out_of_range_input():
    invalid = {**VALID_SETOSA_LIKE, "sepal_length": -1}
    res = client.post("/predict", json=invalid)
    assert res.status_code == 422


def test_predict_rejects_missing_field():
    incomplete = {k: v for k, v in VALID_SETOSA_LIKE.items() if k != "petal_width"}
    res = client.post("/predict", json=incomplete)
    assert res.status_code == 422
