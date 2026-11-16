# ANNAPATH — Data Origin, Schema & Seeding Specifications

## 1. Overview
ANNAPATH uses realistic synthetic data modeled on actual Indian metro hospitality patterns, municipal boundaries, and FSSAI surplus food redistribution regulations.

The database is powered by SQLite in local development (`annapath.db`) with full transactional integrity, WAL mode, foreign key enforcement, and check constraints to prevent negative inventory.

---

## 2. Seeded Entity Distribution

### A. Partner Food Outlets (Hotels & Bakeries)
1. **The Taj West End Heritage Kitchen** (Race Course Road, Bengaluru)
   - Coordinates: `12.9866° N, 77.5833° E`
   - Business Type: 5-Star Luxury Hotel Banquet
   - FSSAI License: `11223344556677`
   - Redistribution Methods: Direct Pickup + Volunteer Delivery
2. **ITC Grand Chola Banquet & Dining** (Mount Road, Guindy, Chennai)
   - Coordinates: `13.0105° N, 80.2206° E`
   - Business Type: Luxury Hotel & Convention Center
   - FSSAI License: `22334455667788`
   - Redistribution Methods: Both
3. **Lavelle Artisanal Bakehouse** (Lavelle Road, Bengaluru)
   - Coordinates: `12.9719° N, 77.5996° E`
   - Business Type: High-end French Bakery & Patisserie
   - FSSAI License: `11229988776655`
   - Redistribution Methods: Direct Pickup Only

### B. Surplus Food Listing Batches
- **South Indian Executive Thali Meals (Surplus):** 28 portions available, ₹0 Free, hot holding >= 65°C, vegetarian.
- **Artisanal French Baguettes & Sourdough Loaves:** 16 packets available, ₹15 nominal price, ambient storage, vegetarian.
- **Royal Awadhi Chicken Dum Biryani:** 20 portions available, ₹25 nominal price, hot holding cambro, non-vegetarian.
- **Slow-Cooked Dal Makhani & Jeera Rice:** 15 portions available, ₹0 Free, hot holding, vegetarian.

---

## 3. Impact & Measurement Formulas

1. **Food Waste Avoided (kg):**
   $$\text{Food Saved (kg)} = \text{Verified Distributed Portions} \times 0.45\text{ kg}$$
2. **CO2e Emissions Prevented (kg):**
   $$\text{CO2e Avoided (kg)} = \text{Food Saved (kg)} \times 2.5\text{ kg CO2e/kg}$$
   *(Based on United Nations Environment Programme / FAO Food Waste Index benchmarks)*
3. **Strict Audit Verification:**
   Only reservations marked `status='collected'` or `status='delivered'` count towards food redistribution. Pending, expired, or cancelled reservations are strictly excluded.
