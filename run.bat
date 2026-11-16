@echo off
REM =====================================================================
REM   ANNAPATH - Community Food Redistribution Platform
REM   Good food deserves another destination.
REM =====================================================================
cd /d "%~dp0."

echo.
echo =====================================================================
echo   ANNAPATH - Launcher
echo   Good food deserves another destination.
echo =====================================================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment was not found.
    echo Please execute setup.bat first.
    pause
    exit /b 1
)

call .venv\Scripts\activate.bat

if "%1"=="--dev" goto run_dev
if "%1"=="-d" goto run_dev

if not exist "frontend\dist\index.html" (
    echo [INFO] Production frontend build not found. Compiling now...
    cd frontend
    call npm run build
    cd ..
)

echo [INFO] Starting ANNAPATH Unified Server...
echo - Web Dashboard:   http://127.0.0.1:8000
echo - Interactive API: http://127.0.0.1:8000/docs
echo - Alternative API: http://127.0.0.1:8000/redoc
echo.
echo Press Ctrl+C in this console to terminate.
echo.

"%~dp0.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
goto :eof

:run_dev
echo [INFO] Starting ANNAPATH in Full Development Mode...
echo - Backend API:  http://127.0.0.1:8000
echo - Frontend Dev: http://localhost:5173
echo.
start "ANNAPATH Backend API" cmd /k "cd /d "%~dp0." && "%~dp0.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"
start "ANNAPATH Frontend UI" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo [INFO] Development servers launched in separate windows.
goto :eof
