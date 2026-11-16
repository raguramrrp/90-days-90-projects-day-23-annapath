# ANNAPATH — 90-Second Recruiter & Portfolio Demo Script

> **Goal:** Showcase the end-to-end surplus food redistribution journey in under 2 minutes:  
> **Discover → Reserve → Handover OTP Verification → Volunteer Delivery → Strict Impact Audit**

---

### Step 1: Launch Application (0:00 - 0:10)
1. Run `run.bat` or navigate to `http://127.0.0.1:8000`.
2. Notice the top **Demo Persona Switcher bar** featuring all 5 platform roles.
3. The platform starts in the **Recipient** persona (`Ravi Shankar`).

### Step 2: Food Discovery & Interactive Map (0:10 - 0:30)
1. Click **Map View** toggle to see Leaflet pins for partner hotels in Bengaluru and Chennai.
2. Toggle **₹0 Free Only** to view zero-cost community thalis.
3. Click on **South Indian Executive Thali Meals (Surplus)**.
4. Review the **FSSAI Hygiene badge**, 500g portion size, hot-holding temperature (>= 65°C), and safe collection deadline.
5. Click **Reserve Portions**:
   - Select 2 portions.
   - Choose **Direct Pickup**.
   - Click **Confirm Reservation**.

### Step 3: Recipient OTP & Collection Counter (0:30 - 0:50)
1. You are automatically navigated to **My Reservations**.
2. Notice the prominent **6-Digit Collection OTP card** (e.g. `842109`).
3. Now switch persona via the top bar: Click **Hotel Staff** (`Kiran Kumar`).
4. Notice the workspace switches to the **Counter OTP Desk**:
   - Select the reservation for Ravi Shankar.
   - Enter OTP `842109` and click **Verify & Hand Over Package**.
   - Notice the instant confirmation: portion count is officially moved to `quantity_distributed`!

### Step 4: Volunteer Assisted Delivery Flow (0:50 - 1:15)
1. Switch persona via top bar: Click **Volunteer** (`Arun Swaminathan`).
2. View **Available Deliveries**: See the pending drop for Bellandur.
3. Click **Accept Delivery Mission**:
   - Mission card activates with the 3-step live stepper:
   - Click **I Have Reached Hotel**.
   - Click **Confirm Package Handover**.
   - Enter the recipient's delivery OTP (e.g. `754210`) and click **Verify & Complete Drop**.
   - Task completes and volunteer impact stats increment in real time!

### Step 5: Platform Impact & Admin Compliance (1:15 - 1:30)
1. Switch persona via top bar: Click **Admin**.
2. View the **Redistribution Impact Dashboard**:
   - See **Meals Successfully Delivered**, **kg Food Waste Avoided**, and **CO2e Emissions Saved**.
   - Highlight the core product rule: *Uncollected reservations are strictly excluded from food saved metrics*.
3. Click **Audit Logs** to view the immutable ledger of every OTP verification and status transition.
