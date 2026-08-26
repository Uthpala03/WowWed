import joblib
import numpy as np
import pandas as pd

saved = joblib.load("RandomForestRegression.pkl")
model = saved["model"]
le_district = saved["le_district"]
le_ceremony = saved["le_ceremony"]
le_scale = saved["le_scale"]
features = saved["features"]

guest_count = 180
venue_district = "Colombo"
ceremony_type = "Buddhist"
wedding_scale = "standard"
seasonal_indicator = 1

row = pd.DataFrame([{
    "guest_count": guest_count,
    "district_encoded": le_district.transform([venue_district])[0],
    "ceremony_encoded": le_ceremony.transform([ceremony_type])[0],
    "scale_encoded": le_scale.transform([wedding_scale])[0],
    "seasonal_indicator": seasonal_indicator,
}])[features]

estimate = model.predict(row)[0]
tree_preds = np.array([tree.predict(row.values) for tree in model.estimators_])
margin = 1.96 * tree_preds.std()

print("Wedding Cost Prediction")
print("Guests     :", guest_count)
print("District   :", venue_district)
print("Ceremony   :", ceremony_type)
print("Scale      :", wedding_scale)
print("Seasonal   :", seasonal_indicator)
print()
print("Estimated cost   :", int(estimate), "LKR")
print("Margin of error  :", int(margin), "LKR")
print("95% interval     :", int(estimate - margin), "to", int(estimate + margin), "LKR")