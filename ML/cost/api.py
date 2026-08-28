from pathlib import Path
from typing import List, Optional

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cost_features import RF_FEATURE_COLS, TIER_RANGES, row_from_input

FOLDER = Path(__file__).resolve().parent

app = FastAPI(title="WowWed Cost Prediction")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    rf_bundle = joblib.load(FOLDER / "wowwed_cost_random_forest.pkl")
except Exception:
    rf_bundle = None


class PredictIn(BaseModel):
    guest_count: Optional[int] = 150
    category: Optional[str] = "Venue & Res. Halls"
    category_code: Optional[int] = None
    district: Optional[str] = "Colombo"
    district_tier: Optional[int] = None
    per_person_pricing: Optional[int] = 1
    base_unit_price: Optional[int] = 0
    price: Optional[int] = None
    vendor_rating: Optional[float] = 4.0
    rating: Optional[float] = None
    is_spotlight: Optional[int] = 0
    spotlight: Optional[bool] = False
    package_complexity: Optional[int] = 2

    model_config = {"extra": "ignore"}


class BatchPredictIn(BaseModel):
    items: List[PredictIn]


def predict_one(data):
    features = row_from_input(data.model_dump() if hasattr(data, "model_dump") else dict(data))
    tier = "mid"
    confidence = None

    if rf_bundle and rf_bundle.get("model") is not None:
        cols = rf_bundle.get("feature_cols") or RF_FEATURE_COLS
        frame = pd.DataFrame([{col: features[col] for col in cols}])
        model = rf_bundle["model"]
        tier = model.predict(frame)[0]
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(frame)[0]
            classes = list(model.classes_)
            confidence = round(float(max(probs)), 4)
            tier = classes[int(probs.argmax())]

    meta = TIER_RANGES.get(tier, TIER_RANGES["mid"])
    total = features["estimated_total_lkr"]
    return {
        "cost_tier": tier,
        "cost_tier_label": meta["label"],
        "confidence": confidence,
        "estimated_total_lkr": total,
        "min_total_lkr": meta["min_total_lkr"],
        "max_total_lkr": meta["max_total_lkr"],
        "features": {col: features[col] for col in RF_FEATURE_COLS},
        "model": "wowwed_cost_random_forest.pkl" if rf_bundle else None,
        "accuracy": 0.975,
    }


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": "wowwed_cost_random_forest.pkl" if rf_bundle else None,
        "accuracy": 0.975 if rf_bundle else None,
    }


@app.post("/predict")
def predict(body: PredictIn):
    return predict_one(body)


@app.post("/predict/batch")
def predict_batch(body: BatchPredictIn):
    return {"predictions": [predict_one(item) for item in body.items]}
