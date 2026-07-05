# WowWed

Wedding planning app — React + Node.js + MySQL.

## Run (VS Code)

## Database (MySQL — auto-sync)

**Database name:** `wowwed` on `localhost:3306`

Tables are created **automatically** when the backend starts. You do not need phpMyAdmin to create tables manually.

### Add a new table later

1. Add `CREATE TABLE IF NOT EXISTS ...` to `docs/mysql-setup.sql`
2. Restart the backend (`npm run dev`) — the new table appears automatically

Or run manually once:

```powershell
npm run db:init --prefix backend
```

### First-time setup

```powershell
cd WowWed\backend
copy .env.example .env
# Edit .env — set DB_PASSWORD if your MySQL root user has one

npm install
npm run db:init
```

Create the empty `wowwed` database in phpMyAdmin first (or let `db:init` create it).

### Start the app

Open http://localhost:3001

Or press **F5** → **Run WowWed**

Or double-click `Launch WowWed.bat`

## Ports

- Website: http://localhost:3001
- API: http://localhost:5002
- Health check: http://localhost:5002/api/health

## Folders

- `frontend/` — React UI
- `backend/` — Express API + MySQL
- `ai-engine/` — Python AI (optional)
- `docs/mysql-setup.sql` — MySQL schema + seed vendors

## What is stored in MySQL

| Table | Data |
|-------|------|
| `users` | Accounts (couples & vendors) |
| `onboarding` | Onboarding answers |
| `wedding_profiles` | Couple wedding details |
| `vendor_profiles` | Vendor business profiles |
| `vendor_listings` | Marketplace listings (seed + registered vendors) |
| `user_data` | Tasks, guests, budget, seating, crew, invitations |
| `bookings` | Vendor booking requests |

Login session token is kept in browser localStorage only (`wowwed_token`).
