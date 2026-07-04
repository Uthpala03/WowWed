@echo off
cd /d "%~dp0"
echo Starting WowWed...
echo   Website: http://localhost:3001
echo   API:     http://localhost:5002
echo.
if not exist "backend\node_modules" (
  echo Installing backend packages...
  npm install --prefix backend
)
if not exist "frontend\node_modules" (
  echo Installing frontend packages...
  npm install --prefix frontend
)
start "" "http://localhost:3001"
npm run dev
