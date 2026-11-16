"""Admin service for account verification, moderation, complaints, and audit logging."""

import json
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.entities import (
    User, Business, VolunteerProfile, Organisation, Complaint, AuditLog
)
from backend.app.schemas.admin import ComplaintCreate, ComplaintUpdate, ComplaintOut, AuditLogOut
from backend.app.services.notification_service import create_notification


def log_audit_event(
    db: Session,
    actor_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: str,
    metadata: Optional[dict] = None,
) -> AuditLog:
    """Record an immutable audit log entry for sensitive operations."""
    entry = AuditLog(
        actor_user_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def verify_business(db: Session, business_id: str, action: str, admin_user: User) -> Business:
    """Approve or reject a business registration application."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")

    status_map = {
        "approve": "verified",
        "reject": "rejected",
        "suspend": "suspended",
    }
    if action not in status_map:
        raise HTTPException(status_code=400, detail="Action must be approve, reject, or suspend.")

    biz.verification_status = status_map[action]
    log_audit_event(
        db=db,
        actor_id=admin_user.id,
        action=f"business_{action}",
        entity_type="business",
        entity_id=biz.id,
        metadata={"new_status": biz.verification_status},
    )

    create_notification(
        db=db,
        user_id=biz.owner_user_id,
        notification_type="verification_update",
        title=f"Business Verification {action.capitalize()}d",
        message=f"Your business '{biz.business_name}' status is now {biz.verification_status}.",
    )

    db.commit()
    db.refresh(biz)
    return biz


def verify_volunteer(db: Session, user_id: str, action: str, admin_user: User) -> User:
    """Approve, reject, or suspend a volunteer account."""
    user = db.query(User).filter(User.id == user_id, User.role == "volunteer").first()
    if not user:
        raise HTTPException(status_code=404, detail="Volunteer user not found.")

    status_map = {
        "approve": "verified",
        "reject": "rejected",
        "suspend": "suspended",
    }
    if action not in status_map:
        raise HTTPException(status_code=400, detail="Invalid verification action.")

    user.account_status = status_map[action]
    if user.volunteer_profile:
        user.volunteer_profile.verification_status = status_map[action]

    log_audit_event(
        db=db,
        actor_id=admin_user.id,
        action=f"volunteer_{action}",
        entity_type="volunteer",
        entity_id=user.id,
        metadata={"new_status": user.account_status},
    )

    create_notification(
        db=db,
        user_id=user.id,
        notification_type="verification_update",
        title=f"Volunteer Profile {action.capitalize()}d",
        message=f"Your volunteer verification status has been updated to {user.account_status}.",
    )

    db.commit()
    db.refresh(user)
    return user


def create_complaint(db: Session, data: ComplaintCreate, reporter: User) -> Complaint:
    """Submit a food safety or service complaint."""
    complaint = Complaint(
        reporter_user_id=reporter.id,
        reservation_id=data.reservation_id,
        complaint_type=data.complaint_type,
        description=data.description.strip(),
        status="open",
    )
    db.add(complaint)
    db.flush()

    log_audit_event(
        db=db,
        actor_id=reporter.id,
        action="complaint_filed",
        entity_type="complaint",
        entity_id=complaint.id,
        metadata={"type": data.complaint_type},
    )

    db.commit()
    db.refresh(complaint)
    return complaint


def update_complaint(db: Session, complaint_id: str, update: ComplaintUpdate, admin_user: User) -> Complaint:
    """Admin updates complaint status and records resolution notes."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    complaint.status = update.status
    if update.resolution_notes:
        complaint.resolution_notes = update.resolution_notes

    log_audit_event(
        db=db,
        actor_id=admin_user.id,
        action="complaint_resolved",
        entity_type="complaint",
        entity_id=complaint.id,
        metadata={"status": update.status, "notes": update.resolution_notes},
    )

    db.commit()
    db.refresh(complaint)
    return complaint
