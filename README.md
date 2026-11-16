# ANNAPATH — Community Food Redistribution & Surplus Management Platform

> **Tagline:** Good food deserves another destination.  
> **Initial Market:** India (Bengaluru, Chennai, Mumbai, Delhi, Hyderabad)  
> **Part of:** 90 Days – 90 Projects Challenge (Day 23)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLite / SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00.svg?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Tests Passing](https://img.shields.io/badge/tests-21%2F21%20passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Problem Statement & Motivation

In India, an estimated **68 million tonnes of edible food is wasted every year**, even as community food insecurity persists in every urban center. High-end hotels, banquet halls, corporate cafeterias, and artisanal bakeries regularly produce surplus food of impeccable culinary quality that must be cleared at the end of buffet shifts or daily baking cycles.

Currently, surplus food redistribution is hampered by three critical friction points:
1. **Lack of Verified Food Safety:** Recipients and organizations hesitate to accept food without explicit temperature logging, hygiene declarations, and allergen disclosures.
2. **Accountability Gaps:** Manual handovers often lack proof of receipt, leading to false claims or uncollected food that ends up spoiled anyway.
3. **Logistics Friction:** Recipients may lack transportation to travel across town, while willing volunteers have no structured, low-friction platform to accept nearby micro-delivery runs.

**ANNAPATH** solves this by establishing a decentralized, multi-role redistribution network connecting surplus food providers with recipients and community organizations—verified by cryptographic OTP handovers and strict carbon audit benchmarks.

---

## 2. Objectives & Intended Users

### Core Value Proposition
- **Hotels & Food Providers:** Prevent food waste, recover nominal packaging costs, and maintain transparent Corporate Social Responsibility (CSR) and ESG metrics.
- **Recipients & Communities:** Gain dignified access to free or affordable, freshly prepared meals with transparent allergen declarations.
- **Volunteers:** Take up structured micro-delivery runs within their neighborhood with zero penalties for declining tasks.
- **NGOs & Shelters:** Coordinate multi-meal bulk distributions with verified tracking.
- **Platform Administrators:** Monitor FSSAI compliance, moderate safety incidents, and preserve immutable audit logs.

---

## 3. Key Features

- **Multi-Role Workspaces:** Dedicated role-specific interfaces for Recipients, Hotel Owners, Hotel Staff, Volunteers, and Platform Administrators.
- **Instant Role Switcher Bar:** Top-level 1-click persona bar allowing evaluators and recruiters to test all 5 roles seamlessly without manual re-login.
- **Interactive OpenStreetMap Discovery:** Visual map and list views showing surplus batches with live portion counts and Haversine distance calculations.
- **Atomic Inventory Locking:** High-concurrency database transactions prevent double-booking or negative inventory allocation.
- **Dual Pricing Architecture:** Providers choose ₹0 Free distribution or set nominal recovery prices (₹10–₹30) with zero hidden platform fees.
- **Cryptographic OTP Handover:** Plaintext OTPs are never stored; HMAC-SHA256 hashed OTPs verify direct counter pickups and volunteer doorstep drops.
- **FSSAI Food Safety Compliance:** Mandatory hygiene suitability confirmations, temperature holding limits (hot holding $\ge 60^\circ\text{C}$, chilled $\le 5^\circ\text{C}$), and safe collection deadline tracking.
- **Defensible Impact Auditor:** Calculates actual landfill waste avoided (kg) and greenhouse gas mitigation ($\text{CO}_2\text{e}$) strictly from verified handovers—never counting uncollected reservations.
- **In-App Notification Dispatcher:** Real-time event notifications for reservations, volunteer pickups, delivery drops, and expiry alerts.

---

## 4. Architecture Overview

ANNAPATH is built as a **modular monolith** optimized for zero-config Windows execution, lightning-fast automated testing, and clean maintainability.

```text
                             ANNAPATH PLATFORM
                                     │
                ┌────────────────────┼───────────────────┐
                │                    │                   │
           Recipients              Hotels            Volunteers
                │                    │                   │
                └────────────────────┼───────────────────┘
                                     │
                         React 19 + Vite Frontend
                                     │
                             FastAPI (Python 3.12)
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
     Authentication             Core Services              Audit & Logs
    (JWT + PBKDF2)        (Listings, Reservations,       (HMAC-SHA256,
                           Volunteer Tasks, Impact)       Distribution Events)
                                     │
                         SQLAlchemy 2.0 / SQLite
                         (WAL Mode, Check Constraints)
```

---

## 5. Technology Stack

- **Backend:** Python 3.12, FastAPI 0.115+, SQLAlchemy 2.0, Pydantic v2, Pytest, HTTPX, Uvicorn.
- **Frontend:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, Lucide React, Leaflet, Recharts.
- **Database:** SQLite 3 (Write-Ahead Logging enabled, Foreign Keys active) — easily switchable to PostgreSQL via `DATABASE_URL`.
- **Security:** HMAC-SHA256 for OTP hashing, PBKDF2-HMAC-SHA256 for password hashing, HS256 JWT tokens.

---

## 6. Project Directory Structure

```text
90-days-90-projects-day-23-annapath/
├── README.md                  # Project master documentation
├── QUICKSTART.md              # Fast setup instructions
├── DEMO_SCRIPT.md             # 90-second portfolio walkthrough
├── LICENSE                    # MIT Open Source License
├── .gitignore                 # Python & Node exclusion patterns
├── .env.example               # Config template
├── requirements.txt           # Python dependency manifest
├── setup.bat                  # One-click Windows setup
├── run.bat                    # Application launcher
├── test.bat                   # Automated QA test suite runner
├── backend/
│   └── app/
│       ├── main.py            # FastAPI entrypoint & static SPA mount
│       ├── config.py          # Environment settings
│       ├── database.py        # SQLAlchemy engine & SQLite WAL config
│       ├── security.py        # PBKDF2, JWT & HMAC-SHA256 OTP utilities
│       ├── models/            # SQLAlchemy database entities
│       ├── schemas/           # Pydantic v2 request/response models
│       ├── services/          # Business logic (geo, listing, reservation, volunteer, analytics)
│       └── api/v1/            # Versioned REST routers
├── frontend/
│   ├── index.html             # HTML shell with Leaflet styles
│   ├── package.json           # Frontend dependency manifest
│   ├── tsconfig.json          # TypeScript compiler configuration
│   ├── vite.config.ts         # Vite bundler configuration
│   └── src/
│       ├── App.tsx            # Root application orchestrator
│       ├── main.tsx           # React DOM root
│       ├── types/             # TypeScript data contracts
│       ├── api/client.ts      # API fetch client
│       └── components/        # UI components (Discovery, Map, OTP Desk, Dashboards)
├── docs/                      # Technical documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── USER_GUIDE.md
│   ├── DEVELOPMENT_NOTES.md
│   ├── TESTING.md
│   └── TROUBLESHOOTING.md
├── data/
│   └── README.md              # Seed data origin and formulas
├── scripts/
│   └── init_db.py             # Database creation & realistic metro seeding
└── tests/                     # Automated test suite (21 tests)
```

---

## 7. Windows Installation & Setup

### Prerequisites
- **Python:** 3.10, 3.11, or 3.12 installed ([python.org](https://www.python.org))
- **Node.js:** v18+ with `npm` installed ([nodejs.org](https://nodejs.org))

### One-Click Windows Setup
```bat
setup.bat
```
The automated setup script will:
1. Verify Python and Node.js runtimes.
2. Create the project-specific virtual environment in `.venv`.
3. Install pinned Python dependencies.
4. Initialize the SQLite database and seed realistic Indian metro food listings.
5. Compile the React TypeScript production frontend bundle.

### Starting the Application
```bat
run.bat
```
Navigate to:
- **Unified Web Application:** `http://127.0.0.1:8000`
- **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`

---

## 8. Demo Credentials & Personas

Switch personas instantly using the **top switcher bar** or log in manually:

| Persona | Role | Email | Password | Scope |
|---|---|---|---|---|
| **Ravi Shankar** | Recipient | `recipient@annapath.org` | `recipientpassword123` | Reserves meals, views 6-digit collection OTP |
| **Pooja Hegde** | Hotel Owner | `owner@tajwestend.com` | `ownerpassword123` | Publishes surplus thalis, reviews waste metrics |
| **Kiran Kumar** | Hotel Staff | `staff@tajwestend.com` | `staffpassword123` | Verifies recipient OTPs at kitchen counter |
| **Arun Swaminathan** | Volunteer | `volunteer@annapath.org` | `volunteerpassword123` | Accepts deliveries, verifies doorstep OTP |
| **Platform Admin** | Administrator | `admin@annapath.org` | `adminpassword123` | Approves outlets, resolves complaints, audits |

---

## 9. Testing & Quality Assurance

ANNAPATH maintains **100% test pass rates** across unit, integration, and build pipelines:

```bat
test.bat
```

```text
============================= test session starts =============================
platform win32 -- Python 3.12.6, pytest-9.2.0
rootdir: d:\90 days\90-days-90-projects-day-23-annapath
collected 21 items

tests/test_auth.py::test_password_hashing PASSED                         [  4%]
tests/test_auth.py::test_otp_generation_and_hashing PASSED               [  9%]
tests/test_auth.py::test_jwt_token_creation_and_decoding PASSED          [ 14%]
tests/test_auth.py::test_user_registration PASSED                        [ 19%]
tests/test_auth.py::test_duplicate_user_registration_fails PASSED        [ 23%]
tests/test_auth.py::test_user_authentication PASSED                      [ 28%]
tests/test_impact_analytics.py::test_hotel_impact_strict_counting_rule PASSED [ 33%]
tests/test_impact_analytics.py::test_platform_wide_impact_aggregation PASSED [ 38%]
tests/test_impact_analytics.py::test_admin_business_and_volunteer_verification PASSED [ 42%]
tests/test_impact_analytics.py::test_complaint_and_audit_logging PASSED  [ 47%]
tests/test_listings.py::test_create_valid_surplus_listing PASSED         [ 52%]
tests/test_listings.py::test_fssai_declaration_required PASSED           [ 57%]
tests/test_listings.py::test_nominal_pricing_validation PASSED           [ 61%]
tests/test_listings.py::test_discovery_filtering_and_search PASSED       [ 66%]
tests/test_listings.py::test_auto_expire_listings PASSED                 [ 71%]
tests/test_reservations.py::test_atomic_reservation_locking PASSED       [ 76%]
tests/test_reservations.py::test_oversubscription_prevention PASSED      [ 80%]
tests/test_reservations.py::test_direct_pickup_otp_verification PASSED   [ 85%]
tests/test_reservations.py::test_cancellation_restores_inventory PASSED  [ 90%]
tests/test_volunteers.py::test_volunteer_delivery_full_lifecycle PASSED  [ 95%]
tests/test_volunteers.py::test_volunteer_decline_task_without_penalty PASSED [100%]

============================= 21 passed in 1.05s ==============================
[PASS] All 21 backend unit and integration tests passed.
[PASS] Frontend compiled cleanly with zero errors.
```

---

## 10. Security & Privacy Safeguards

- **No Plaintext OTP Storage:** Plaintext OTPs exist only ephemerally in RAM or authenticated user views; the database stores only HMAC-SHA256 digests.
- **Address Confidentiality:** Recipient doorstep addresses are exposed solely to the assigned volunteer upon task acceptance, never in public discovery.
- **Resource Ownership Verification:** All endpoints verify caller roles and business ownership before mutations.
- **Input Sanitization:** All payload models enforce Pydantic v2 schema constraints and boundaries.

---

## 11. Known Limitations

- **Simulated Payment Gateway:** In accordance with the MVP specification, nominal fees (₹10–₹30) are modeled as pay-at-counter rather than through an external payment gateway.
- **Single-Node SQLite WAL:** SQLite Write-Ahead Logging delivers excellent local performance and zero-configuration setups, but distributed deployments require setting `DATABASE_URL` to a managed PostgreSQL cluster.

---

## 12. Future Enhancements

- **WhatsApp Bot Integration:** Automated WhatsApp broadcasts for newly published surplus meals nearby.
- **NGO Bulk Logistics:** Multi-vehicle fleet dispatching for large convention center surplus (>500 meals).
- **Multilingual Support:** Localization into Tamil, Hindi, Telugu, and Kannada.
- **QR Code Scanner:** Hardware camera scanning for instantaneous kitchen counter OTP check-in.

---


## 13. License

Distributed under the **MIT License**. See `LICENSE` for details.
