"""Tests for food listing lifecycle, FSSAI compliance, and spatial discovery."""

from datetime import datetime, timezone, timedelta
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from backend.app.schemas.listing import FoodListingCreate
from backend.app.services.listing_service import (
    create_listing, get_available_listings, auto_expire_listings
)
from backend.app.models.entities import Business, User, FoodListing


def test_create_valid_surplus_listing(db):
    """Test creating a valid surplus food listing with FSSAI declaration."""
    owner = db.query(User).filter(User.role == "hotel_owner").first()
    biz = db.query(Business).filter(Business.owner_user_id == owner.id).first()

    now = datetime.now(timezone.utc)
    data = FoodListingCreate(
        business_id=biz.id,
        title="Hyderabadi Veg Biryani (Surplus Lunch)",
        description="Aromatic basmati rice cooked with fresh seasonal vegetables and saffron.",
        category="meals",
        food_type="vegetarian",
        quantity_available=20,
        portion_size="1 Portion (~500g)",
        unit="portions",
        price_type="free",
        price_per_unit=0.0,
        preparation_time=now - timedelta(hours=1),
        collection_start=now,
        collection_deadline=now + timedelta(hours=3),
        storage_conditions="hot_holding",
        allergen_information="Dairy (Ghee)",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=4,
    )
    listing = create_listing(db, data, owner)
    assert listing.id is not None
    assert listing.title == "Hyderabadi Veg Biryani (Surplus Lunch)"
    assert listing.quantity_available == 20
    assert listing.status == "published"


def test_fssai_declaration_required():
    """Verify listing creation fails if provider rejects food safety declaration."""
    now = datetime.now(timezone.utc)
    with pytest.raises(ValidationError):
        FoodListingCreate(
            business_id="biz-123",
            title="Unsafe Leftover Food",
            description="Food with no declaration",
            category="meals",
            food_type="vegetarian",
            quantity_available=10,
            price_type="free",
            price_per_unit=0.0,
            preparation_time=now - timedelta(hours=1),
            collection_start=now,
            collection_deadline=now + timedelta(hours=2),
            fssai_safety_declaration=False,  # REJECTED
        )


def test_nominal_pricing_validation():
    """Verify nominal price listing cannot have zero or negative price."""
    now = datetime.now(timezone.utc)
    with pytest.raises(ValidationError):
        FoodListingCreate(
            business_id="biz-123",
            title="Nominal Food with zero price",
            description="Invalid pricing specification",
            category="meals",
            food_type="vegetarian",
            quantity_available=10,
            price_type="nominal",
            price_per_unit=0.0,  # Fails: nominal must be > 0
            preparation_time=now - timedelta(hours=1),
            collection_start=now,
            collection_deadline=now + timedelta(hours=2),
            fssai_safety_declaration=True,
        )


def test_discovery_filtering_and_search(db):
    """Test public discovery search and category filters."""
    # Search
    results = get_available_listings(db, search="Thali")
    assert len(results) >= 1
    assert any("Thali" in r.title for r in results)

    # Vegetarian filter
    veg_results = get_available_listings(db, food_type="vegetarian")
    for r in veg_results:
        assert r.food_type == "vegetarian"

    # Distance calculation
    # Test near Bangalore coordinates (12.9716, 77.5946)
    geo_results = get_available_listings(db, user_lat=12.9716, user_lon=77.5946)
    assert len(geo_results) >= 1
    # Must have computed distance
    assert geo_results[0].distance_km is not None
    assert geo_results[0].distance_km >= 0.0


def test_auto_expire_listings(db):
    """Verify listings with past collection deadlines are marked expired."""
    owner = db.query(User).filter(User.role == "hotel_owner").first()
    biz = db.query(Business).filter(Business.owner_user_id == owner.id).first()

    now = datetime.now(timezone.utc)
    # Create past-deadline listing
    stale = FoodListing(
        business_id=biz.id,
        created_by=owner.id,
        title="Stale Past Buffet",
        description="Expired buffet items",
        category="meals",
        food_type="vegetarian",
        quantity_available=5,
        price_type="free",
        price_per_unit=0.0,
        preparation_time=now - timedelta(hours=5),
        collection_start=now - timedelta(hours=4),
        collection_deadline=now - timedelta(minutes=10),  # In the past
        status="published",
    )
    db.add(stale)
    db.commit()

    expired_count = auto_expire_listings(db)
    assert expired_count >= 1

    refreshed = db.query(FoodListing).filter(FoodListing.id == stale.id).first()
    assert refreshed.status == "expired"
