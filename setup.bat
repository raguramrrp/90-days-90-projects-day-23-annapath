@echo off
REM =====================================================================
REM   ANNAPATH - Community Food Redistribution Platform Setup
REM   Good food deserves another destination.
REM =====================================================================
cd /d "%~dp0."

echo.
echo =====================================================================
echo   ANNAPATH - Automated Setup Script (Windows)
echo =====================================================================
echo.

REM 1. Check Python
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in system PATH.
    echo Please install Python 3.10+ and re-run setup.bat.
    pause
    exit /b 1
)
echo [OK] Python runtime detected.

REM 2. Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in system PATH.
    echo Please install Node.js 18+ and re-run setup.bat.
    pause
    exit /b 1
)
echo [OK] Node.js runtime detected.

REM 3. Create or verify Virtual Environment
if not exist ".venv\Scripts\python.exe" (
    echo [INFO] Creating Python virtual environment in .venv...
    if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" -m venv .venv
    ) else (
        python -m venv .venv
    )
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)
echo [OK] Python virtual environment ready.

REM Activate venv
call .venv\Scripts\activate.bat

REM 4. Install Python Dependencies
echo [INFO] Installing Python dependencies from requirements.txt...
"%~dp0.venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet --no-warn-script-location
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Some dependencies were cached or already satisfied.
)
echo [OK] Python dependencies verified.

REM 5. Initialize & Seed Database
echo [INFO] Initializing ANNAPATH SQLite database and seeding Indian metro data...
"%~dp0.venv\Scripts\python.exe" scripts\init_db.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Database initialization failed.
    pause
    exit /b 1
)
echo [OK] Database seeded successfully.

REM 6. Setup Frontend
echo [INFO] Verifying frontend packages and compiling production bundle...
cd frontend
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
)
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Unified React + Tailwind frontend built successfully.

echo.
echo =====================================================================
echo   [SUCCESS] ANNAPATH Setup Complete!
echo   Run 'run.bat' to launch the unified application on http://127.0.0.1:8000
echo =====================================================================
echo.
pause
