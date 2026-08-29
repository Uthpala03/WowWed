"""Run cost tier prediction with the trained Random Forest model."""
import json
import sys
from pathlib import Path

import joblib
import pandas as pd

from cost_features import FEATURE_COLS, TIER_RANGES, row_from_input

FOLDER = Path(__file__).resolve().parent
MODEL_FILE = FOLDER / "wowwed_cost_random_forest.pkl"

# Example: venue quote, 200 guests, Colombo, Rs. 6500 per person
DEFAULT_INPUT = {
    "guest_count": 200,
    "category": "Venue & Res. Halls",
    "district": "Colombo",
    "per_person_pricing": 1,
    "base_unit_price": 6500,
    "vendor_rating": 4.5,
    "is_spotlight": 0,
    "package_complexity": 2,
}


def predict(data):
    bundle = joblib.load(MODEL_FILE)
    model = bundle["model"]
    cols = bundle.get("feature_cols") or FEATURE_COLS

    features = row_from_input(data)
    frame = pd.DataFrame([{col: features[col] for col in cols}])
    tier = model.predict(frame)[0]

    confidence = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(frame)[0]
        confidence = round(float(max(probs)), 4)

    meta = TIER_RANGES.get(tier, TIER_RANGES["mid"])
    return {
        "cost_tier": tier,
        "cost_tier_label": meta["label"],
        "confidence": confidence,
        "estimated_total_lkr": features["estimated_total_lkr"],
        "min_total_lkr": meta["min_total_lkr"],
        "max_total_lkr": meta["max_total_lkr"],
        "model": bundle.get("model_name", MODEL_FILE.name),
        "accuracy": bundle.get("accuracy"),
        "features": {col: features[col] for col in cols},
    }


def main():
    if not MODEL_FILE.exists():
        print(f"Model missing: {MODEL_FILE}")
        print("Run: python train.py")
        sys.exit(1)

    data = DEFAULT_INPUT
    if len(sys.argv) > 1:
        data = json.loads(sys.argv[1])

    result = predict(data)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
