from fastapi import FastAPI

from app.model import predict
from app.schemas import IrisFeatures, PredictionResponse

app = FastAPI(
    title="AI Journey ML Service",
    description="A standalone FastAPI service serving a scikit-learn classifier",
    version="1.0.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "up"}


@app.post("/predict", response_model=PredictionResponse)
def predict_species(features: IrisFeatures) -> PredictionResponse:
    return predict(features)
