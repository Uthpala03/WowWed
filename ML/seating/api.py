from pathlib import Path
from typing import List, Optional

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.cluster import KMeans
from sklearn.compose import ColumnTransformer
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from guest_features import (
    CAT_COLS,
    NUM_COLS,
    add_ml_columns,
    pick_elbow,
    relationship_and_priority,
)

FOLDER = Path(r"C:\Users\ASUS\Desktop\WowWed\WowWed\ml\seating")
SEATS_PER_TABLE = 10
COMING = {"accepted", "coming", "yes", "y"}

app = FastAPI(title="WowWed Smart Seating")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    bundle = joblib.load(FOLDER / "KMeans.pkl")
except Exception:
    bundle = {"preprocessor": None, "kmeans": None, "k": 5}


class GuestIn(BaseModel):
    id: Optional[str] = ""
    name: str = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    group: Optional[str] = ""
    notes: Optional[str] = ""
    rsvp: Optional[str] = ""
    avoid: Optional[str] = ""
    age: Optional[str] = ""

    model_config = {"extra": "ignore"}


class TableIn(BaseModel):
    id: Optional[str] = ""
    name: Optional[str] = ""
    seats: int = 10
    shape: Optional[str] = "round"
    suite: Optional[str] = "general"
    priority: Optional[int] = 5


class OptimizeIn(BaseModel):
    guests: List[GuestIn]
    tables: List[TableIn] = []


def is_coming(rsvp):
    return (rsvp or "").strip().lower() in COMING


def guests_to_frame(raw_guests):
    rows = []
    for g in raw_guests:
        data = g.model_dump() if hasattr(g, "model_dump") else dict(g)
        if not is_coming(data.get("rsvp")):
            continue
        rel, pri = relationship_and_priority(data.get("group"))
        rows.append({
            "id": data.get("id") or "",
            "name": data.get("name") or "",
            "email": data.get("email") or "",
            "phone": data.get("phone") or "",
            "group": data.get("group") or "",
            "notes": data.get("notes") or "",
            "rsvp": data.get("rsvp") or "",
            "avoid": data.get("avoid") or "",
            "age": "" if data.get("age") is None else str(data.get("age")),
            "relationship_type": rel,
            "priority": pri,
        })
    return pd.DataFrame(rows)


def train_on_guests(df):
    global bundle
    df = add_ml_columns(df)
    if len(df) < 3:
        df["cluster"] = 0
        return df, None

    prep = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), CAT_COLS),
        ("num", StandardScaler(), NUM_COLS),
    ])
    X = prep.fit_transform(df[CAT_COLS + NUM_COLS])
    max_k = min(8, max(2, len(df) - 1))
    ks = list(range(2, max_k + 1))
    inertias = []
    for k in ks:
        model = KMeans(n_clusters=k, random_state=42, n_init=5)
        model.fit(X)
        inertias.append(model.inertia_)
    k = pick_elbow(ks, inertias)
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=5)
    labels = kmeans.fit_predict(X)
    score = None
    if len(set(labels)) >= 2:
        score = round(float(silhouette_score(X, labels)), 3)
    df = df.copy()
    df["cluster"] = labels
    bundle = {"preprocessor": prep, "kmeans": kmeans, "k": k}
    joblib.dump(bundle, FOLDER / "KMeans.pkl")
    return df, score


def add_clusters(df):
    if df.empty:
        df["cluster"] = []
        return df, None
    df, score = train_on_guests(df)
    df = df.sort_values(
        by=["priority", "relationship_type", "age_group", "cluster"],
        ascending=[False, True, True, True],
    ).reset_index(drop=True)
    return df, score


def table_capacity(table):
    return max(1, min(20, int(getattr(table, "seats", None) or SEATS_PER_TABLE)))


def table_kind(table):
    suite = (getattr(table, "suite", None) or "general").lower()
    shape = (getattr(table, "shape", None) or "").lower()
    if suite == "vip" or shape == "head":
        return "vip"
    return suite


def preferred_kinds(group, rel):
    g = (group or "").strip().lower()
    if rel == "vip" or g == "vip":
        return ["vip"]
    if "bride" in g and "family" in g:
        return ["bride-family", "general"]
    if "groom" in g and "family" in g:
        return ["groom-family", "general"]
    if g == "relatives":
        return ["bride-family", "groom-family", "general"]
    if "friend" in g or "colleague" in g:
        return ["friends", "general"]
    return ["general", "friends"]


def group_rank(group, rel):
    g = (group or "").strip().lower()
    if rel == "vip" or g == "vip":
        return 0
    if "bride" in g and "family" in g:
        return 1
    if "groom" in g and "family" in g:
        return 2
    if g == "relatives":
        return 3
    return 10


