"""Test seating table_type prediction with the trained Random Forest model."""
import json
import sys
from pathlib import Path

import joblib
import pandas as pd

from guest_features import RF_FEATURE_COLS, add_ml_columns, add_rf_columns, relationship_and_priority

FOLDER = Path(__file__).resolve().parent
MODEL_FILE = FOLDER / "wowwed_seating_random_forest.pkl"

SAMPLE = {
    "name": "Amaya Samarasinghe",
    "group": "VIP",
    "notes": "",
    "avoid": "",
    "age": "35",
    "rsvp": "Accepted",
}


def predict_guest(guest):
    rel, pri = relationship_and_priority(guest.get("group"))
    df = pd.DataFrame([{
        "group": guest.get("group", ""),
        "notes": guest.get("notes", ""),
        "avoid": guest.get("avoid", ""),
        "age": guest.get("age", ""),
        "relationship_type": rel,
        "priority": pri,
    }])
    df = add_ml_columns(df)
    df = add_rf_columns(df)

    bundle = joblib.load(MODEL_FILE)
    model = bundle["model"]
    cols = bundle.get("feature_cols") or RF_FEATURE_COLS
    table_type = model.predict(df[cols])[0]

    confidence = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(df[cols])[0]
        confidence = round(float(max(probs)), 4)

    return {
        "name": guest.get("name"),
        "group": guest.get("group"),
        "table_type": table_type,
        "confidence": confidence,
        "model": bundle.get("model_name", MODEL_FILE.name),
        "accuracy": bundle.get("accuracy"),
    }


def main():
    if not MODEL_FILE.exists():
        print(f"Model missing: {MODEL_FILE}")
        print("Run: python train.py")
        sys.exit(1)

    data = SAMPLE
    if len(sys.argv) > 1:
        data = json.loads(sys.argv[1])

    print(json.dumps(predict_guest(data), indent=2))


if __name__ == "__main__":
    main()
