# ANNAPATH — Troubleshooting & Common Issues Guide

---

## 1. Port 8000 Already in Use

### Symptom
`[ERROR] [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000): address already in use`

### Solution
Another application or background Uvicorn instance is using port 8000.
In PowerShell:
```powershell
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
```
Or start ANNAPATH on a different port:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8080
```

---

## 2. Python Version Mismatch on Windows

### Symptom
Setup fails or reports `ModuleNotFoundError` for packages installed in a different Python runtime.

### Solution
Ensure Python 3.10–3.12 is invoked:
```powershell
py -3.12 -m venv .venv
```
The provided `.bat` scripts (`setup.bat`, `run.bat`, `test.bat`) explicitly use `"%~dp0.venv\Scripts\python.exe"` to guarantee the virtual environment runtime is used regardless of system PATH settings.

---

## 3. Frontend Changes Not Appearing

### Symptom
You edited React components in `frontend/src/` but the browser still serves the old interface at `http://127.0.0.1:8000`.

### Solution
1. Recompile the production frontend build:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
2. Or run in hot-reload development mode:
   ```bat
   run.bat --dev
   ```
   This launches the FastAPI backend on port 8000 and the Vite hot-module reload dev server on `http://localhost:5173`.

---

## 4. Resetting Sample Database

### Symptom
You wish to reset all listings, OTPs, and reservations back to the initial pristine state.

### Solution
Simply re-run the seed script:
```bash
python scripts/init_db.py
```
This drops existing tables, re-applies schema constraints, and seeds fresh demo data.
