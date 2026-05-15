@echo off
echo ========================================
echo Delhi Grievance Portal - Quick Launcher
echo Government of NCT of Delhi
echo ========================================
echo.
echo This script will start all three services:
echo  1. Backend (Spring Boot) - Port 8080
echo  2. AI Service (Python Flask) - Port 5000
echo  3. Frontend (React) - Port 3000
echo.
echo Make sure you have:
echo  - Java 17+, Maven installed
echo  - Python 3.10+ and pip installed
echo  - Node.js 18+ and npm installed
echo  - MySQL running with delhi_grievance database
echo.
echo Press Ctrl+C in any window to stop that service.
echo.

REM Start AI Service
echo [1/3] Starting AI Service...
start "AI Service - Flask" cmd /k "cd /d %~dp0ai-service && pip install -r requirements.txt && python app.py"

timeout /t 5

REM Start Backend
echo [2/3] Starting Spring Boot Backend...
start "Backend - Spring Boot" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

timeout /t 10

REM Start Frontend
echo [3/3] Starting React Frontend...
start "Frontend - React" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo All services starting...
echo.
echo  Frontend:  http://localhost:3000
echo  Backend:   http://localhost:8080/api
echo  AI Service: http://localhost:5000
echo.
pause
