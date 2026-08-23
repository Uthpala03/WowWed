"""Build 850 synthetic + survey-shaped Sri Lankan wedding cost records."""

from pathlib import Path
import numpy as np
import pandas as pd

from cost_features import CEREMONY_TYPES, DISTRICTS, FOLDER, SCALES

OUT = FOLDER / "wedding_cost_dataset.csv"
RNG = np.random.default_rng(42)

# District economic / vendor-price tiers (Colombo packages vs rural halls)
DISTRICT_MULT = {
    "Colombo": 1.30, "Gampaha": 1.16, "Kalutara": 1.10,
    "Kandy": 1.08, "Galle": 1.06, "Nuwara Eliya": 1.12,
    "Jaffna": 0.94, "Matara": 0.94, "Kegalle": 0.92, "Kurunegala": 0.90,
    "Ratnapura": 0.90, "Anuradhapura": 0.88, "Badulla": 0.88,
    "Trincomalee": 0.88, "Hambantota": 0.87, "Matale": 0.90,
    "Puttalam": 0.86, "Polonnaruwa": 0.86, "Batticaloa": 0.85,
    "Ampara": 0.84, "Vavuniya": 0.82, "Monaragala": 0.82,
    "Mannar": 0.80, "Kilinochchi": 0.78, "Mullaitivu": 0.78,
}

# Ceremony-specific add-ons that linear models miss
CEREMONY_FIXED = {
    "Poruwa Ceremony": 420_000,          # poruwa, pirith, ashtaka, dancers
    "Church Wedding": 280_000,           # church hire, choir, reception flow
    "Hindu Tamil Wedding": 680_000,      # multi-day rites, jewellery weight
    "Muslim Nikah Ceremony": 240_000,    # nikah + walima setup
    "Reception": 120_000,
}
CEREMONY_FOOD = {
    "Poruwa Ceremony": 1.08,
    "Church Wedding": 1.00,
    "Hindu Tamil Wedding": 1.12,
    "Muslim Nikah Ceremony": 1.06,
    "Reception": 0.90,
}

SCALE_PER_GUEST = {"budget": 14_500, "standard": 26_000, "premium": 42_000, "luxury": 68_000}
SCALE_FIXED = {"budget": 0.72, "standard": 1.00, "premium": 1.48, "luxury": 2.15}


def venue_package(guest_count, scale):
    """Vendor halls sell capacity bands — not a straight per-head line."""
    bands = [
        (80, 380_000),
        (150, 820_000),
        (250, 1_450_000),
        (400, 2_350_000),
        (700, 3_400_000),
        (2000, 4_800_000),
    ]
    base = bands[-1][1]
    for limit, price in bands:
        if guest_count <= limit:
            base = price
            break
    return base * SCALE_FIXED[scale]


def true_cost(guest_count, district, ceremony, scale, seasonal):
    per_guest = SCALE_PER_GUEST[scale]
    catering = guest_count * per_guest * CEREMONY_FOOD[ceremony]
    if guest_count > 300:
        catering *= 0.93
    if guest_count > 600:
        catering *= 0.94

    venue = venue_package(guest_count, scale)
    photo = 220_000 * SCALE_FIXED[scale]
    decor = (180_000 + guest_count * 1_150) * SCALE_FIXED[scale]
    attire = 260_000 * SCALE_FIXED[scale]
    music = 140_000 * SCALE_FIXED[scale]
    cake = 45_000 + guest_count * 180
    transport = 90_000 * (1.15 if district == "Colombo" else 1.0)
    ceremony_extra = CEREMONY_FIXED[ceremony] * SCALE_FIXED[scale]
    district_mult = DISTRICT_MULT.get(district, 1.0)
    seasonal_mult = 1.14 if seasonal else 1.0

    subtotal = (
        catering + venue + photo + decor + attire + music + cake + transport + ceremony_extra
    )
    return subtotal * district_mult * seasonal_mult


def build(n=850):
    rows = []
    for _ in range(n):
        guests = int(np.clip(RNG.normal(220, 110), 40, 900))
        district = DISTRICTS[int(RNG.integers(0, len(DISTRICTS)))]
        if RNG.random() < 0.28:
            district = RNG.choice(["Colombo", "Gampaha", "Kandy", "Galle", "Kalutara"])
        ceremony = CEREMONY_TYPES[int(RNG.integers(0, len(CEREMONY_TYPES)))]
        scale = SCALES[int(RNG.integers(0, len(SCALES)))]
        seasonal = int(RNG.random() < 0.38)
        cost = true_cost(guests, district, ceremony, scale, seasonal)
        noise = RNG.normal(1.0, 0.075)
        cost = max(800_000, cost * noise)
        rows.append({
            "guest_count": guests,
            "district": district,
            "ceremony_type": ceremony,
            "scale": scale,
            "seasonal": seasonal,
            "total_cost_lkr": int(round(cost, -3)),
        })
    return pd.DataFrame(rows)


if __name__ == "__main__":
    FOLDER.mkdir(parents=True, exist_ok=True)
    df = build()
    df.to_csv(OUT, index=False)
    print("Rows:", len(df))
    print("Cost min/median/max:", int(df.total_cost_lkr.min()), int(df.total_cost_lkr.median()), int(df.total_cost_lkr.max()))
    print("Saved:", OUT)
