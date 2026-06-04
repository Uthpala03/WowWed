# WowWed

Wedding planning platform with a React frontend, Node.js API, and Python AI engine.

## Project structure

```
Wowwed/
├── frontend/     ← React app (what users see)
├── backend/      ← Node.js + Express (server & API)
├── ai-engine/    ← Python (ML models & AI logic)
└── docs/         ← project documents
```

## Quick start

### Backend

```bash
cd backend
npm install
node server.js
```

API: http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm start
```

App: http://localhost:3000

### AI engine

```bash
cd ai-engine
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Database

See `docs/database-setup.sql` for creating `WowWedDB` in SQL Server.

## Environment

Copy `backend/.env.example` to `backend/.env` and fill in your values.
