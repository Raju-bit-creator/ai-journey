# Python stage — FastAPI + ML

A standalone FastAPI service that trains and serves a scikit-learn classifier on the classic Iris dataset. Not wired into the Next.js/NestJS stack — this is its own thing.

## Setup

```bash
cd python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Train the model

```bash
python train.py
```

Trains a `RandomForestClassifier`, prints test accuracy, and saves the model to `model/iris_classifier.joblib` (gitignored — regenerate it any time by rerunning this).

## Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

- Interactive docs: http://localhost:8000/docs
- `GET /health`
- `POST /predict` with `{"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2}`

## Tests

```bash
pytest -v
```
