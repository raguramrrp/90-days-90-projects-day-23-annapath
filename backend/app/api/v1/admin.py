"""Admin moderation, complaint handling, and platform analytics API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import Business, User, UserProfile, VolunteerProfile, Complaint, AuditLog
from backend.app.security import hash_password
from backend.app.schemas.admin import (
    VerificationAction, ComplaintCreate, ComplaintUpdate, ComplaintOut, AuditLogOut,
    AdminBusinessCreate, AdminVolunteerCreate
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


@router.post("/businesses", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
def admin_create_business(
    data: AdminBusinessCreate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Admin registers a verified food provider."""
    biz = Business(
        owner_user_id=current_user.id,
        business_name=data.business_name.strip(),
        business_type=data.business_type,
        fssai_license_number=data.fssai_license_number.strip(),
        address=data.address.strip(),
        city=data.city.strip(),
        latitude=12.9716,
        longitude=77.5946,
        contact_phone=data.contact_phone.strip(),
        operating_hours=data.operating_hours.strip(),
        supported_distribution_methods=data.supported_distribution_methods,
        verification_status="verified",
    )
    db.add(biz)
    db.commit()
    db.refresh(biz)
    return biz


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


@router.post("/volunteers", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def admin_create_volunteer(
    data: AdminVolunteerCreate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Admin registers and verifies a community volunteer."""
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    vol = User(
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        phone=data.phone.strip(),
        password_hash=hash_password("volunteer123"),
        role="volunteer",
        account_status="verified",
        phone_verified=True,
    )
    vol.profile = UserProfile(preferred_language="en", city=data.city.strip())
    vol.volunteer_profile = VolunteerProfile(
        verification_status="verified",
        service_radius_km=10.0,
        availability_status="available",
        preferred_service_area=data.preferred_service_area.strip(),
        vehicle_type=data.vehicle_type,
        total_deliveries_completed=0,
    )
    db.add(vol)
    db.commit()
    db.refresh(vol)
    return UserOut(
        id=vol.id,
        full_name=vol.full_name,
        email=vol.email,
        phone=vol.phone,
        role=vol.role,
        account_status=vol.account_status,
        phone_verified=vol.phone_verified,
        city=vol.profile.city,
        preferred_language="en",
        created_at=vol.created_at,
    )


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
