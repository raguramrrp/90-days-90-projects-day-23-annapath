"""Volunteer task management service."""

from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.entities import (
    DeliveryTask, Reservation, FoodListing, Business, User,
    VolunteerProfile, DeliveryAddress, DistributionEvent
)
from backend.app.schemas.volunteer import DeliveryTaskOut, VolunteerProfileUpdate
from backend.app.services.geo import haversine_distance
from backend.app.services.notification_service import create_notification


def get_available_tasks(
    db: Session,
    volunteer_user: User,
    city: Optional[str] = None,
) -> List[DeliveryTaskOut]:
    """Retrieve tasks available for volunteers to accept."""
    v_profile = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == volunteer_user.id).first()
    max_radius = v_profile.service_radius_km if v_profile else 15.0

    query = (
        db.query(DeliveryTask)
        .join(Reservation, DeliveryTask.reservation_id == Reservation.id)
        .join(FoodListing, Reservation.listing_id == FoodListing.id)
        .join(Business, FoodListing.business_id == Business.id)
        .filter(
            DeliveryTask.delivery_status.in_(["available", "accepted"]),
        )
    )

    # If already accepted by this volunteer, show it as their active task
    # If available, anyone can accept
    tasks = query.all()
    results: List[DeliveryTaskOut] = []

    for t in tasks:
        # Don't show other volunteers' accepted tasks
        if t.delivery_status == "accepted" and t.volunteer_user_id != volunteer_user.id:
            continue

        res = t.reservation
        listing = res.listing
        biz = listing.business
        del_addr = res.delivery_address
        recipient = res.recipient

        out = DeliveryTaskOut(
            id=t.id,
            reservation_id=res.id,
            volunteer_user_id=t.volunteer_user_id,
            pickup_status=t.pickup_status,
            delivery_status=t.delivery_status,
            assigned_at=t.assigned_at,
            picked_up_at=t.picked_up_at,
            delivered_at=t.delivered_at,
            failure_reason=t.failure_reason,
            food_title=listing.title,
            quantity=res.quantity,
            pickup_business_name=biz.business_name,
            pickup_address=biz.address,
            pickup_latitude=biz.latitude,
            pickup_longitude=biz.longitude,
            delivery_address=del_addr.address_line if del_addr else "Standard City Delivery",
            delivery_city=del_addr.city if del_addr else biz.city,
            recipient_name=recipient.full_name,
            recipient_phone=recipient.phone,
            access_instructions=del_addr.access_instructions if del_addr else None,
        )
        results.append(out)

    return results


def accept_delivery_task(db: Session, task_id: str, volunteer_user: User) -> DeliveryTask:
    """Assign an available delivery task to the volunteer."""
    task = db.query(DeliveryTask).filter(DeliveryTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Delivery task not found.")

    if task.delivery_status != "available":
        raise HTTPException(
            status_code=400,
            detail=f"Task is already {task.delivery_status} and cannot be accepted.",
        )

    task.volunteer_user_id = volunteer_user.id
    task.delivery_status = "accepted"
    task.assigned_at = datetime.now(timezone.utc)

    # Notify recipient and hotel
    res = task.reservation
    create_notification(
        db=db,
        user_id=res.recipient_user_id,
        notification_type="volunteer_assigned",
        title="Volunteer Assigned for Delivery",
        message=f"{volunteer_user.full_name} accepted the delivery of your {res.quantity} portions.",
    )

    db.commit()
    db.refresh(task)
    return task


def decline_delivery_task(db: Session, task_id: str, volunteer_user: User) -> DeliveryTask:
    """Release an accepted task back to available pool with zero penalty."""
    task = db.query(DeliveryTask).filter(DeliveryTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Delivery task not found.")

    if task.volunteer_user_id != volunteer_user.id and volunteer_user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not assigned to this task.")

    if task.pickup_status == "picked_up":
        raise HTTPException(status_code=400, detail="Food has already been picked up. Cannot decline at this stage.")

    task.volunteer_user_id = None
    task.delivery_status = "available"
    task.assigned_at = None

    db.commit()
    db.refresh(task)
    return task


def mark_reached_hotel(db: Session, task_id: str, volunteer_user: User) -> DeliveryTask:
    """Volunteer updates status indicating arrival at hotel pickup desk."""
    task = db.query(DeliveryTask).filter(DeliveryTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Delivery task not found.")

    if task.volunteer_user_id != volunteer_user.id and volunteer_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")

    task.pickup_status = "reached_hotel"
    db.commit()
    db.refresh(task)
    return task


def mark_picked_up_from_hotel(db: Session, task_id: str, volunteer_user: User) -> DeliveryTask:
    """Volunteer confirms packages have been handed over from hotel kitchen."""
    task = db.query(DeliveryTask).filter(DeliveryTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Delivery task not found.")

    if task.volunteer_user_id != volunteer_user.id and volunteer_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")

    task.pickup_status = "picked_up"
    task.delivery_status = "en_route"
    task.picked_up_at = datetime.now(timezone.utc)

    # Update reservation status to out_for_delivery
    task.reservation.status = "out_for_delivery"

    # Notify recipient
    create_notification(
        db=db,
        user_id=task.reservation.recipient_user_id,
        notification_type="food_en_route",
        title="Food is on the way!",
        message=f"Volunteer {volunteer_user.full_name} has picked up your package and is heading to your address.",
    )

    db.commit()
    db.refresh(task)
    return task
