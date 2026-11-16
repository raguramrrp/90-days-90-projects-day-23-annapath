# ANNAPATH — System Architecture & Technical Design

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Single Page Application)"]
        UI["React 19 + TypeScript + Vite"]
        TW["Tailwind CSS + Lucide Icons"]
        MAP["Leaflet + OpenStreetMap Engine"]
        RC["Recharts Analytics Visualizer"]
    end

    subgraph APILayer ["FastAPI Application Server"]
        ROUTER["API Router (/api/v1)"]
        AUTH["Auth & JWT Service"]
        LISTING["Surplus Listing Service"]
        RESERVE["Atomic Reservation Engine"]
        VOLUNTEER["Volunteer Task Coordinator"]
        ANALYTICS["Impact & Carbon Auditor"]
        NOTIF["Notification Dispatcher"]
    end

    subgraph DataLayer ["Data & Storage Layer"]
        DB[(SQLite / PostgreSQL Engine)]
        AUDIT[(Immutable Audit Trail)]
    end

    UI -->|REST / JSON| ROUTER
    ROUTER --> AUTH
    ROUTER --> LISTING
    ROUTER --> RESERVE
    ROUTER --> VOLUNTEER
    ROUTER --> ANALYTICS
    ROUTER --> NOTIF

    AUTH --> DB
    LISTING --> DB
    RESERVE --> DB
    RESERVE --> AUDIT
    VOLUNTEER --> DB
    ANALYTICS --> DB
```

---

## 2. End-to-End Operational Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Hotel as Hotel Staff
    actor Recipient as Recipient User
    actor Volunteer as Volunteer Courier
    participant Sys as ANNAPATH Backend
    participant DB as Database Engine

    Hotel->>Sys: POST /api/v1/food-listings (Confirm FSSAI declaration, portions, deadline)
    Sys->>DB: INSERT into food_listings (status=published)
    Recipient->>Sys: GET /api/v1/food-listings (Geo-filtered nearby feed)
    Recipient->>Sys: POST /api/v1/reservations (quantity=2, method=volunteer_delivery)
    Sys->>DB: Atomic check & decrement quantity_available, generate OTPs
    Sys-->>Recipient: Reservation confirmed with Delivery OTP (e.g. 754210)
    Sys->>Volunteer: Broadcast delivery mission to nearby volunteers
    Volunteer->>Sys: POST /volunteers/tasks/{id}/accept
    Volunteer->>Sys: POST /volunteers/tasks/{id}/reached-hotel
    Volunteer->>Sys: POST /volunteers/tasks/{id}/pickup (Packages collected)
    Volunteer->>Recipient: Arrives at delivery address
    Recipient->>Volunteer: Provides Delivery OTP (754210)
    Volunteer->>Sys: POST /reservations/{id}/verify-delivery (OTP=754210)
    Sys->>DB: Verify HMAC hash, mark reservation delivered, increment quantity_distributed
    Sys-->>Hotel: In-app Notification: 2 portions successfully delivered!
```

---

## 3. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ UserProfile : has
    User ||--o{ Business : owns
    User ||--o{ BusinessStaff : assigned
    User ||--o{ VolunteerProfile : has
    User ||--o{ Reservation : places
    User ||--o{ DeliveryTask : delivers
    User ||--o{ Notification : receives
    User ||--o{ Complaint : reports

    Business ||--o{ BusinessStaff : employs
    Business ||--o{ FoodListing : publishes

    FoodListing ||--o{ Reservation : contains
    Reservation ||--o| DeliveryTask : creates
    Reservation ||--o| DeliveryAddress : has
    Reservation ||--o{ Complaint : receives
    Reservation ||--o{ DistributionEvent : logs
```

---

## 4. Key Architectural Patterns

1. **Atomic Inventory Protection:**
   Inventory decrement is executed within a database transaction with SQLite WAL mode / row-level locks, ensuring `quantity_available` never drops below zero even during simultaneous reservation clicks.
2. **Cryptographic OTP Hashing:**
   Plaintext OTPs are never stored in the database. Instead, HMAC-SHA256 digests (`pickup_otp_hash` and `delivery_otp_hash`) are persisted, making database inspection immune to credential harvesting.
3. **Unified Single-Port Deployment:**
   FastAPI mounts the compiled static assets (`frontend/dist`) at runtime, serving both the RESTful API endpoints, Swagger UI documentation, and the full React Single Page Application on a single host and port (`http://127.0.0.1:8000`).
