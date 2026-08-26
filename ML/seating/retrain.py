from pathlib import Path
import csv
import joblib
import matplotlib.pyplot as plt
import pandas as pd
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

FOLDER = Path(__file__).resolve().parent
EXPORT = FOLDER / "wowwed-guests-export.csv"
DATASET = FOLDER / "seating_dataset.csv"


def build_dataset():
    with EXPORT.open("r", encoding="utf-8-sig", newline="") as f:
        guests = list(csv.DictReader(f))
    coming = [g for g in guests if (g.get("rsvp") or "").strip() in ("Accepted", "Coming")]
    rows = []
    for g in coming:
        rel, pri = relationship_and_priority(g.get("group"))
        rows.append({
            "name": g.get("name", ""),
            "email": g.get("email", ""),
            "phone": g.get("phone", ""),
            "group": g.get("group", ""),
            "notes": g.get("notes", ""),
            "rsvp": g.get("rsvp", ""),
            "age": g.get("age", ""),
            "avoid": g.get("avoid", ""),
            "relationship_type": rel,
            "priority": pri,
        })
    df = add_ml_columns(pd.DataFrame(rows))
    df.to_csv(DATASET, index=False)
    print("Coming guests in dataset:", len(df))


def train():
    df = add_ml_columns(pd.read_csv(DATASET))
    prep = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), CAT_COLS),
        ("num", StandardScaler(), NUM_COLS),
    ])
    X = prep.fit_transform(df[CAT_COLS + NUM_COLS])

    ks = list(range(2, 16))
    inertias = []
    for k in ks:
        model = KMeans(n_clusters=k, random_state=42, n_init=10)
        model.fit(X)
        inertias.append(model.inertia_)
        print("k =", k, "inertia =", round(model.inertia_, 1))

    plt.figure(figsize=(7, 4))
    plt.plot(ks, inertias, marker="o")
    plt.xlabel("k (number of groups)")
    plt.ylabel("Inertia")
    plt.title("Elbow Method — Smart Seating")
    plt.grid(True, alpha=0.3)
    plt.savefig(FOLDER / "elbow.png", bbox_inches="tight")
    plt.close()

    k = pick_elbow(ks, inertias)
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X)
    score = silhouette_score(X, labels)
    print("Elbow chose k:", k)
    print("Silhouette:", round(score, 3))

    df["cluster"] = labels
    df.to_csv(FOLDER / "seating_with_clusters.csv", index=False)
    joblib.dump({"preprocessor": prep, "kmeans": kmeans, "k": k}, FOLDER / "KMeans.pkl")
    print("Saved:", FOLDER / "KMeans.pkl")


if __name__ == "__main__":
    if not EXPORT.exists():
        raise SystemExit("Put wowwed-guests-export.csv in the seating folder first.")
    build_dataset()
    train()