def assign_to_tables(df, tables):
    rows = []
    if df.empty:
        return rows, 0

    if not tables:
        table_no = 1
        seat = 0
        for _, guest in df.iterrows():
            if seat >= SEATS_PER_TABLE:
                table_no += 1
                seat = 0
            rows.append(assignment_row(guest, f"Table {table_no}", seat + 1, ""))
            seat += 1
        return rows, 0

    slots = []
    for table in tables:
        slots.append({
            "table": table,
            "kind": table_kind(table),
            "left": table_capacity(table),
            "seat": 1,
            "groups": set(),
            "names": set(),
            "people": [],
        })

    batches = []
    for group_name, part in df.groupby("group", dropna=False):
        members = part.to_dict("records")
        members.sort(key=lambda g: (0 if g.get("age_group") == "child" else 1, -int(g.get("priority") or 1)))
        rel = members[0].get("relationship_type") if members else "other"
        batches.append((group_rank(group_name, rel), group_name or "Other", members, rel))
    batches.sort(key=lambda item: (item[0], item[1]))

    for _, group_name, members, rel in batches:
        kinds = preferred_kinds(group_name, rel)
        leftover = list(members)
        while leftover:
            guest = leftover.pop(0)
            open_slots = [s for s in slots if s["left"] > 0]
            if not open_slots:
                break
            preferred = [s for s in open_slots if s["kind"] in kinds]
            if not preferred and "vip" in kinds:
                preferred = open_slots
            elif not preferred:
                preferred = open_slots
            same = [s for s in preferred if group_name in s["groups"]]

            def has_conflict(slot):
                mine = (guest.get("name") or "").strip().lower()
                avoided = {
                    p.strip().lower()
                    for p in (guest.get("avoid") or "").replace(";", ",").split(",")
                    if p.strip()
                }
                if slot["names"] & avoided:
                    return True
                for other in slot["people"]:
                    other_avoid = {
                        p.strip().lower()
                        for p in (other.get("avoid") or "").replace(";", ",").split(",")
                        if p.strip()
                    }
                    if mine in other_avoid:
                        return True
                return False

            safe = [s for s in (same or preferred) if not has_conflict(s)]
            pick = max(safe or same or preferred, key=lambda s: s["left"])
            rows.append(assignment_row(
                guest,
                pick["table"].name or group_name,
                pick["seat"],
                pick["table"].id or "",
            ))
            pick["seat"] += 1
            pick["left"] -= 1
            pick["groups"].add(group_name)
            pick["names"].add((guest.get("name") or "").strip().lower())
            pick["people"].append(guest)

    return rows, 0


def assignment_row(guest, table_name, seat, table_id):
    return {
        "id": guest.get("id", ""),
        "name": guest.get("name", ""),
        "email": guest.get("email", ""),
        "phone": guest.get("phone", ""),
        "group": guest.get("group", ""),
        "relationship_type": guest.get("relationship_type", ""),
        "priority": int(guest.get("priority", 1)),
        "age_group": guest.get("age_group", ""),
        "age": int(guest.get("age", 0) or 0),
        "expected_table": guest.get("expected_table", ""),
        "cluster": int(guest.get("cluster", 0)),
        "avoid": guest.get("avoid", ""),
        "table": table_name,
        "table_id": table_id,
        "seat": seat,
    }


def build_flags(assignments, tables, unseated):
    flags = []
    if unseated:
        flags.append({
            "type": "unseated",
            "message": f"{unseated} Coming guest(s) have no chair. Add tables or chairs, then Auto-seat again.",
        })

    by_group = {}
    for row in assignments:
        by_group.setdefault(row.get("group") or "Other", []).append(row)

    kinds = {}
    if tables:
        for table in tables:
            kinds[table.id or ""] = table_kind(table)

    for group, rows in by_group.items():
        tables_used = []
        for row in rows:
            name = row.get("table") or ""
            if name and name not in tables_used:
                tables_used.append(name)
        rel = (rows[0].get("relationship_type") or "").lower()
        g = group.lower()
        is_family = rel in ("family", "vip") or "family" in g or g in ("relatives", "vip")
        if is_family and len(tables_used) > 1:
            biggest = 10
            if tables:
                biggest = max(table_capacity(t) for t in tables)
            if len(rows) <= biggest:
                shown = ", ".join(tables_used[:4])
                extra = "…" if len(tables_used) > 4 else ""
                flags.append({
                    "type": "family_split",
                    "message": f"{group} could sit at one table but is split across {len(tables_used)} ({shown}{extra}).",
                })

        child_tables = []
        child_count = 0
        for row in rows:
            if row.get("age_group") != "child":
                continue
            child_count += 1
            name = row.get("table") or ""
            if name and name not in child_tables:
                child_tables.append(name)
        if child_count > 1 and len(child_tables) > 1:
            flags.append({
                "type": "children_split",
                "message": f"Children in {group} are at {len(child_tables)} tables. You can sit them together.",
            })

    vip_off = 0
    has_vip_table = any(kind == "vip" for kind in kinds.values())
    if has_vip_table:
        for row in assignments:
            if row.get("relationship_type") != "vip":
                continue
            if kinds.get(row.get("table_id") or "", "") != "vip":
                vip_off += 1
        if vip_off:
            flags.append({
                "type": "vip_placement",
                "message": f"{vip_off} VIP guest(s) are not at a VIP / Head table.",
            })

    by_table = {}
    for row in assignments:
        by_table.setdefault(row.get("table") or "", []).append(row)
    for table_name, people in by_table.items():
        names = [(p.get("name") or "").strip() for p in people]
        lower = [n.lower() for n in names]
        for person in people:
            mine = (person.get("name") or "").strip()
            avoided = [
                p.strip()
                for p in (person.get("avoid") or "").replace(";", ",").split(",")
                if p.strip()
            ]
            for enemy in avoided:
                if enemy.lower() in lower and enemy.lower() != mine.lower():
                    flags.append({
                        "type": "conflict",
                        "message": f"{mine} should not sit with {enemy} — both are at {table_name}. Move one of them.",
                    })

    return flags


