"""Serve the saved Random Forest cost model. Does not retrain."""
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

FOLDER = Path(__file__).resolve().parent
MODEL_FILE = FOLDER / "RandomForestRegression.pkl"

# Evaluation from train.py — do not change these numbers
METRICS = {
    "r2": 0.9066,
    "mae": 759387,
    "rmse": 1241231,
    "accuracy": "90.66%",
}

# The pickle only knows 6 venue districts (from training). Map the other 19 by
# similar cost band, not by dumping east/north into the cheapest bucket (Kurunegala).
# Trained cost order: Colombo > Kandy > Galle > Gampaha > Kalutara > Kurunegala.
DISTRICT_MAP = {
    # Western
    "colombo": "Colombo",
    "gampaha": "Gampaha",
    "kalutara": "Kalutara",
    # Central / hill
    "kandy": "Kandy",
    "matale": "Kandy",
    "nuwara eliya": "Kandy",
    "badulla": "Kandy",
    # Southern coast
    "galle": "Galle",
    "matara": "Galle",
    "hambantota": "Galle",
    # Eastern coast (coastal venues, not inland Kurunegala)
    "batticaloa": "Galle",
    "trincomalee": "Galle",
    "ampara": "Kalutara",
    # Northern
    "jaffna": "Kandy",
    "vavuniya": "Kalutara",
    "kilinochchi": "Kurunegala",
    "mannar": "Kurunegala",
    "mullaitivu": "Kurunegala",
    # North Central (cultural triangle)
    "anuradhapura": "Kandy",
    "polonnaruwa": "Kandy",
    # North Western
    "kurunegala": "Kurunegala",
    "puttalam": "Kalutara",
    # Sabaragamuwa / Uva
    "kegalle": "Gampaha",
    "ratnapura": "Kandy",
    "monaragala": "Kalutara",
}

CEREMONY_MAP = {
    "buddhist": "Buddhist",
    "hindu": "Hindu",
    "hindu tamil wedding": "Hindu",
    "christian": "Christian",
    "church wedding": "Christian",
    "islamic": "Islamic",
    "muslim": "Islamic",
    "muslim nikah ceremony": "Islamic",
    "poruwa": "Poruwa",
    "poruwa ceremony": "Poruwa",
    "civil": "Poruwa",
    "reception": "Poruwa",
}

PEAK_MONTHS = {1, 4, 7, 8, 12}

app = FastAPI(title="WowWed Wedding Cost Prediction")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    saved = joblib.load(MODEL_FILE)
except Exception as exc:
    saved = None
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


def district_key(value):
    return " ".join(str(value or "").strip().lower().replace("-", " ").replace("_", " ").split())


def map_district(value):
    key = district_key(value)
    trained = list(saved["le_district"].classes_) if saved else []
    titled = str(value or "").strip().title()
    if titled in trained:
        return titled
    if key.title() in trained:
        return key.title()
    return DISTRICT_MAP.get(key, "Gampaha")


def map_ceremony(value):
    key = str(value or "").strip().lower()
    if saved and str(value).strip() in list(saved["le_ceremony"].classes_):
        return str(value).strip()
    return CEREMONY_MAP.get(key, "Poruwa")


def map_scale(value):
    key = str(value or "standard").strip().lower()
    if key == "luxury":
        return "premium"
    if key in ("budget", "standard", "premium"):
        return key
    return "standard"


def peak_from_date(wedding_date):
    text = str(wedding_date or "")
    if len(text) >= 7:
        try:
            month = int(text[5:7])
            return 1 if month in PEAK_MONTHS else 0
        except ValueError:
            return 0
    return 0


def predict_one(guests, district, ceremony, scale, seasonal):
    model = saved["model"]
    features = saved["features"]
    row = pd.DataFrame([{
        "guest_count": guests,
        "district_encoded": saved["le_district"].transform([district])[0],
        "ceremony_encoded": saved["le_ceremony"].transform([ceremony])[0],
        "scale_encoded": saved["le_scale"].transform([scale])[0],
        "seasonal_indicator": seasonal,
    }])[features]
    estimate = float(model.predict(row)[0])
    tree_preds = np.array([tree.predict(row.values) for tree in model.estimators_])
    margin = float(1.96 * tree_preds.std())
    return estimate, margin


@app.get("/health")
def health():
    return {
        "ok": saved is not None,
        "model": "RandomForestRegression.pkl",
        "metrics": METRICS,
        "error": load_error or None,
    }


@app.post("/predict")
def predict(body: PredictIn):
    if saved is None:
        raise HTTPException(status_code=503, detail="RandomForestRegression.pkl is missing. Train the model first.")

    guests = max(50, min(800, int(body.guestCount or 150)))
    requested_district = str(body.district or "").strip()
    district = map_district(requested_district)
    ceremony = map_ceremony(body.ceremonyType)
    scale = map_scale(body.scale)
    if body.seasonal is not None:
        seasonal = 1 if int(body.seasonal) else 0
    elif body.seasonal_indicator is not None:
        seasonal = 1 if int(body.seasonal_indicator) else 0
    else:
        seasonal = peak_from_date(body.weddingDate)

    estimate, margin = predict_one(guests, district, ceremony, scale, seasonal)
    low = max(0, estimate - margin)
    high = estimate + margin

    return {
        "estimate": int(round(estimate, -3)),
        "low": int(round(low, -3)),
        "high": int(round(high, -3)),
        "margin": int(round(margin, -3)),
        "confidence": "95%",
        "source": "RandomForestRegression.pkl",
        "metrics": METRICS,
        "factors": {
            "guests": guests,
            "district": requested_district or district,
            "modelDistrict": district,
            "ceremonyType": ceremony,
            "scale": scale,
            "seasonal": "Peak season" if seasonal else "Regular season",
        },
    }
