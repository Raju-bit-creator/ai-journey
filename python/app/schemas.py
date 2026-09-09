from pydantic import BaseModel, Field


class IrisFeatures(BaseModel):
    sepal_length: float = Field(gt=0, le=15, description="Sepal length in cm")
    sepal_width: float = Field(gt=0, le=15, description="Sepal width in cm")
    petal_length: float = Field(gt=0, le=15, description="Petal length in cm")
    petal_width: float = Field(gt=0, le=15, description="Petal width in cm")


class PredictionResponse(BaseModel):
    species: str
    probabilities: dict[str, float]
