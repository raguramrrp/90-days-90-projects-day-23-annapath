# ANNAPATH — Quickstart Guide

> **Good food deserves another destination.**  
> India's Community Food Redistribution & Surplus Management Platform

---

## ⚡ Fast Track (One-Click Windows Setup)

```bat
# 1. Clone or extract the repository
cd 90-days-90-projects-day-23-annapath

# 2. Run automated Windows environment setup
setup.bat

# 3. Start unified application (FastAPI + React Dashboard)
run.bat
```

Once running, navigate to:
- **Unified Web Application:** `http://127.0.0.1:8000`
- **Interactive OpenAPI Documentation:** `http://127.0.0.1:8000/docs`
- **Alternative ReDoc:** `http://127.0.0.1:8000/redoc`

---

## 🛠️ Manual Step-by-Step Setup

### Prerequisites
- **Python:** 3.10, 3.11, or 3.12 (`python --version`)
- **Node.js:** v18+ with `npm` (`node --version`)
- **Git** (optional for cloning)

### Step 1: Virtual Environment
```bash
python -m venv .venv
# Windows Command Prompt
.venv\Scripts\activate.bat
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

### Step 2: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Seed Realistic Indian Metro Data
```bash
python scripts/init_db.py
```
This populates hotels in Bengaluru, Chennai, and Mumbai with surplus food listings, sample reservations, and verified volunteer tasks.

### Step 4: Build React Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 5: Launch Application
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

---

## 🎭 Pre-Configured Demo Credentials

Use the top **Demo Persona Switcher bar** in the web UI for 1-click switching, or log in with these credentials:

| Role | Account Email | Password | Persona & Context |
|---|---|---|---|
| **Recipient** | `recipient@annapath.org` | `recipientpassword123` | Ravi Shankar (Bengaluru) — Discovers food & views collection OTP |
| **Hotel Owner** | `owner@tajwestend.com` | `ownerpassword123` | Pooja Hegde — The Taj West End Heritage Kitchen |
| **Hotel Staff** | `staff@tajwestend.com` | `staffpassword123` | Kiran Kumar — Counter Staff (verifies collection OTP) |
| **Volunteer** | `volunteer@annapath.org` | `volunteerpassword123` | Arun Swaminathan — Two-wheeler delivery courier |
| **Admin** | `admin@annapath.org` | `adminpassword123` | Platform Governance & Compliance Officer |

---

## 🧪 Running Automated Tests

```bat
test.bat
```
Or manually:
```bash
python -m pytest tests -v
```
All 21 unit and integration tests run in ~1.5s with zero external network dependencies.
