@echo off
REM =====================================================================
REM   ANNAPATH - Automated Quality Assurance Suite
REM   Backend Unit & Integration Tests (Pytest) + Frontend Build Check
REM =====================================================================
cd /d "%~dp0."

echo.
echo =====================================================================
echo   ANNAPATH Quality Assurance Suite
echo =====================================================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment was not found. Please run setup.bat first.
    pause
    exit /b 1
)

call .venv\Scripts\activate.bat

echo [STEP 1/2] Running Backend Pytest Test Suite...
"%~dp0.venv\Scripts\python.exe" -m pytest tests -v
if %ERRORLEVEL% neq 0 (
    echo.
    echo [FAIL] Backend automated tests encountered failures.
    exit /b 1
)
echo [PASS] All 21 backend unit and integration tests passed.
echo.

echo [STEP 2/2] Running Frontend TypeScript Typecheck and Vite Production Build...
cd frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [FAIL] Frontend TypeScript typecheck or build failed.
    cd ..
    exit /b 1
)
cd ..
echo [PASS] Frontend compiled cleanly with zero errors.
echo.

echo =====================================================================
echo   [SUCCESS] Full Verification Passed: All Systems Operational.
echo =====================================================================
