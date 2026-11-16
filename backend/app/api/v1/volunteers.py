"""Volunteer delivery task operations API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import User, VolunteerProfile, DeliveryTask
from backend.app.schemas.volunteer import DeliveryTaskOut, VolunteerProfileUpdate
from backend.app.schemas.analytics import VolunteerAnalyticsOut
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.volunteer_service import (
    get_available_tasks, accept_delivery_task, decline_delivery_task,
    mark_reached_hotel, mark_picked_up_from_hotel
)
from backend.app.services.analytics_service import get_volunteer_analytics

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


@router.get("/tasks", response_model=List[DeliveryTaskOut])
def list_delivery_tasks(
    current_user: User = Depends(require_roles("volunteer", "admin")),
    db: Session = Depends(get_db),
):
    """Retrieve nearby delivery tasks available for volunteer pickup."""
    return get_available_tasks(db, current_user)


@router.post("/tasks/{task_id}/accept")
def accept_task(
    task_id: str,
    current_user: User = Depends(require_roles("volunteer", "admin")),
    db: Session = Depends(get_db),
):
    """Accept responsibility for a surplus meal delivery run."""
    task = accept_delivery_task(db, task_id, current_user)
    return {"status": "success", "message": "Delivery task accepted.", "task_id": task.id}


@router.post("/tasks/{task_id}/decline")
def decline_task(
    task_id: str,
    current_user: User = Depends(require_roles("volunteer", "admin")),
    db: Session = Depends(get_db),
):
    """Release an accepted task back to other community volunteers without penalty."""
    task = decline_delivery_task(db, task_id, current_user)
    return {"status": "success", "message": "Delivery task declined and released.", "task_id": task.id}


@router.post("/tasks/{task_id}/reached-hotel")
def reached_hotel(
    task_id: str,
    current_user: User = Depends(require_roles("volunteer", "admin")),
    db: Session = Depends(get_db),
):
    """Notify hotel kitchen that volunteer has arrived at pickup counter."""
    task = mark_reached_hotel(db, task_id, current_user)
    return {"status": "success", "message": "Arrived at pickup location.", "task_id": task.id}


@router.post("/tasks/{task_id}/pickup")
def confirm_pickup(
    task_id: str,
    current_user: User = Depends(require_roles("volunteer", "admin")),
    db: Session = Depends(get_db),
):
    """Confirm package handover from hotel and start transit towards recipient."""
    task = mark_picked_up_from_hotel(db, task_id, current_user)
    return {"status": "success", "message": "Packages collected. In transit to recipient.", "task_id": task.id}


@router.get("/me/analytics", response_model=VolunteerAnalyticsOut)
def my_analytics(
    current_user: User = Depends(require_roles("volunteer", "admin")),
    db: Session = Depends(get_db),
):
    """Retrieve personal delivery impact, portions delivered, and estimated distance."""
    return get_volunteer_analytics(db, current_user.id)


@router.patch("/me/profile")
def update_profile(
    data: VolunteerProfileUpdate,
    current_user: User = Depends(require_roles("volunteer", "admin")),
    db: Session = Depends(get_db),
):
    """Update service radius, availability status, or preferred delivery zone."""
    v = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == current_user.id).first()
    if not v:
        v = VolunteerProfile(user_id=current_user.id)
        db.add(v)
    for k, val in data.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(v, k, val)
    db.commit()
    db.refresh(v)
    return {"status": "success", "availability_status": v.availability_status}
