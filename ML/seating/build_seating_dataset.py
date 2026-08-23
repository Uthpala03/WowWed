import csv
from pathlib import Path
import pandas as pd
from guest_features import add_ml_columns, relationship_and_priority

path = Path(r"C:\Users\ASUS\Desktop\WowWed\WowWed\ml\seating\wowwed-guests-export.csv")
out_path = Path(r"C:\Users\ASUS\Desktop\WowWed\WowWed\ml\seating\seating_dataset.csv")

with path.open("r", encoding="utf-8-sig", newline="") as f:
    guests = list(csv.DictReader(f))

coming = [g for g in guests if g.get("rsvp", "").strip() in ("Accepted", "Coming")]

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
df.to_csv(out_path, index=False)

from collections import Counter
print("Coming guests saved:", len(df))
print("Saved to:", out_path)
print("Relationship:", dict(Counter(df["relationship_type"])))
print("Age group:", dict(Counter(df["age_group"])))
print("Example:", df.iloc[0]["name"], df.iloc[0]["group"], int(df.iloc[0]["age"]), df.iloc[0]["age_group"])