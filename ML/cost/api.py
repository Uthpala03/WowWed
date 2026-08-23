"""M06 wedding cost prediction API — Random Forest Regression."""

from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cost_features import CAT_COLS, FOLDER, NUM_COLS, features_from_request

MODEL_PATH = FOLDER / "RandomForestRegression.pkl"

app = FastAPI(title="WowWed Wedding Cost Prediction")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    bundle = joblib.load(MODEL_PATH)
except Exception:
    bundle = None


class PredictIn(BaseModel):
    guestCount: Optional[int] = 150
    guest_count: Optional[int] = None
    district: Optional[str] = "Colombo"
    ceremonyType: Optional[str] = "Poruwa Ceremony"
    ceremony_type: Optional[str] = None
    scale: Optional[str] = "standard"
    weddingMonth: Optional[int] = None
    weddingDate: Optional[str] = None
    seasonal: Optional[int] = None

    model_config = {"extra": "ignore"}


def load_bundle():
    global bundle
    if bundle is None and MODEL_PATH.exists():
        bundle = joblib.load(MODEL_PATH)
    return bundle


def interval_from_trees(model, X, metrics):
    point = float(model.predict(X)[0])
    tree_preds = np.array([tree.predict(X)[0] for tree in model.estimators_])
    iqr = float(np.percentile(tree_preds, 75) - np.percentile(tree_preds, 25))
    mae = float((metrics or {}).get("mae") or point * 0.1)
    margin = max(point * 0.08, min(point * 0.16, max(iqr / 2.0, mae)))
    low = max(0.0, point - margin)
    high = point + margin
    pct = (margin / point * 100) if point else 0
    return point, low, high, margin, pct


@app.get("/health")
def health():
    ready = load_bundle() is not None
    metrics = (bundle or {}).get("metrics") if ready else None
    return {"ok": ready, "model": "RandomForestRegression.pkl", "metrics": metrics}


@app.get("/metrics")
def metrics():
    data = load_bundle()
    if not data:
        raise HTTPException(status_code=503, detail="Model not trained. Run train_cost.py")
    return {
        "metrics": data.get("metrics"),
        "feature_names": data.get("feature_names", [])[:12],
        "feature_importances": data.get("feature_importances", [])[:12],
    }


@app.post("/predict")
def predict(body: PredictIn):
    data = load_bundle()
    if not data:
        raise HTTPException(status_code=503, detail="Model not trained. Run train_cost.py")

    raw = features_from_request(body.model_dump())
    frame = pd.DataFrame([raw])[CAT_COLS + NUM_COLS]
    X = data["preprocessor"].transform(frame)
    model = data["model"]
    estimate, low, high, margin, pct = interval_from_trees(model, X, data.get("metrics"))
    estimate = int(round(estimate, -3))
    low = int(round(low, -3))
    high = int(round(high, -3))
    margin = int(round(margin, -3))

    return {
        "estimate": estimate,
        "low": low,
        "high": high,
        "margin": margin,
        "confidence": f"±{round(pct)}%",
        "currency": "LKR",
        "source": "RandomForestRegression.pkl",
        "model": "RandomForestRegressor",
        "metrics": data.get("metrics"),
        "factors": {
            "guests": raw["guest_count"],
            "district": raw["district"],
            "ceremonyType": raw["ceremony_type"],
            "scale": raw["scale"],
            "seasonal": "Peak season" if raw["seasonal"] else "Standard season",
        },
    }
