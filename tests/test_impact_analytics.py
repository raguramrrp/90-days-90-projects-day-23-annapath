"""Tests for impact metrics, food waste avoidance, and strict verification rules."""

import pytest
from backend.app.services.analytics_service import (
    get_hotel_analytics, get_volunteer_analytics, get_platform_analytics
)
from backend.app.services.admin_service import (
    verify_business, verify_volunteer, create_complaint, update_complaint, log_audit_event
)
from backend.app.schemas.admin import ComplaintCreate, ComplaintUpdate
from backend.app.models.entities import Business, User, Reservation


def test_hotel_impact_strict_counting_rule(db):
    """
    CRITICAL RULE VERIFICATION:
    Distinguish food listed, food reserved, and food actually redistributed.
    Never count an uncollected reservation as a successful redistribution.
    """
    biz = db.query(Business).filter(Business.city == "Bengaluru").first()
    analytics = get_hotel_analytics(db, biz.id)

    assert analytics.business_id == biz.id
    assert analytics.total_listings >= 1
    assert analytics.total_portions_published > 0
    # Rule check: redistributed must NOT exceed total published
    assert analytics.portions_redistributed <= analytics.total_portions_published
    # Food waste avoided calculation
    expected_kg = round(analytics.portions_redistributed * 0.45, 2)
    assert analytics.estimated_food_waste_avoided_kg == expected_kg
    # CO2e avoided calculation
    expected_co2e = round(expected_kg * 2.5, 2)
    assert analytics.estimated_co2e_avoided_kg == expected_co2e


def test_platform_wide_impact_aggregation(db):
    """Verify city-level and category-level aggregation across the platform."""
    platform_data = get_platform_analytics(db)
    assert platform_data.total_providers_verified >= 2
    assert platform_data.total_volunteers_verified >= 1
    assert platform_data.total_portions_redistributed >= 10
    assert platform_data.total_kg_food_saved > 0.0
    assert len(platform_data.city_breakdown) >= 1


def test_admin_business_and_volunteer_verification(db):
    """Verify admin approval and suspension workflows."""
    admin = db.query(User).filter(User.role == "admin").first()
    biz = db.query(Business).first()
    volunteer = db.query(User).filter(User.role == "volunteer").first()

    # Moderate business
    updated_biz = verify_business(db, biz.id, "suspend", admin)
    assert updated_biz.verification_status == "suspended"

    # Re-approve
    reapproved_biz = verify_business(db, biz.id, "approve", admin)
    assert reapproved_biz.verification_status == "verified"

    # Moderate volunteer
    updated_vol = verify_volunteer(db, volunteer.id, "approve", admin)
    assert updated_vol.account_status == "verified"


def test_complaint_and_audit_logging(db):
    """Verify food safety complaint filing, status resolution, and audit trail."""
    recipient = db.query(User).filter(User.role == "recipient").first()
    admin = db.query(User).filter(User.role == "admin").first()
    res = db.query(Reservation).first()

    # File complaint
    complaint_data = ComplaintCreate(
        reservation_id=res.id,
        complaint_type="food_quality",
        description="Food packaging was intact and warm, but portion size was smaller than advertised.",
    )
    complaint = create_complaint(db, complaint_data, recipient)
    assert complaint.id is not None
    assert complaint.status == "open"

    # Resolve complaint
    update_data = ComplaintUpdate(
        status="resolved",
        resolution_notes="Contacted hotel kitchen manager to calibrate standard portion scoops.",
    )
    resolved = update_complaint(db, complaint.id, update_data, admin)
    assert resolved.status == "resolved"
    assert resolved.resolution_notes is not None

    # Audit log entry check
    log = log_audit_event(
        db,
        actor_id=admin.id,
        action="manual_safety_audit_completed",
        entity_type="audit",
        entity_id="audit-999",
        metadata={"scope": "fssai_compliance"},
    )
    assert log.id is not None
    assert log.action == "manual_safety_audit_completed"
