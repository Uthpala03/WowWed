from pathlib import Path
import math
import pandas as pd

FOLDER = Path(r"C:\Users\ASUS\Desktop\WowWed\WowWed\ml\seating")
SEATS_PER_TABLE = 10

df = pd.read_csv(FOLDER / "seating_with_clusters.csv")

# Best guests first: VIP / high priority, then children together
df = df.sort_values(
    by=["priority", "relationship_type", "age_group", "cluster"],
    ascending=[False, True, True, True],
).reset_index(drop=True)

need = math.ceil(len(df) / SEATS_PER_TABLE)
print("Coming guests:", len(df))
print("Tables needed:", need, "x", SEATS_PER_TABLE, "seats")

assignments = []
table_no = 1
seat = 0

for _, guest in df.iterrows():
    if seat >= SEATS_PER_TABLE:
        table_no += 1
        seat = 0
    assignments.append({
        "name": guest["name"],
        "group": guest["group"],
        "relationship_type": guest["relationship_type"],
        "priority": int(guest["priority"]),
        "age_group": guest["age_group"],
        "cluster": int(guest["cluster"]),
        "table": f"Table {table_no}",
        "seat": seat + 1,
    })
    seat += 1

out = pd.DataFrame(assignments)
out.to_csv(FOLDER / "seating_assignments.csv", index=False)

# Hard rule: no table over capacity
sizes = out.groupby("table").size()
over = int((sizes > SEATS_PER_TABLE).sum())
unseated = len(df) - len(out)
violation_rate = over / len(out) if len(out) else 0

vip_tables = out.loc[out["relationship_type"] == "vip", "table"].nunique()
print("Assigned:", len(out))
print("Unseated:", unseated)
print("Tables over capacity:", over)
print("Constraint violation rate:", round(violation_rate, 3))
print("VIP spread across tables:", vip_tables)
print("First 8 rows:")
print(out.head(8).to_string(index=False))
print("Saved:", FOLDER / "seating_assignments.csv")