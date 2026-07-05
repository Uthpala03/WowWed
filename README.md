# WowWed

Wedding planning app — React + Node.js + MySQL.

## Run (VS Code)

### 1. Set up MySQL

Install MySQL 8+ and create the database:

```powershell
cd WowWed\backend
copy .env.example .env
# Edit .env — set DB_PASSWORD to your MySQL root password

npm install
npm run db:init
```

Or run the SQL file manually:

```powershell
mysql -u root -p < docs\mysql-setup.sql
```

### 2. Start the app

```powershell
cd WowWed
npm install
npm run install:all
npm run dev
```

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
