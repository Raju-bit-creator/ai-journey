"""Trains a classifier on the Iris dataset and saves it for the API to serve.

Run this whenever you want to (re)generate the model artifact:
    python train.py
"""

from pathlib import Path

import joblib
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

MODEL_DIR = Path(__file__).parent / "model"
MODEL_PATH = MODEL_DIR / "iris_classifier.joblib"


def main() -> None:
    iris = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        iris.data, iris.target, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    accuracy = accuracy_score(y_test, model.predict(X_test))
    print(f"Test accuracy: {accuracy:.2%}")

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(
        {"model": model, "class_names": list(iris.target_names)},
        MODEL_PATH,
    )
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
