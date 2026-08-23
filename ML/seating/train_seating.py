from pathlib import Path
import joblib
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

DATA = Path(r"C:\Users\ASUS\Desktop\WowWed\WowWed\ml\seating\seating_dataset.csv")
OUT = Path(r"C:\Users\ASUS\Desktop\WowWed\WowWed\ml\seating")
OUT.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA)
print("Guests:", len(df))

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

plt.figure(figsize=(7, 4))
plt.plot(ks, inertias, marker="o")
plt.xlabel("k (number of groups)")
plt.ylabel("Inertia")
plt.title("Elbow Method — Smart Seating")
plt.grid(True, alpha=0.3)
plot_path = OUT / "elbow.png"
plt.savefig(plot_path, bbox_inches="tight")
plt.close()
print("Saved plot:", plot_path)

k = 10
kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
labels = kmeans.fit_predict(X)
score = silhouette_score(X, labels)
print("Chosen k:", k)
print("Silhouette score:", round(score, 3))

df["cluster"] = labels
df.to_csv(OUT / "seating_with_clusters.csv", index=False)

joblib.dump(
    {"preprocessor": prep, "kmeans": kmeans, "k": k},
    OUT / "KMeans.pkl",
)
print("Saved model:", OUT / "KMeans.pkl")
print("Cluster sizes:", df["cluster"].value_counts().sort_index().to_dict())