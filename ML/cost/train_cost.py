"""Train Random Forest Regression for M06 wedding cost prediction."""

import json

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

from cost_features import CAT_COLS, FOLDER, NUM_COLS

DATA = FOLDER / "wedding_cost_dataset.csv"
MODEL = FOLDER / "RandomForestRegression.pkl"
PLOT = FOLDER / "feature_importance.png"
METRICS = FOLDER / "training_metrics.csv"


def load_frame():
    if not DATA.exists():
        from build_cost_dataset import build
        df = build()
        df.to_csv(DATA, index=False)
    else:
        df = pd.read_csv(DATA)
    return df


def make_preprocessor():
    return ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), CAT_COLS),
        ("num", "passthrough", NUM_COLS),
    ])


def train():
    FOLDER.mkdir(parents=True, exist_ok=True)
    df = load_frame()
    X = df[CAT_COLS + NUM_COLS]
    y = df["total_cost_lkr"].astype(float)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    prep = make_preprocessor()
    X_train_t = prep.fit_transform(X_train)
    X_test_t = prep.transform(X_test)

    model = RandomForestRegressor(
        n_estimators=250,
        max_depth=16,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train_t, y_train)

    pred = model.predict(X_test_t)
    r2 = float(r2_score(y_test, pred))
    mae = float(mean_absolute_error(y_test, pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, pred)))

    names = prep.get_feature_names_out()
    importances = model.feature_importances_
    order = np.argsort(importances)[::-1]
    names = names[order]
    importances = importances[order]

    plt.figure(figsize=(8, 5))
    top = min(12, len(names))
    plt.barh(names[:top][::-1], importances[:top][::-1], color="#c96a5a")
    plt.xlabel("Importance")
    plt.title("Random Forest — wedding cost feature importance")
    plt.tight_layout()
    plt.savefig(PLOT, bbox_inches="tight")
    plt.close()

    metrics = {
        "rows": int(len(df)),
        "r2": round(r2, 4),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "target_r2": 0.80,
        "passes_r2": r2 >= 0.80,
    }
    pd.DataFrame([metrics]).to_csv(METRICS, index=False)

    bundle = {
        "model": model,
        "preprocessor": prep,
        "metrics": metrics,
        "feature_names": names.tolist(),
        "feature_importances": [round(float(v), 4) for v in importances],
    }
    joblib.dump(bundle, MODEL)

    print("Rows:", metrics["rows"])
    print("R2:", metrics["r2"], "(target >= 0.80)", "PASS" if metrics["passes_r2"] else "FAIL")
    print("MAE:", int(mae), "LKR")
    print("RMSE:", int(rmse), "LKR")
    print("Saved model:", MODEL)
    print("Saved plot:", PLOT)
    print("Metrics:", json.dumps(metrics))
    return bundle


if __name__ == "__main__":
    train()
