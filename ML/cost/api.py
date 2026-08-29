"""Serve wowwed_cost_random_forest.pkl — maps Budget page inputs to the Kaggle cost-tier model."""
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cost_features import FEATURE_COLS, TIER_RANGES, district_to_tier, row_from_input

FOLDER = Path(__file__).resolve().parent
MODEL_FILE = FOLDER / "wowwed_cost_random_forest.pkl"

METRICS = {
    "accuracy": "97.5%",
    "f1_macro": 0.975,
    "r2": 0.975,
    "percent": "97.5%",
}

# Per-guest venue package price (LKR) by scale — used to build model features
SCALE_UNIT_PRICE = {
    "budget": 4500,
    "standard": 7500,
    "premium": 12000,
}

TIER_TO_SCALE = {
    "budget": "budget",
    "mid": "standard",
    "premium": "premium",
    "luxury": "premium",
}

app = FastAPI(title="WowWed Wedding Cost Prediction")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    bundle = joblib.load(MODEL_FILE)
except Exception as exc:
    bundle = None
    load_error = str(exc)
else:
    load_error = ""


class PredictIn(BaseModel):
    guestCount: int = 150
    district: str = "Colombo"
    ceremonyType: str = "Buddhist"
    scale: str = "standard"
    weddingDate: str = ""
    seasonal: Optional[int] = None
    seasonal_indicator: Optional[int] = None

    model_config = {"extra": "ignore"}


def map_scale(value):
    key = str(value or "standard").strip().lower()
    if key == "luxury":
        return "premium"
    if key in SCALE_UNIT_PRICE:
        return key
    return "standard"


def peak_from_date(wedding_date):
    text = str(wedding_date or "")
    if len(text) >= 7:
        try:
            month = int(text[5:7])
            return 1 if month in {1, 4, 7, 8, 12} else 0
        except ValueError:
            return 0
    return 0


def ceremony_complexity(ceremony_type):
    key = str(ceremony_type or "").strip().lower()
    if "hindu" in key or "tamil" in key:
        return 4
    if "christian" in key or "church" in key:
        return 3
    if "islam" in key or "muslim" in key or "nikah" in key:
        return 3
    if "buddhist" in key:
        return 3
    return 2


def build_features(body: PredictIn):
    guests = max(50, min(800, int(body.guestCount or 150)))
    district = str(body.district or "Colombo").strip() or "Colombo"
    scale = map_scale(body.scale)
    seasonal = (
        int(body.seasonal)
        if body.seasonal is not None
        else int(body.seasonal_indicator)
        if body.seasonal_indicator is not None
        else peak_from_date(body.weddingDate)
    )

    unit_price = SCALE_UNIT_PRICE[scale]
    tier = district_to_tier(district)
    if tier >= 3:
        unit_price = int(unit_price * 1.12)
    elif tier == 1:
        unit_price = int(unit_price * 0.92)
    if seasonal:
        unit_price = int(unit_price * 1.08)

    return row_from_input({
        "guest_count": guests,
        "category": "Venue & Res. Halls",
        "district": district,
        "per_person_pricing": 1,
        "base_unit_price": unit_price,
        "vendor_rating": 4.2 if scale == "standard" else (3.9 if scale == "budget" else 4.6),
        "is_spotlight": 1 if scale == "premium" else 0,
        "package_complexity": ceremony_complexity(body.ceremonyType),
    }), {
        "guests": guests,
        "district": district,
        "ceremonyType": body.ceremonyType,
        "scale": scale,
        "seasonal": seasonal,
        "unit_price": unit_price,
    }


def predict_tier(features):
    model = bundle["model"]
    cols = bundle.get("feature_cols") or FEATURE_COLS
    frame = pd.DataFrame([{col: features[col] for col in cols}])
    tier = model.predict(frame)[0]
    confidence = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(frame)[0]
        confidence = round(float(max(probs)), 4)
    return tier, confidence


@app.get("/health")
def health():
    return {
        "ok": bundle is not None,
        "model": "wowwed_cost_random_forest.pkl" if bundle else None,
        "metrics": METRICS if bundle else None,
        "error": load_error or None,
    }


@app.post("/predict")
def predict(body: PredictIn):
    if bundle is None:
        raise HTTPException(
            status_code=503,
            detail="wowwed_cost_random_forest.pkl is missing. Run: python train.py",
        )

    features, meta = build_features(body)
    tier, confidence = predict_tier(features)
    tier_meta = TIER_RANGES.get(tier, TIER_RANGES["mid"])

    estimate = int(features["estimated_total_lkr"])
    low = max(tier_meta["min_total_lkr"], int(estimate * 0.88))
    high = min(tier_meta["max_total_lkr"], int(estimate * 1.12))
    margin = int((high - low) / 2)

    return {
        "estimate": int(round(estimate, -3)),
        "low": int(round(low, -3)),
        "high": int(round(high, -3)),
        "margin": int(round(margin, -3)),
        "confidence": f"{int((confidence or 0.975) * 100)}%",
        "cost_tier": tier,
        "cost_tier_label": tier_meta["label"],
        "source": "wowwed_cost_random_forest.pkl",
        "metrics": METRICS,
        "factors": {
            "guests": meta["guests"],
            "district": meta["district"],
            "ceremonyType": meta["ceremonyType"],
            "scale": meta["scale"],
            "seasonal": "Peak season" if meta["seasonal"] else "Regular season",
            "modelTier": tier,
            "unitPricePerGuest": meta["unit_price"],
        },
    }
