"""Tests for volunteer task management, location tracking, and OTP handover."""

import pytest
from fastapi import HTTPException

from backend.app.schemas.reservation import ReservationCreate, DeliveryAddressCreate
from backend.app.services.reservation_service import (
    create_reservation, verify_volunteer_delivery
)
from backend.app.services.volunteer_service import (
    get_available_tasks, accept_delivery_task, decline_delivery_task,
    mark_reached_hotel, mark_picked_up_from_hotel
)
from backend.app.models.entities import User, FoodListing, DeliveryTask


def test_volunteer_delivery_full_lifecycle(db):
    """Test full volunteer workflow: task discovery -> accept -> reach hotel -> pickup -> doorstep OTP delivery."""
    recipient = db.query(User).filter(User.role == "recipient").first()
    volunteer = db.query(User).filter(User.role == "volunteer").first()
    listing = (
        db.query(FoodListing)
        .filter(FoodListing.delivery_enabled.is_(True), FoodListing.quantity_available >= 2)
        .first()
    )

    # 1. Recipient creates volunteer delivery booking
    booking = create_reservation(
        db,
        ReservationCreate(
            listing_id=listing.id,
            quantity=2,
            distribution_method="volunteer_delivery",
            delivery_address=DeliveryAddressCreate(
                address_line="Flat 201, Green Glen Layout, Bellandur",
                city="Bengaluru",
                access_instructions="Call upon reaching main gate",
            ),
        ),
        recipient,
    )
    delivery_otp = booking.delivery_otp_plain
    assert delivery_otp is not None
    assert booking.delivery_task is not None
    task_id = booking.delivery_task.id

    # 2. Volunteer views available tasks
    tasks = get_available_tasks(db, volunteer)
    assert any(t.id == task_id for t in tasks)

    # 3. Volunteer accepts task
    accepted_task = accept_delivery_task(db, task_id, volunteer)
    assert accepted_task.delivery_status == "accepted"
    assert accepted_task.volunteer_user_id == volunteer.id

    # 4. Volunteer marks arrived at hotel
    arrived_task = mark_reached_hotel(db, task_id, volunteer)
    assert arrived_task.pickup_status == "reached_hotel"

    # 5. Volunteer picks up package from hotel
    picked_task = mark_picked_up_from_hotel(db, task_id, volunteer)
    assert picked_task.pickup_status == "picked_up"
    assert picked_task.delivery_status == "en_route"
    assert booking.status == "out_for_delivery"

    # 6. Wrong delivery OTP fails
    with pytest.raises(HTTPException) as exc_bad:
        verify_volunteer_delivery(db, booking.id, "999999", volunteer)
    assert exc_bad.value.status_code == 400

    # 7. Correct delivery OTP completes delivery
    completed = verify_volunteer_delivery(db, booking.id, delivery_otp, volunteer)
    assert completed.status == "delivered"
    assert picked_task.delivery_status == "delivered"


def test_volunteer_decline_task_without_penalty(db):
    """Verify volunteer can release task back to pool without penalty."""
    recipient = db.query(User).filter(User.role == "recipient").first()
    volunteer = db.query(User).filter(User.role == "volunteer").first()
    listing = (
        db.query(FoodListing)
        .filter(FoodListing.delivery_enabled.is_(True), FoodListing.quantity_available >= 1)
        .first()
    )

    booking = create_reservation(
        db,
        ReservationCreate(
            listing_id=listing.id,
            quantity=1,
            distribution_method="volunteer_delivery",
            delivery_address=DeliveryAddressCreate(
                address_line="100 Feet Road, Indiranagar",
                city="Bengaluru",
            ),
        ),
        recipient,
    )
    task_id = booking.delivery_task.id

    # Accept
    accept_delivery_task(db, task_id, volunteer)
    # Decline
    declined = decline_delivery_task(db, task_id, volunteer)
    assert declined.delivery_status == "available"
    assert declined.volunteer_user_id is None
