"""Reservation and verification API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import Reservation, FoodListing, User
from backend.app.schemas.reservation import (
    ReservationCreate, ReservationOut, PickupOTPVerify, DeliveryOTPVerify
)
from backend.app.services.auth_service import get_current_user
from backend.app.services.reservation_service import (
    create_reservation, cancel_reservation, verify_direct_pickup, verify_volunteer_delivery
)

router = APIRouter(prefix="/reservations", tags=["Reservations"])


def _format_reservation(res: Reservation) -> ReservationOut:
    listing = res.listing
    biz = listing.business if listing else None
    return ReservationOut(
        id=res.id,
        listing_id=res.listing_id,
        recipient_user_id=res.recipient_user_id,
        recipient_name=res.recipient.full_name if res.recipient else "Recipient",
        recipient_phone=res.recipient.phone if res.recipient else None,
        organisation_id=res.organisation_id,
        listing_title=listing.title if listing else "Surplus Food",
        business_name=biz.business_name if biz else "Food Provider",
        business_address=biz.address if biz else None,
        quantity=res.quantity,
        price_per_unit_snapshot=res.price_per_unit_snapshot,
        total_price=res.total_price,
        distribution_method=res.distribution_method,
        status=res.status,
        pickup_otp_plain=res.pickup_otp_plain,
        delivery_otp_plain=res.delivery_otp_plain,
        created_at=res.created_at,
        completed_at=res.completed_at,
    )


@router.post("/", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def make_reservation(
    data: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Reserve surplus food portions atomically.
    Ensures quantities cannot go below zero and locks portions securely.
    """
    res = create_reservation(db, data, current_user)
    return _format_reservation(res)


@router.get("/me", response_model=List[ReservationOut])
def get_my_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve reservations relevant to current user role."""
    if current_user.role in ("hotel_owner", "hotel_staff"):
        # Reservations for current user's business listings
        biz_ids = [b.id for b in current_user.owned_businesses]
        items = (
            db.query(Reservation)
            .join(FoodListing, Reservation.listing_id == FoodListing.id)
            .filter(FoodListing.business_id.in_(biz_ids))
            .order_by(Reservation.created_at.desc())
            .all()
        )
    elif current_user.role == "admin":
        items = db.query(Reservation).order_by(Reservation.created_at.desc()).all()
    else:
        # Recipient's own reservations
        items = (
            db.query(Reservation)
            .filter(Reservation.recipient_user_id == current_user.id)
            .order_by(Reservation.created_at.desc())
            .all()
        )
    return [_format_reservation(r) for r in items]


@router.get("/{reservation_id}", response_model=ReservationOut)
def get_reservation(
    reservation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single reservation status and OTP details."""
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found.")
    return _format_reservation(res)


@router.post("/{reservation_id}/cancel", response_model=ReservationOut)
def cancel(
    reservation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel reservation and release inventory portions."""
    res = cancel_reservation(db, reservation_id, current_user)
    return _format_reservation(res)


@router.post("/{reservation_id}/verify-pickup", response_model=ReservationOut)
def verify_pickup(
    reservation_id: str,
    req: PickupOTPVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Hotel staff verifies recipient OTP at collection counter.
    Completes direct pickup and updates official redistribution count.
    """
    res = verify_direct_pickup(db, reservation_id, req.otp, current_user)
    return _format_reservation(res)


@router.post("/{reservation_id}/verify-delivery", response_model=ReservationOut)
def verify_delivery(
    reservation_id: str,
    req: DeliveryOTPVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Volunteer submits recipient OTP upon doorstep delivery.
    Completes volunteer task and records verified redistribution.
    """
    res = verify_volunteer_delivery(db, reservation_id, req.otp, current_user)
    return _format_reservation(res)
