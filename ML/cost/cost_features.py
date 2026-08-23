"""Shared encoding for M06 wedding cost prediction."""

from pathlib import Path

FOLDER = Path(__file__).resolve().parent

DISTRICTS = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
    "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
    "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
    "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
    "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
]

CEREMONY_TYPES = [
    "Poruwa Ceremony",
    "Church Wedding",
    "Hindu Tamil Wedding",
    "Muslim Nikah Ceremony",
    "Reception",
]

SCALES = ["budget", "standard", "premium", "luxury"]
PEAK_MONTHS = {0, 1, 6, 7, 11}  # Jan, Feb, Jul, Aug, Dec

CEREMONY_ALIASES = {
    "poruwa": "Poruwa Ceremony",
    "poruwa ceremony": "Poruwa Ceremony",
    "sinhalese": "Poruwa Ceremony",
    "buddhist": "Poruwa Ceremony",
    "christian": "Church Wedding",
    "church": "Church Wedding",
    "church wedding": "Church Wedding",
    "hindu": "Hindu Tamil Wedding",
    "hindu tamil wedding": "Hindu Tamil Wedding",
    "tamil": "Hindu Tamil Wedding",
    "muslim": "Muslim Nikah Ceremony",
    "muslim nikah ceremony": "Muslim Nikah Ceremony",
    "nikah": "Muslim Nikah Ceremony",
    "nikkah": "Muslim Nikah Ceremony",
    "civil": "Reception",
    "reception": "Reception",
    "reception only": "Reception",
}

SCALE_ALIASES = {
    "budget": "budget",
    "economy": "budget",
    "standard": "standard",
    "medium": "standard",
    "premium": "premium",
    "luxury": "luxury",
    "high-end": "luxury",
}

CAT_COLS = ["district", "ceremony_type", "scale"]
NUM_COLS = ["guest_count", "seasonal"]


def normalize_district(value):
    raw = (value or "").strip()
    for district in DISTRICTS:
        if district.lower() == raw.lower():
            return district
    return "Colombo" if not raw else raw.title()


def normalize_ceremony(value):
    key = (value or "").strip().lower()
    if key in CEREMONY_ALIASES:
        return CEREMONY_ALIASES[key]
    for label in CEREMONY_TYPES:
        if label.lower() == key:
            return label
    return "Poruwa Ceremony"


def normalize_scale(value):
    key = (value or "").strip().lower()
    return SCALE_ALIASES.get(key, "standard")


def seasonal_from_month(month):
    try:
        month_i = int(month)
    except (TypeError, ValueError):
        return 0
    return 1 if month_i in PEAK_MONTHS else 0


def month_from_date(value):
    if value is None or value == "":
        return None
    text = str(value)
    if len(text) >= 7 and text[4] == "-":
        try:
            return int(text[5:7]) - 1
        except ValueError:
            return None
    try:
        return int(text)
    except ValueError:
        return None


def features_from_request(payload):
    month = payload.get("weddingMonth")
    if month is None:
        month = month_from_date(payload.get("weddingDate"))
    seasonal = payload.get("seasonal")
    if seasonal is None:
        seasonal = seasonal_from_month(month if month is not None else 6)

    guests = payload.get("guestCount", payload.get("guest_count", 150))
    try:
        guests = int(float(guests))
    except (TypeError, ValueError):
        guests = 150
    guests = max(30, min(2000, guests))

    district = normalize_district(payload.get("district"))
    ceremony = normalize_ceremony(payload.get("ceremonyType") or payload.get("ceremony_type"))
    scale = normalize_scale(payload.get("scale"))
    seasonal = 1 if int(seasonal) else 0

    return {
        "guest_count": guests,
        "district": district,
        "ceremony_type": ceremony,
        "scale": scale,
        "seasonal": seasonal,
    }
