"""Tests for atomic reservation management, inventory locks, and OTP verification."""

import pytest
from fastapi import HTTPException

from backend.app.schemas.reservation import ReservationCreate
from backend.app.services.reservation_service import (
    create_reservation, cancel_reservation, verify_direct_pickup
)
from backend.app.models.entities import User, FoodListing, Reservation


def test_atomic_reservation_locking(db):
    """Verify inventory decreases atomically and cannot go negative."""
    recipient = db.query(User).filter(User.role == "recipient").first()
    listing = (
        db.query(FoodListing)
        .filter(FoodListing.status == "published", FoodListing.quantity_available >= 5)
        .first()
    )
    initial_avail = listing.quantity_available
    initial_res = listing.quantity_reserved

    data = ReservationCreate(
        listing_id=listing.id,
        quantity=3,
        distribution_method="direct_pickup",
    )
    res = create_reservation(db, data, recipient)
    assert res.id is not None
    assert res.quantity == 3
    assert res.status == "confirmed"
    assert res.pickup_otp_plain is not None

    # Check listing inventory updated
    db.refresh(listing)
    assert listing.quantity_available == initial_avail - 3
    assert listing.quantity_reserved == initial_res + 3


def test_oversubscription_prevention(db):
    """Verify system blocks reservation exceeding remaining quantity."""
    recipient = db.query(User).filter(User.role == "recipient").first()
    listing = (
        db.query(FoodListing)
        .filter(FoodListing.status == "published", FoodListing.quantity_available > 0)
        .first()
    )

    # Exceeding available quantity
    excess_qty = listing.quantity_available + 10
    data = ReservationCreate(
        listing_id=listing.id,
        quantity=excess_qty,
        distribution_method="direct_pickup",
    )
    with pytest.raises(HTTPException) as exc:
        create_reservation(db, data, recipient)
    assert exc.value.status_code == 400


def test_direct_pickup_otp_verification(db):
    """Verify counter OTP verification completes pickup and updates distributed portions."""
    recipient = db.query(User).filter(User.role == "recipient").first()
    staff = db.query(User).filter(User.role == "hotel_staff").first()
    listing = (
        db.query(FoodListing)
        .filter(FoodListing.status == "published", FoodListing.quantity_available >= 2)
        .first()
    )
    initial_dist = listing.quantity_distributed

    # 1. Create reservation
    booking = create_reservation(
        db,
        ReservationCreate(
            listing_id=listing.id,
            quantity=2,
            distribution_method="direct_pickup",
        ),
        recipient,
    )
    valid_otp = booking.pickup_otp_plain
    assert valid_otp is not None

    # 2. Wrong OTP fails
    with pytest.raises(HTTPException) as exc_bad:
        verify_direct_pickup(db, booking.id, "000000", staff)
    assert exc_bad.value.status_code == 400
    assert "Invalid collection OTP" in exc_bad.value.detail

    # 3. Valid OTP completes pickup
    verified = verify_direct_pickup(db, booking.id, valid_otp, staff)
    assert verified.status == "collected"
    assert verified.completed_at is not None

    # Verify listing distributed count increased
    db.refresh(listing)
    assert listing.quantity_distributed == initial_dist + 2


def test_cancellation_restores_inventory(db):
    """Verify cancelling an uncollected reservation returns portions to available inventory."""
    recipient = db.query(User).filter(User.role == "recipient").first()
    listing = (
        db.query(FoodListing)
        .filter(FoodListing.status == "published", FoodListing.quantity_available >= 2)
        .first()
    )
    initial_avail = listing.quantity_available

    booking = create_reservation(
        db,
        ReservationCreate(
            listing_id=listing.id,
            quantity=2,
            distribution_method="direct_pickup",
        ),
        recipient,
    )
    db.refresh(listing)
    assert listing.quantity_available == initial_avail - 2

    # Cancel
    cancelled = cancel_reservation(db, booking.id, recipient)
    assert cancelled.status == "cancelled"

    # Inventory must be restored
    db.refresh(listing)
    assert listing.quantity_available == initial_avail
