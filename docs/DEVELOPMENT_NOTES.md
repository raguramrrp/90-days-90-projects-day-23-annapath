# ANNAPATH — Development Notes & Implementation Decisions

---

## 1. Design Decisions & Assumptions

### A. Database Concurrency & Portability
- **Decision:** Use SQLAlchemy 2.0 with SQLite in WAL (Write-Ahead Logging) mode and foreign key pragmas enabled.
- **Why:** Zero external service requirements on Windows (no PostgreSQL installation or password prompts for evaluators), while maintaining atomic ACID transaction locks. For production, simply change `DATABASE_URL` in `.env` to `postgresql://...`.

### B. Two-Tier OTP Cryptography
- **Decision:** Compute an HMAC-SHA256 digest with the server secret key before writing OTPs to the database.
- **Why:** Prevents rogue database administrators or read-only database replicas from viewing active collection codes. In the development UI, the authorized user can view their plain OTP via their authenticated endpoint.

### C. Zero Penalty Volunteer Architecture
- **Decision:** Volunteers can decline or unassign themselves from tasks before pickup with zero score degradation.
- **Why:** Community volunteers are altruistic actors, not gig-economy contractors bound by commercial acceptance rate algorithms. Tasks are seamlessly released back to the general community pool.

### D. Single-Port Unified Production Architecture
- **Decision:** FastAPI serves the React production bundle (`frontend/dist`) with fallback routing.
- **Why:** Eliminates CORS headaches, double process management, and port collisions on Windows developer machines.

---

## 2. Food Safety Framework Alignment (FSSAI)
1. **Suitable Surplus Declaration:** Providers must explicitly certify that food was prepared under hygienic conditions and kept at safe holding temperatures.
2. **Temperature Bounds:**
   - Hot food: Continuous holding at $\ge 60^\circ\text{C}$
   - Chilled food: Maintained at $\le 5^\circ\text{C}$
3. **Automatic Expiry Invalidation:** Listings with expired collection deadlines are automatically transitioned to `expired` status and hidden from public discovery.

---

## 3. Technology Choices

| Component | Choice | Reason |
|---|---|---|
| **Backend Framework** | FastAPI (Python 3.12) | High performance, automatic OpenAPI documentation, async support |
| **ORM** | SQLAlchemy 2.0 | Type-safe query building, transaction management, migration-ready |
| **Frontend Framework** | React 19 + TypeScript | Component modularity, rich ecosystem, strict type safety |
| **Build Tool** | Vite 6 | Sub-second hot module reload and fast compilation |
| **Styling** | Tailwind CSS 4 | Modern utility-first styling with zero CSS bloat |
| **Mapping Engine** | Leaflet + OpenStreetMap | Free, open-source, no paid API keys required |
| **Analytics Charts** | Recharts | Composable SVG charts for responsive data visualization |