def score_quality(df, assignments, tables, silhouette):
    coming = max(int(len(df)), 1)
    assigned = len(assignments)
    seat = assigned / coming
    over = 0
    table_count = len(tables) if tables else 0
    if tables:
        by_table = {}
        for row in assignments:
            key = row.get("table_id") or row.get("table")
            by_table[key] = by_table.get(key, 0) + 1
        for table in tables:
            key = table.id or table.name
            if by_table.get(key, 0) > table_capacity(table):
                over += 1
        cap = 1 - (over / max(table_count, 1))
    else:
        cap = 1.0

    by_table_rel = {}
    for row in assignments:
        by_table_rel.setdefault(row.get("table") or "", []).append(row.get("relationship_type"))
    group_ok = 0
    for rels in by_table_rel.values():
        if not rels:
            continue
        maj = max(set(rels), key=rels.count)
        group_ok += rels.count(maj)
    group = group_ok / coming if coming else 0

    kinds = {}
    if tables:
        for table in tables:
            kinds[table.id or ""] = table_kind(table)
    label_ok = 0
    for row in assignments:
        want = preferred_kinds(row.get("group"), row.get("relationship_type"))
        got = kinds.get(row.get("table_id") or "", "")
        if got and got in want:
            label_ok += 1
    label = label_ok / assigned if assigned else 0
    if not kinds:
        label = group

    sil = float(silhouette or 0)
    accuracy = round((0.20 * seat + 0.20 * cap + 0.25 * group + 0.35 * sil) * 100, 1)
    return {
        "over": over,
        "seat": round(seat, 3),
        "capacity_score": round(cap, 3),
        "group_score": round(group, 3),
        "label_accuracy": round(label * 100, 1),
        "seating_accuracy": accuracy,
    }


def result_payload(df, assignments, source, tables=None, silhouette=None):
    coming = int(len(df))
    assigned = len(assignments)
    unseated = max(0, coming - assigned)
    capacity = 0
    if tables:
        capacity = sum(table_capacity(t) for t in tables)
    quality = score_quality(df, assignments, tables, silhouette)
    return {
        "source": source,
        "coming": coming,
        "assigned": assigned,
        "unseated": unseated,
        "capacity": capacity,
        "capacity_violations": quality["over"],
        "violation_rate": round(quality["over"] / coming, 3) if coming else 0,
        "silhouette": silhouette,
        "k": int(bundle.get("k") or 0),
        "seat_score": quality["seat"],
        "capacity_score": quality["capacity_score"],
        "group_score": quality["group_score"],
        "label_accuracy": quality["label_accuracy"],
        "seating_accuracy": quality["seating_accuracy"],
        "tables": len({row["table"] for row in assignments}) if assignments else 0,
        "flags": build_flags(assignments, tables, unseated),
        "assignments": assignments,
    }


@app.get("/health")
def health():
    return {"ok": True, "model": "KMeans.pkl"}


@app.get("/optimize")
def optimize_from_csv():
    guests = pd.read_csv(FOLDER / "seating_dataset.csv")
    guests, score = add_clusters(guests)
    assignments, _ = assign_to_tables(guests, [])
    return result_payload(guests, assignments, "csv", silhouette=score)


@app.post("/optimize")
def optimize_live(body: OptimizeIn):
    df = guests_to_frame(body.guests)
    df, score = add_clusters(df)
    assignments, _ = assign_to_tables(df, body.tables)
    return result_payload(df, assignments, "live", body.tables, score)
