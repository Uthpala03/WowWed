import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.preprocessing import LabelEncoder

data = pd.read_csv("wedding_cost_dataset.csv")

le_district = LabelEncoder()
le_ceremony = LabelEncoder()
le_scale = LabelEncoder()

data["district_encoded"] = le_district.fit_transform(data["venue_district"])
data["ceremony_encoded"] = le_ceremony.fit_transform(data["ceremony_type"])
data["scale_encoded"] = le_scale.fit_transform(data["wedding_scale"])

features = [
    "guest_count",
    "district_encoded",
    "ceremony_encoded",
    "scale_encoded",
    "seasonal_indicator",
]
X = data[features]
y = data["total_cost_lkr"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42
)

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=12,
    min_samples_split=4,
    random_state=42
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print("Final Random Forest")
print("Features used : guest_count, venue_district, ceremony_type, wedding_scale, seasonal_indicator")
print("R2 Score      :", round(r2, 4))
print("MAE           :", int(mae), "LKR")
print("RMSE          :", int(rmse), "LKR")

tree_preds = np.array([tree.predict(X_test.values) for tree in model.estimators_])
margin = 1.96 * tree_preds.std(axis=0)

print()
print("Sample prediction")
print("Actual          :", int(y_test.iloc[0]), "LKR")
print("Predicted       :", int(y_pred[0]), "LKR")
print("Margin of error :", int(margin[0]), "LKR")
print("95% interval    :", int(y_pred[0] - margin[0]), "to", int(y_pred[0] + margin[0]), "LKR")

importance = pd.Series(model.feature_importances_, index=features)
importance = importance.sort_values(ascending=False)
print()
print(importance)

plt.figure(figsize=(8, 5))
importance.plot(kind="bar")
plt.title("Random Forest Feature Importance")
plt.ylabel("Importance")
plt.tight_layout()
plt.savefig("feature_importance.png")
print("Saved feature_importance.png")

joblib.dump(
    {
        "model": model,
        "le_district": le_district,
        "le_ceremony": le_ceremony,
        "le_scale": le_scale,
        "features": features,
    },
    "RandomForestRegression.pkl",
)
print("Saved RandomForestRegression.pkl")