import pandas as pd
import numpy as np

excel_path = r"c:\Users\ASUS\Desktop\WowWed\Vendor list\WowWed_Vendors_Complete.xlsx"
xlsx = pd.ExcelFile(excel_path)

all_prices = []
for sheet in xlsx.sheet_names:
    df = pd.read_excel(excel_path, sheet_name=sheet)
    prices = pd.to_numeric(df["Price (LKR)"], errors="coerce")
    prices = prices[(prices.notna()) & (prices > 0)]
    all_prices.extend(prices.tolist())

small_prices = sorted([p for p in all_prices if p < 25000])
large_prices = sorted([p for p in all_prices if p >= 25000])

def pick_by_scale(prices, scale):
    n = len(prices)
    if scale == "budget":
        group = prices[: n // 3]
    elif scale == "premium":
        group = prices[2 * n // 3 :]
    else:
        group = prices[n // 3 : 2 * n // 3]
    if len(group) == 0:
        group = prices
    return np.random.choice(group)

districts = ["Colombo", "Gampaha", "Kandy", "Galle", "Kurunegala", "Kalutara"]
ceremonies = ["Buddhist", "Hindu", "Christian", "Islamic", "Poruwa"]
scales = ["budget", "standard", "premium"]

district_factor = {
    "Colombo": 1.30,
    "Gampaha": 1.10,
    "Kandy": 1.15,
    "Galle": 1.12,
    "Kurunegala": 0.95,
    "Kalutara": 1.05,
}
scale_factor = {"budget": 0.70, "standard": 1.00, "premium": 1.50}
ceremony_factor = {
    "Buddhist": 1.04,
    "Hindu": 1.08,
    "Christian": 1.10,
    "Islamic": 1.06,
    "Poruwa": 1.00,
}

np.random.seed(42)
rows = []

for i in range(800):
    guests = np.random.randint(50, 401)
    district = np.random.choice(districts)
    ceremony = np.random.choice(ceremonies)
    scale = np.random.choice(scales)
    seasonal = np.random.randint(0, 2)

    venue = pick_by_scale(large_prices, scale)
    photo = pick_by_scale(large_prices, scale)
    per_guest = pick_by_scale(small_prices, scale)

    total = venue + photo + (guests * per_guest)
    total = total * district_factor[district]
    total = total * scale_factor[scale]
    total = total * ceremony_factor[ceremony]
    if seasonal == 1:
        total = total * 1.18
    total = total * np.random.uniform(0.97, 1.03)

    rows.append({
        "guest_count": guests,
        "venue_district": district,
        "ceremony_type": ceremony,
        "wedding_scale": scale,
        "seasonal_indicator": seasonal,
        "total_cost_lkr": int(round(total, -3)),
    })

data = pd.DataFrame(rows)
data.to_csv("wedding_cost_dataset.csv", index=False)
print(data.head())
print("Saved rows:", len(data))
print(data["total_cost_lkr"].describe())