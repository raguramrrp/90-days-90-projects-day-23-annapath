"""Admin moderation, complaint handling, and platform analytics API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import Business, User, Complaint, AuditLog
from backend.app.schemas.admin import (
    VerificationAction, ComplaintCreate, ComplaintUpdate, ComplaintOut, AuditLogOut
)
from backend.app.schemas.business import BusinessOut
from backend.app.schemas.auth import UserOut
from backend.app.schemas.analytics import PlatformAnalyticsOut
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.admin_service import (
    verify_business, verify_volunteer, create_complaint, update_complaint
)
from backend.app.services.analytics_service import get_platform_analytics

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/businesses", response_model=List[BusinessOut])
def list_all_businesses(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Admin view of all registered food providers and verification statuses."""
    return db.query(Business).order_by(Business.created_at.desc()).all()


@router.post("/businesses/{business_id}/verify", response_model=BusinessOut)
def moderate_business(
    business_id: str,
    action_data: VerificationAction,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Approve, reject, or suspend a food provider's business verification."""
    return verify_business(db, business_id, action_data.action, current_user)


@router.get("/volunteers", response_model=List[UserOut])
def list_volunteers(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """List registered volunteers awaiting or holding verification."""
    users = db.query(User).filter(User.role == "volunteer").all()
    return [
        UserOut(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            phone=u.phone,
            role=u.role,
            account_status=u.account_status,
            phone_verified=u.phone_verified,
            city=u.profile.city if u.profile else None,
            preferred_language=u.profile.preferred_language if u.profile else "en",
            created_at=u.created_at,
        )
        for u in users
    ]


@router.post("/volunteers/{user_id}/verify", response_model=UserOut)
def moderate_volunteer(
    user_id: str,
    action_data: VerificationAction,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Approve or suspend a community volunteer's operational account."""
    u = verify_volunteer(db, user_id, action_data.action, current_user)
    return UserOut(
        id=u.id,
        full_name=u.full_name,
        email=u.email,
        phone=u.phone,
        role=u.role,
        account_status=u.account_status,
        phone_verified=u.phone_verified,
        city=u.profile.city if u.profile else None,
        preferred_language=u.profile.preferred_language if u.profile else "en",
        created_at=u.created_at,
    )


@router.get("/complaints", response_model=List[ComplaintOut])
def list_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List food safety, packaging, or handover complaints."""
    if current_user.role == "admin":
        complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    else:
        complaints = db.query(Complaint).filter(Complaint.reporter_user_id == current_user.id).all()

    return [
        ComplaintOut(
            id=c.id,
            reporter_user_id=c.reporter_user_id,
            reporter_name=c.reporter.full_name if c.reporter else "Reporter",
            reservation_id=c.reservation_id,
            complaint_type=c.complaint_type,
            description=c.description,
            status=c.status,
            resolution_notes=c.resolution_notes,
            created_at=c.created_at,
        )
        for c in complaints
    ]


@router.post("/complaints", response_model=ComplaintOut)
def file_complaint(
    data: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a complaint or food safety alert regarding a reservation."""
    c = create_complaint(db, data, current_user)
    return ComplaintOut(
        id=c.id,
        reporter_user_id=c.reporter_user_id,
        reporter_name=current_user.full_name,
        reservation_id=c.reservation_id,
        complaint_type=c.complaint_type,
        description=c.description,
        status=c.status,
        resolution_notes=c.resolution_notes,
        created_at=c.created_at,
    )


@router.patch("/complaints/{complaint_id}", response_model=ComplaintOut)
def resolve_complaint(
    complaint_id: str,
    update: ComplaintUpdate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Admin resolves or dismisses a reported food safety issue."""
    c = update_complaint(db, complaint_id, update, current_user)
    return ComplaintOut(
        id=c.id,
        reporter_user_id=c.reporter_user_id,
        reporter_name=c.reporter.full_name if c.reporter else "Reporter",
        reservation_id=c.reservation_id,
        complaint_type=c.complaint_type,
        description=c.description,
        status=c.status,
        resolution_notes=c.resolution_notes,
        created_at=c.created_at,
    )


@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Retrieve immutable audit trail of system operations."""
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()


@router.get("/analytics", response_model=PlatformAnalyticsOut)
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get aggregated platform-wide redistribution impact and efficiency KPIs."""
    return get_platform_analytics(db)
