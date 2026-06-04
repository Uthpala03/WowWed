# WowWed setup guide

## VS Code extensions (install manually)

Open VS Code → Extensions (four squares on the left) → search and install:

- ESLint
- Prettier
- ES7+ React Snippets
- Python (Microsoft)
- SQL Server (mssql)
- GitLens
- Thunder Client

## Terminal in VS Code

**Terminal → New Terminal** (or `Ctrl+`` on Windows).

## Project location

```
C:\Users\asus\OneDrive\Desktop\Wowwed
```

## SQL Server (SSMS)

1. Open SQL Server Management Studio.
2. Connect: `localhost\SQLEXPRESS` or `localhost`, Windows Authentication.
3. Run `docs/database-setup.sql` to create **WowWedDB** and the **Users** table.

## Git (root repo only)

CRA created a nested `.git` inside `frontend/`. Use the root repo:

```powershell
cd C:\Users\asus\OneDrive\Desktop\Wowwed
git init
git add .
git commit -m "Initial WowWed project structure"
```

Set your name/email locally (not global) if needed:

```powershell
git config user.name "Your Name"
git config user.email "your@email.com"
```

Push to GitHub after creating a repo named `wowwed`:

```powershell
git remote add origin https://github.com/YOURNAME/wowwed.git
git branch -M main
git push -u origin main
```

## Python AI engine

If `python` is not found, install Python from https://www.python.org/ (check “Add to PATH”), then:

```powershell
cd C:\Users\asus\OneDrive\Desktop\Wowwed\ai-engine
py -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

AI API: http://localhost:5001

## Run the stack

**Terminal 1 — backend:**

```powershell
cd C:\Users\asus\OneDrive\Desktop\Wowwed\backend
npm run dev
```

**Terminal 2 — frontend:**

```powershell
cd C:\Users\asus\OneDrive\Desktop\Wowwed\frontend
npm start
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:5000
