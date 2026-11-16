"""Business & food provider API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import Business, BusinessStaff, User
from backend.app.schemas.business import BusinessCreate, BusinessUpdate, BusinessOut, BusinessStaffCreate, BusinessStaffOut
from backend.app.schemas.analytics import HotelAnalyticsOut
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.analytics_service import get_hotel_analytics

router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.post("/", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
def register_business(
    data: BusinessCreate,
    current_user: User = Depends(require_roles("hotel_owner", "admin")),
    db: Session = Depends(get_db),
):
    """Register a new hotel, restaurant, or food provider outlet."""
    biz = Business(
        owner_user_id=current_user.id,
        business_name=data.business_name.strip(),
        business_type=data.business_type,
        fssai_license_number=data.fssai_license_number,
        registration_number=data.registration_number,
        address=data.address.strip(),
        city=data.city.strip(),
        latitude=data.latitude,
        longitude=data.longitude,
        contact_phone=data.contact_phone.strip(),
        operating_hours=data.operating_hours or "08:00 AM - 11:00 PM",
        food_prep_storage_info=data.food_prep_storage_info,
        supported_distribution_methods=data.supported_distribution_methods or "both",
        verification_status="verified",  # auto-verified in dev/eval mode
    )
    db.add(biz)
    db.commit()
    db.refresh(biz)
    return biz


@router.get("/me", response_model=List[BusinessOut])
def get_my_businesses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all business outlets owned by or staffed by current user."""
    if current_user.role == "admin":
        return db.query(Business).all()
    # Owned businesses
    owned = db.query(Business).filter(Business.owner_user_id == current_user.id).all()
    # Staffed businesses
    staff_records = db.query(BusinessStaff).filter(BusinessStaff.user_id == current_user.id, BusinessStaff.status == "active").all()
    staff_biz_ids = [s.business_id for s in staff_records]
    staffed = db.query(Business).filter(Business.id.in_(staff_biz_ids)).all()
    return list({b.id: b for b in (owned + staffed)}.values())


@router.get("/{business_id}", response_model=BusinessOut)
def get_business(business_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed public profile for a business outlet."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business outlet not found.")
    return biz


@router.patch("/{business_id}", response_model=BusinessOut)
def update_business(
    business_id: str,
    update: BusinessUpdate,
    current_user: User = Depends(require_roles("hotel_owner", "admin")),
    db: Session = Depends(get_db),
):
    """Update outlet operating hours, contacts, or FSSAI registration details."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business outlet not found.")
    if biz.owner_user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this business.")

    for k, v in update.model_dump(exclude_unset=True).items():
        setattr(biz, k, v)
    db.commit()
    db.refresh(biz)
    return biz


@router.post("/{business_id}/staff", response_model=BusinessStaffOut)
def add_business_staff(
    business_id: str,
    data: BusinessStaffCreate,
    current_user: User = Depends(require_roles("hotel_owner", "admin")),
    db: Session = Depends(get_db),
):
    """Invite an employee as counter staff or manager."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
    if biz.owner_user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the business owner can invite staff.")

    target_user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"No user found with email '{data.email}'. Please ask them to register first.")

    existing = db.query(BusinessStaff).filter(BusinessStaff.business_id == business_id, BusinessStaff.user_id == target_user.id).first()
    if existing:
        existing.permission_level = data.permission_level
        existing.status = "active"
        db.commit()
        db.refresh(existing)
        return BusinessStaffOut(
            id=existing.id,
            business_id=biz.id,
            user_id=target_user.id,
            full_name=target_user.full_name,
            email=target_user.email,
            permission_level=existing.permission_level,
            status=existing.status,
            invited_at=existing.invited_at,
        )

    staff = BusinessStaff(
        business_id=biz.id,
        user_id=target_user.id,
        permission_level=data.permission_level,
        status="active",
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return BusinessStaffOut(
        id=staff.id,
        business_id=biz.id,
        user_id=target_user.id,
        full_name=target_user.full_name,
        email=target_user.email,
        permission_level=staff.permission_level,
        status=staff.status,
        invited_at=staff.invited_at,
    )


@router.get("/{business_id}/staff", response_model=List[BusinessStaffOut])
def list_business_staff(
    business_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List staff members associated with this outlet."""
    records = db.query(BusinessStaff).filter(BusinessStaff.business_id == business_id).all()
    results = []
    for r in records:
        u = r.user
        results.append(
            BusinessStaffOut(
                id=r.id,
                business_id=r.business_id,
                user_id=r.user_id,
                full_name=u.full_name,
                email=u.email,
                permission_level=r.permission_level,
                status=r.status,
                invited_at=r.invited_at,
            )
        )
    return results


@router.get("/{business_id}/analytics", response_model=HotelAnalyticsOut)
def get_outlet_analytics(
    business_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve food waste reduction and donation impact metrics for this outlet."""
    return get_hotel_analytics(db, business_id)
