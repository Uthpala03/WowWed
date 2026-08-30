"""Train WowWed cost tier Random Forest — best Kaggle model (97.5% accuracy)."""
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split

from cost_features import FEATURE_COLS, TARGET

FOLDER = Path(__file__).resolve().parent
KAGGLE_CSV = FOLDER.parent.parent.parent / "Kaggle ss" / "cost prediction" / "wowwed_cost_prediction.csv"
LOCAL_CSV = FOLDER / "wowwed_cost_prediction.csv"
MODEL_OUT = FOLDER / "wowwed_cost_random_forest.pkl"

MODEL_PARAMS = {
    "n_estimators": 200,
    "max_depth": 14,
    "min_samples_split": 4,
    "random_state": 42,
    "n_jobs": -1,
}


def load_training_csv():
    if LOCAL_CSV.exists():
        return pd.read_csv(LOCAL_CSV)
    if KAGGLE_CSV.exists():
        df = pd.read_csv(KAGGLE_CSV)
        df.to_csv(LOCAL_CSV, index=False)
        print("Copied training CSV to:", LOCAL_CSV)
        return df
    raise FileNotFoundError(f"Training CSV not found. Expected {LOCAL_CSV} or {KAGGLE_CSV}")


def main():
    df = load_training_csv()
    X = df[FEATURE_COLS]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    model = RandomForestClassifier(**MODEL_PARAMS)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")

    print("WowWed Cost Prediction — Random Forest (best model)")
    print("Training rows:", len(X_train))
    print("Test rows    :", len(X_test))
    print("Accuracy     :", round(accuracy, 4))
    print("F1 (macro)   :", round(f1, 4))
    print()
    print(classification_report(y_test, y_pred, digits=4))

    importance = pd.Series(model.feature_importances_, index=FEATURE_COLS).sort_values(ascending=False)
    print("Feature importance:")
    print(importance.to_string())

    bundle = {
        "model": model,
        "feature_cols": FEATURE_COLS,
        "classes": list(model.classes_),
        "target": TARGET,
        "accuracy": round(accuracy, 4),
        "f1_macro": round(f1, 4),
        "model_name": "wowwed_cost_random_forest.pkl",
    }
    joblib.dump(bundle, MODEL_OUT)
    print()
    print("Saved:", MODEL_OUT)


if __name__ == "__main__":
    main()
