import re


def relationship_and_priority(group):
    g = (group or "").strip().lower()
    if g == "vip":
        return "vip", 5
    if "family" in g:
        return "family", 4
    if g == "relatives":
        return "family", 3
    if "friend" in g:
        return "friend", 2
    if "colleague" in g:
        return "colleague", 2
    return "other", 1


def side_from_group(group):
    g = (group or "").strip().lower()
    if "bride" in g:
        return "bride"
    if "groom" in g:
        return "groom"
    return "both"


def expected_table(group, rel):
    g = (group or "").strip().lower()
    if rel == "vip" or g == "vip":
        return "vip"
    if "bride" in g and "family" in g:
        return "bride-family"
    if "groom" in g and "family" in g:
        return "groom-family"
    if g == "relatives":
        return "family"
    if "friend" in g or "colleague" in g:
        return "friends"
    return "general"


def as_text(value):
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() == "nan":
        return ""
    return text


def parse_age(age_value, notes=""):
    try:
        n = int(float(as_text(age_value)))
        if 1 <= n <= 120:
            return n
    except (TypeError, ValueError):
        pass

    text = as_text(notes).lower()
    m = re.search(r"\bage\s*[:\-]?\s*(\d{1,3})\b", text)
    if m:
        n = int(m.group(1))
        if n <= 120:
            return n
    m = re.search(r"\b(\d{1,3})\s*(years?\s*old|yrs?|yo)\b", text)
    if m:
        n = int(m.group(1))
        if n <= 120:
            return n

    bringing = "bringing" in text or "with child" in text or "2 children" in text or "3 children" in text
    if not bringing and re.search(r"\b(infant|toddler|baby|child|kid)\b", text):
        return 8
    if any(w in text for w in ("elderly", "senior", "grandmother", "grandfather", "grandma", "grandpa")):
        return 70
    return 35


def age_band(age):
    if age <= 12:
        return "child"
    if age >= 60:
        return "senior"
    return "adult"


def note_flag(notes, words):
    text = as_text(notes).lower()
    return 1 if any(w in text for w in words) else 0


def add_ml_columns(df):
    out = df.copy()
    ages = []
    bands = []
    sides = []
    plus = []
    wheel = []
    allergy = []
    labels = []
    for _, row in out.iterrows():
        rel = row.get("relationship_type")
        group = row.get("group")
        if not rel:
            rel, _ = relationship_and_priority(group)
        age = parse_age(row.get("age", ""), row.get("notes", ""))
        ages.append(age)
        bands.append(age_band(age))
        sides.append(side_from_group(group))
        plus.append(note_flag(row.get("notes"), ["+1", "plus one", "plus-one", "bringing +"]))
        wheel.append(note_flag(row.get("notes"), ["wheelchair"]))
        allergy.append(note_flag(row.get("notes"), ["allerg", "halal", "vegan", "vegetarian"]))
        labels.append(expected_table(group, rel))
    out["age"] = ages
    out["age_group"] = bands
    out["side"] = sides
    out["plus_one"] = plus
    out["wheelchair"] = wheel
    out["allergy"] = allergy
    out["expected_table"] = labels
    return out


def pick_elbow(ks, inertias):
    best_k = ks[0]
    best_bend = -1
    for i in range(1, len(inertias) - 1):
        bend = (inertias[i - 1] - inertias[i]) - (inertias[i] - inertias[i + 1])
        if bend > best_bend:
            best_bend = bend
            best_k = ks[i]
    return best_k


CAT_COLS = ["age_group", "relationship_type", "side"]
NUM_COLS = ["priority", "age", "plus_one", "wheelchair", "allergy"]
RF_FEATURE_COLS = [
    "age",
    "priority",
    "plus_one",
    "wheelchair",
    "allergy",
    "side_code",
    "relationship_code",
    "has_avoid",
]
SIDE_CODE = {"bride": 0, "groom": 1, "both": 2}
REL_CODE = {"other": 1, "colleague": 2, "friend": 3, "family": 4, "vip": 5}


def add_rf_columns(df):
    out = add_ml_columns(df)
    rels = []
    sides = []
    avoids = []
    for _, row in out.iterrows():
        rel = row.get("relationship_type")
        if not rel:
            rel, _ = relationship_and_priority(row.get("group"))
        rels.append(REL_CODE.get(rel, 1))
        side = row.get("side") or side_from_group(row.get("group"))
        sides.append(SIDE_CODE.get(side, 2))
        avoids.append(1 if as_text(row.get("avoid")) else 0)
    out["relationship_code"] = rels
    out["side_code"] = sides
    out["has_avoid"] = avoids
    return out
