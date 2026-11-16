"""Atomic reservation and OTP verification workflow service."""

from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.entities import (
    Reservation, FoodListing, Business, User, BusinessStaff,
    DeliveryTask, DeliveryAddress, VolunteerProfile, DistributionEvent
)
from backend.app.schemas.reservation import ReservationCreate
from backend.app.security import generate_otp, hash_otp, verify_otp_hash
from backend.app.services.notification_service import create_notification


def create_reservation(
    db: Session,
    data: ReservationCreate,
    current_user: User,
) -> Reservation:
    """
    Atomically reserve surplus food portions.
    Prevents negative inventory and oversubscription with strict transaction consistency.
    """
    # SQLite / PostgreSQL query
    listing = (
        db.query(FoodListing)
        .filter(FoodListing.id == data.listing_id)
        .with_for_update(nowait=False) if db.bind.dialect.name == "postgresql"
        else db.query(FoodListing).filter(FoodListing.id == data.listing_id)
    ).first()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food listing not found.",
        )

    if listing.status not in ("published", "partially_reserved"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Listing is not available for reservation (current status: {listing.status}).",
        )

    deadline = listing.collection_deadline
    if deadline.tzinfo is not None:
        deadline = deadline.astimezone(timezone.utc).replace(tzinfo=None)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if deadline < now:
        listing.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This food listing has already expired.",
        )

    if data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation quantity must be at least 1 portion.",
        )

    if data.quantity > listing.max_portions_per_recipient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity exceeds maximum limit of {listing.max_portions_per_recipient} portions per recipient.",
        )

    # Check inventory
    if listing.quantity_available < data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {listing.quantity_available} portions available. Cannot fulfill request for {data.quantity}.",
        )

    # Validate distribution method
    if data.distribution_method == "direct_pickup" and not listing.pickup_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direct pickup is not enabled for this listing.",
        )
    if data.distribution_method == "volunteer_delivery" and not listing.delivery_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Volunteer delivery is not available for this listing.",
        )
    if data.distribution_method == "volunteer_delivery" and not data.delivery_address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery address must be provided for volunteer-assisted delivery.",
        )

    # Atomic inventory deduction
    listing.quantity_available -= data.quantity
    listing.quantity_reserved += data.quantity
    if listing.quantity_available == 0:
        listing.status = "fully_reserved"
    else:
        listing.status = "partially_reserved"

    # Pricing snapshot
    price_snapshot = float(listing.price_per_unit)
    total_price = round(price_snapshot * data.quantity, 2)

    # Generate OTPs
    p_otp = generate_otp(6)
    d_otp = generate_otp(6) if data.distribution_method == "volunteer_delivery" else None

    reservation = Reservation(
        listing_id=listing.id,
        recipient_user_id=current_user.id,
        organisation_id=data.organisation_id,
        quantity=data.quantity,
        price_per_unit_snapshot=price_snapshot,
        total_price=total_price,
        distribution_method=data.distribution_method,
        status="confirmed",  # Confirmed for fast flow
        pickup_otp_hash=hash_otp(p_otp),
        pickup_otp_plain=p_otp,
        delivery_otp_hash=hash_otp(d_otp) if d_otp else None,
        delivery_otp_plain=d_otp,
    )
    db.add(reservation)
    db.flush()

    # If volunteer delivery, create address and delivery task
    if data.distribution_method == "volunteer_delivery" and data.delivery_address:
        del_addr = DeliveryAddress(
            reservation_id=reservation.id,
            recipient_user_id=current_user.id,
            address_line=data.delivery_address.address_line,
            city=data.delivery_address.city,
            latitude=data.delivery_address.latitude or listing.business.latitude,
            longitude=data.delivery_address.longitude or listing.business.longitude,
            access_instructions=data.delivery_address.access_instructions,
        )
        db.add(del_addr)

        del_task = DeliveryTask(
            reservation_id=reservation.id,
            pickup_status="pending",
            delivery_status="available",
        )
        db.add(del_task)

    # Record distribution event
    event = DistributionEvent(
        reservation_id=reservation.id,
        event_type="reservation_placed",
        actor_user_id=current_user.id,
        verification_method="system",
    )
    db.add(event)

    # Notify hotel owner
    create_notification(
        db=db,
        user_id=listing.created_by,
        notification_type="new_reservation",
        title=f"New Reservation for {listing.title}",
        message=f"{current_user.full_name} reserved {data.quantity} portions via {data.distribution_method.replace('_', ' ')}.",
    )

    db.commit()
    db.refresh(reservation)
    return reservation


