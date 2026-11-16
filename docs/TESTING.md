# ANNAPATH — Testing & Quality Assurance Report

---

## 1. Test Suite Summary

The project includes an automated test suite implemented with `pytest` covering authentication, surplus food publishing, FSSAI compliance, atomic inventory reservation, OTP verification, volunteer delivery lifecycles, and strict impact calculations.

### Test Execution Command
```bat
test.bat
```
Or manually:
```bash
python -m pytest tests -v
```

---

## 2. Test Execution Results (21/21 Passing)

```text
============================= test session starts =============================
platform win32 -- Python 3.12.6, pytest-9.2.0, pluggy-1.7.0
rootdir: D:\90 days\90-days-90-projects-day-23-annapath
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
```

---

## 3. Frontend Static Typecheck and Build Check

```text
> tsc --noEmit && vite build
✓ 2060 modules transformed.
dist/index.html                   1.58 kB
dist/assets/index-CRH01UTc.css   44.07 kB
dist/assets/index-C6OFvpB0.js   879.33 kB
✓ built in 7.03s
[PASS] Frontend compiled cleanly with zero errors.
```

---

## 4. Test Coverage Analysis

1. **Atomic Inventory & Concurrency:**
   - Tests verify that concurrent requests cannot drive `quantity_available` negative.
   - Tests verify that oversubscription requests (exceeding remaining quantity) are immediately rejected with HTTP 400.
2. **Cryptographic OTP Security:**
   - Tests verify that wrong OTPs are rejected with HTTP 400.
   - Tests verify that valid OTPs mark reservations as `collected` or `delivered` and increment `quantity_distributed`.
3. **FSSAI Compliance:**
   - Tests verify that rejecting the food hygiene declaration raises a validation error.
   - Tests verify that past-deadline listings are delisted automatically.
4. **Strict Impact Calculation:**
   - Verifies that uncollected portions are strictly excluded from food saved and carbon emission avoided totals.
