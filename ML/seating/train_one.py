from pathlib import Path
from collections import defaultdict
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.compose import ColumnTransformer
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATA = Path(r"C:\Users\ASUS\Desktop\WowWed\WowWed\ML\seating\seating_dataset.csv")
SEATS = 10
MAX_SAME = 8

df = pd.read_csv(DATA)
print("Coming guests:", len(df))

features = df[["age_group", "relationship_type", "priority"]]
prep = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), ["age_group", "relationship_type"]),
    ("num", StandardScaler(), ["priority"]),
])
X = prep.fit_transform(features)

ks = list(range(2, 16))
inertias = []
for k in ks:
    model = KMeans(n_clusters=k, random_state=42, n_init=10)
    model.fit(X)
    inertias.append(model.inertia_)
    print("k =", k, "inertia =", round(model.inertia_, 1))

best_k = ks[0]
best_bend = -1
for i in range(1, len(inertias) - 1):
    bend = (inertias[i - 1] - inertias[i]) - (inertias[i] - inertias[i + 1])
    if bend > best_bend:
        best_bend = bend
        best_k = ks[i]

kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
labels = kmeans.fit_predict(X)
sil = silhouette_score(X, labels)
print("Elbow chose k:", best_k)
print("Silhouette:", round(sil, 3))

df = df.copy()
df["cluster"] = labels
n = len(df)
need = (n + SEATS - 1) // SEATS
guests = df.sort_values(["priority", "cluster"], ascending=[False, True]).to_dict("records")
tables = [{"left": SEATS, "rels": defaultdict(int), "people": []} for _ in range(need)]

for guest in guests:
    rel = guest["relationship_type"]
    same = [t for t in tables if t["left"] > 0 and t["rels"][rel] > 0 and t["rels"][rel] < MAX_SAME]
    empty = [t for t in tables if t["left"] == SEATS]
    mixed = [t for t in tables if t["left"] > 0 and t["rels"][rel] < MAX_SAME]
    any_open = [t for t in tables if t["left"] > 0]
    pick = (same or empty or mixed or any_open)[0]
    pick["left"] -= 1
    pick["rels"][rel] += 1
    pick["people"].append(guest)

rows = []
for i, table in enumerate(tables, start=1):
    for guest in table["people"]:
        rows.append({
            "relationship_type": guest["relationship_type"],
            "table": "Table " + str(i),
        })

out = pd.DataFrame(rows)
assigned = len(out)
sizes = out.groupby("table").size()
over = int((sizes > SEATS).sum())
seat_score = assigned / n
capacity = float((sizes <= SEATS).mean())
ok = 0
for _, part in out.groupby("table"):
    maj = part["relationship_type"].mode().iloc[0]
    ok += int((part["relationship_type"] == maj).sum())
group = ok / n
accuracy = (0.20 * seat_score + 0.20 * capacity + 0.25 * group + 0.35 * sil) * 100

print("Assigned:", assigned)
print("Unseated:", n - assigned)
print("Tables:", len(sizes))
print("Tables over capacity:", over)
print("Guests within table size:", assigned, "/", n)
print("Seat score:", round(seat_score, 3))
print("Capacity score:", round(capacity, 3))
print("Group score:", round(group, 3))
print("Seating accuracy:", str(round(accuracy, 1)) + "%")
