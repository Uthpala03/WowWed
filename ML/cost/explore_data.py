import pandas as pd

excel_path = r"c:\Users\ASUS\Desktop\WowWed\Vendor list\WowWed_Vendors_Complete.xlsx"

xlsx = pd.ExcelFile(excel_path)
print("Sheets found:")
print(xlsx.sheet_names)
print()

for sheet in xlsx.sheet_names:
    df = pd.read_excel(excel_path, sheet_name=sheet)
    print("=" * 60)
    print("Sheet:", sheet)
    print("Rows:", len(df))
    print("Columns:", list(df.columns))
    print(df.head(3))
    print()