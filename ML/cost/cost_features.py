"""Feature encoding for WowWed cost tier prediction (Kaggle Random Forest)."""

FEATURE_COLS = [
    "guest_count",
    "category_code",
    "district_tier",
    "per_person_pricing",
    "base_unit_price",
    "vendor_rating",
    "is_spotlight",
    "package_complexity",
]

TARGET = "cost_tier"
CLASSES = ["budget", "mid", "premium", "luxury"]

CATEGORY_CODE = {
    "Venue & Res. Halls": 1,
    "Caters": 2,
    "Photography & Videography": 3,
    "Floral & Deco": 4,
    "Bridal Service": 5,
    "Groom service": 6,
    "Jewellary": 7,
    "Cakes": 8,
}

DISTRICT_TIER = {
    "Colombo": 3,
    "Gampaha": 2,
    "Kalutara": 2,
    "Kandy": 2,
    "Galle": 2,
    "Matara": 1,
    "Kurunegala": 1,
    "Anuradhapura": 1,
    "Badulla": 1,
    "Ratnapura": 1,
    "Trincomalee": 1,
    "Jaffna": 1,
    "Batticaloa": 1,
    "Ampara": 1,
    "Hambantota": 1,
    "Puttalam": 1,
    "Kegalle": 2,
    "Polonnaruwa": 1,
    "Mannar": 1,
    "Vavuniya": 1,
}

TIER_RANGES = {
    "budget": {"min_total_lkr": 25000, "max_total_lkr": 499999, "label": "Budget"},
    "mid": {"min_total_lkr": 500000, "max_total_lkr": 1999999, "label": "Mid-range"},
    "premium": {"min_total_lkr": 2000000, "max_total_lkr": 5999999, "label": "Premium"},
    "luxury": {"min_total_lkr": 6000000, "max_total_lkr": 15000000, "label": "Luxury"},
}


def category_to_code(category):
    if category is None:
        return 9
    if isinstance(category, (int, float)) and not isinstance(category, bool):
        return int(category)
    text = str(category).strip()
    if text.isdigit():
        return int(text)
    return CATEGORY_CODE.get(text, 9)


def district_to_tier(district):
    if district is None:
        return 1
    if isinstance(district, (int, float)) and not isinstance(district, bool):
        return max(1, min(3, int(district)))
    text = str(district).strip()
    if text.isdigit():
        return max(1, min(3, int(text)))
    return DISTRICT_TIER.get(text, 1)


def estimate_total(base_unit_price, guest_count, per_person_pricing):
    price = max(0, int(base_unit_price or 0))
    guests = max(1, int(guest_count or 1))
    if int(per_person_pricing or 0) == 1:
        return price * guests
    return price


def row_from_input(data):
    guest_count = max(50, min(int(data.get("guest_count") or 150), 800))
    category_code = category_to_code(data.get("category") or data.get("category_code"))
    district_tier = district_to_tier(data.get("district") or data.get("district_tier"))
    per_person_pricing = 1 if int(data.get("per_person_pricing") or 0) == 1 else 0
    base_unit_price = max(0, int(data.get("base_unit_price") or data.get("price") or 0))
    vendor_rating = round(float(data.get("vendor_rating") or data.get("rating") or 4.0), 1)
    vendor_rating = max(1.0, min(vendor_rating, 5.0))
    is_spotlight = 1 if data.get("is_spotlight") or data.get("spotlight") else 0
    package_complexity = max(1, min(int(data.get("package_complexity") or 2), 5))

    return {
        "guest_count": guest_count,
        "category_code": category_code,
        "district_tier": district_tier,
        "per_person_pricing": per_person_pricing,
        "base_unit_price": base_unit_price,
        "vendor_rating": vendor_rating,
        "is_spotlight": is_spotlight,
        "package_complexity": package_complexity,
        "estimated_total_lkr": estimate_total(base_unit_price, guest_count, per_person_pricing),
    }
