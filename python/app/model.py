from functools import lru_cache
from pathlib import Path

import joblib

from app.schemas import IrisFeatures, PredictionResponse

MODEL_PATH = Path(__file__).parent.parent / "model" / "iris_classifier.joblib"


@lru_cache
def _load() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No trained model at {MODEL_PATH}. Run `python train.py` first."
        )
    return joblib.load(MODEL_PATH)


def predict(features: IrisFeatures) -> PredictionResponse:
    bundle = _load()
    model = bundle["model"]
    class_names = bundle["class_names"]

    row = [[
        features.sepal_length,
        features.sepal_width,
        features.petal_length,
        features.petal_width,
    ]]

    predicted_index = model.predict(row)[0]
    probabilities = model.predict_proba(row)[0]

    return PredictionResponse(
        species=class_names[predicted_index],
        probabilities={
            class_names[i]: round(float(p), 4) for i, p in enumerate(probabilities)
        },
    )