def cancel_reservation(db: Session, reservation_id: str, current_user: User) -> Reservation:
    """Cancel reservation and release reserved inventory back to available."""
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found.")

    if res.recipient_user_id != current_user.id and current_user.role not in ("admin", "hotel_owner"):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this reservation.")

    if res.status in ("collected", "delivered", "cancelled", "expired"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel reservation with status '{res.status}'.",
        )

    listing = db.query(FoodListing).filter(FoodListing.id == res.listing_id).first()
    if listing:
        # Release inventory
        listing.quantity_reserved = max(0, listing.quantity_reserved - res.quantity)
        listing.quantity_available += res.quantity
        if listing.status == "fully_reserved":
            listing.status = "partially_reserved"

    res.status = "cancelled"

    # If volunteer task existed, cancel it
    if res.delivery_task:
        res.delivery_task.delivery_status = "cancelled"

    # Notification
    create_notification(
        db=db,
        user_id=listing.created_by if listing else current_user.id,
        notification_type="reservation_cancelled",
        title="Reservation Cancelled",
        message=f"Reservation #{res.id[:8]} for {res.quantity} portions was cancelled and portions were returned to inventory.",
    )

    db.commit()
    db.refresh(res)
    return res


def verify_direct_pickup(db: Session, reservation_id: str, otp: str, staff_user: User) -> Reservation:
    """
    Verify recipient pickup OTP at hotel counter.
    Marks reservation collected, updates actual redistributed counts, and logs audit event.
    """
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found.")

    if res.status == "collected":
        raise HTTPException(status_code=400, detail="This reservation was already collected.")

    if res.distribution_method != "direct_pickup":
        raise HTTPException(
            status_code=400,
            detail="This reservation is designated for volunteer delivery, not direct pickup.",
        )

    # Verify OTP against stored hash
    if not res.pickup_otp_hash or not verify_otp_hash(otp.strip(), res.pickup_otp_hash):
        raise HTTPException(status_code=400, detail="Invalid collection OTP. Please re-check with recipient.")

    # Mark collected
    now = datetime.now(timezone.utc)
    res.status = "collected"
    res.completed_at = now

    listing = db.query(FoodListing).filter(FoodListing.id == res.listing_id).first()
    if listing:
        listing.quantity_reserved = max(0, listing.quantity_reserved - res.quantity)
        listing.quantity_distributed += res.quantity
        if listing.quantity_available == 0 and listing.quantity_reserved == 0:
            listing.status = "completed"

    # Record handover event
    event = DistributionEvent(
        reservation_id=res.id,
        event_type="pickup_verified",
        actor_user_id=staff_user.id,
        verification_method="otp_direct",
    )
    db.add(event)

    # Notify recipient
    create_notification(
        db=db,
        user_id=res.recipient_user_id,
        notification_type="collection_success",
        title="Food Collected Successfully!",
        message=f"Your pickup of {res.quantity} portions from {listing.business.business_name if listing else 'the provider'} is complete. Thank you for saving food!",
    )

    db.commit()
    db.refresh(res)
    return res


def verify_volunteer_delivery(
    db: Session,
    reservation_id: str,
    otp: str,
    volunteer_user: User,
) -> Reservation:
    """
    Verify recipient delivery OTP provided to volunteer upon handover.
    Marks delivery completed and credits volunteer contribution.
    """
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found.")

    if res.status == "delivered":
        raise HTTPException(status_code=400, detail="This delivery was already completed.")

    task = res.delivery_task
    if not task:
        raise HTTPException(status_code=400, detail="No delivery task associated with this reservation.")

    if task.volunteer_user_id != volunteer_user.id and volunteer_user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not the assigned volunteer for this task.")

    if not res.delivery_otp_hash or not verify_otp_hash(otp.strip(), res.delivery_otp_hash):
        raise HTTPException(status_code=400, detail="Invalid delivery OTP. Please verify with the recipient.")

    now = datetime.now(timezone.utc)
    res.status = "delivered"
    res.completed_at = now

    task.delivery_status = "delivered"
    task.delivered_at = now

    listing = db.query(FoodListing).filter(FoodListing.id == res.listing_id).first()
    if listing:
        listing.quantity_reserved = max(0, listing.quantity_reserved - res.quantity)
        listing.quantity_distributed += res.quantity
        if listing.quantity_available == 0 and listing.quantity_reserved == 0:
            listing.status = "completed"

    # Credit volunteer stats
    v_profile = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == volunteer_user.id).first()
    if v_profile:
        v_profile.total_deliveries_completed += 1

    # Record event
    event = DistributionEvent(
        reservation_id=res.id,
        event_type="delivery_verified",
        actor_user_id=volunteer_user.id,
        verification_method="otp_volunteer",
    )
    db.add(event)

    # Notify recipient & hotel
    create_notification(
        db=db,
        user_id=res.recipient_user_id,
        notification_type="delivery_success",
        title="Food Delivered Successfully!",
        message=f"Volunteer {volunteer_user.full_name} delivered your {res.quantity} portions. Enjoy your meal!",
    )
    if listing:
        create_notification(
            db=db,
            user_id=listing.created_by,
            notification_type="volunteer_delivery_completed",
            title=f"Delivery Completed: {listing.title}",
            message=f"{res.quantity} portions successfully delivered to recipient by volunteer {volunteer_user.full_name}.",
        )

    db.commit()
    db.refresh(res)
    return res
