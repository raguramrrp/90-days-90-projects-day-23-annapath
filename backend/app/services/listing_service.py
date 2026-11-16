"""Food listing management and discovery service."""

from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException, status

from backend.app.models.entities import FoodListing, Business, User, BusinessStaff
from backend.app.schemas.listing import FoodListingCreate, FoodListingUpdate, FoodListingOut, BusinessBrief
from backend.app.services.geo import haversine_distance
from backend.app.services.notification_service import create_notification


def auto_expire_listings(db: Session) -> int:
    """Check and mark past-deadline listings as expired."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expired_listings = (
        db.query(FoodListing)
        .filter(
            FoodListing.status.in_(["published", "partially_reserved"]),
            FoodListing.collection_deadline < now,
        )
        .all()
    )
    count = 0
    for listing in expired_listings:
        listing.status = "expired"
        count += 1
        # Notify hotel
        create_notification(
            db=db,
            user_id=listing.created_by,
            notification_type="listing_expired",
            title=f"Listing Expired: {listing.title}",
            message=f"The collection deadline for '{listing.title}' has passed. Remaining {listing.quantity_available} portions marked as uncollected.",
        )
    if count > 0:
        db.commit()
    return count


def create_listing(db: Session, data: FoodListingCreate, current_user: User) -> FoodListing:
    """Create a new surplus food listing."""
    # Verify business ownership or staff association
    business = db.query(Business).filter(Business.id == data.business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )
    if business.owner_user_id != current_user.id and current_user.role != "admin":
        # Check staff assignment
        staff = (
            db.query(BusinessStaff)
            .filter(
                BusinessStaff.business_id == business.id,
                BusinessStaff.user_id == current_user.id,
                BusinessStaff.status == "active",
            )
            .first()
        )
        if not staff:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to publish food listings for this business.",
            )

    if not data.fssai_safety_declaration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider must confirm that food is safe and suitable for redistribution under FSSAI norms.",
        )

    listing = FoodListing(
        business_id=data.business_id,
        created_by=current_user.id,
        title=data.title.strip(),
        description=data.description.strip(),
        category=data.category,
        food_type=data.food_type,
        quantity_available=data.quantity_available,
        quantity_reserved=0,
        quantity_distributed=0,
        portion_size=data.portion_size or "1 Plate (~450g)",
        unit=data.unit or "portions",
        price_type=data.price_type,
        price_per_unit=data.price_per_unit if data.price_type == "nominal" else 0.0,
        preparation_time=data.preparation_time,
        collection_start=data.collection_start,
        collection_deadline=data.collection_deadline,
        storage_conditions=data.storage_conditions,
        allergen_information=data.allergen_information or "None specified",
        fssai_safety_declaration=data.fssai_safety_declaration,
        pickup_enabled=data.pickup_enabled,
        delivery_enabled=data.delivery_enabled,
        max_portions_per_recipient=data.max_portions_per_recipient,
        special_instructions=data.special_instructions,
        image_url=data.image_url,
        status="published",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def get_available_listings(
    db: Session,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    food_type: Optional[str] = None,
    price_type: Optional[str] = None,
    delivery_only: Optional[bool] = None,
    pickup_only: Optional[bool] = None,
    max_distance_km: Optional[float] = None,
    search: Optional[str] = None,
) -> List[FoodListingOut]:
    """Retrieve active surplus food listings filtered by discovery criteria."""
    auto_expire_listings(db)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    query = (
        db.query(FoodListing)
        .join(Business, FoodListing.business_id == Business.id)
        .filter(
            FoodListing.status.in_(["published", "partially_reserved"]),
            FoodListing.quantity_available > 0,
            FoodListing.collection_deadline > now,
        )
    )

    if city:
        query = query.filter(Business.city.ilike(f"%{city}%"))

    if category:
        query = query.filter(FoodListing.category == category)

    if food_type:
        query = query.filter(FoodListing.food_type == food_type)

    if price_type:
        query = query.filter(FoodListing.price_type == price_type)

    if delivery_only:
        query = query.filter(FoodListing.delivery_enabled.is_(True))

    if pickup_only:
        query = query.filter(FoodListing.pickup_enabled.is_(True))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                FoodListing.title.ilike(search_term),
                FoodListing.description.ilike(search_term),
                Business.business_name.ilike(search_term),
            )
        )

    listings = query.all()
    results: List[FoodListingOut] = []

    for item in listings:
        b = item.business
        business_brief = BusinessBrief(
            id=b.id,
            business_name=b.business_name,
            business_type=b.business_type,
            address=b.address,
            city=b.city,
            latitude=b.latitude,
            longitude=b.longitude,
            contact_phone=b.contact_phone,
            verification_status=b.verification_status,
        )

        dist = None
        if user_lat is not None and user_lon is not None:
            dist = haversine_distance(user_lat, user_lon, b.latitude, b.longitude)
            if max_distance_km is not None and dist > max_distance_km:
                continue

        out = FoodListingOut(
            id=item.id,
            business_id=item.business_id,
            business=business_brief,
            created_by=item.created_by,
            title=item.title,
            description=item.description,
            category=item.category,
            food_type=item.food_type,
            quantity_available=item.quantity_available,
            quantity_reserved=item.quantity_reserved,
            quantity_distributed=item.quantity_distributed,
            portion_size=item.portion_size,
            unit=item.unit,
            price_type=item.price_type,
            price_per_unit=item.price_per_unit,
            preparation_time=item.preparation_time,
            collection_start=item.collection_start,
            collection_deadline=item.collection_deadline,
            storage_conditions=item.storage_conditions,
            allergen_information=item.allergen_information,
            fssai_safety_declaration=item.fssai_safety_declaration,
            pickup_enabled=item.pickup_enabled,
            delivery_enabled=item.delivery_enabled,
            max_portions_per_recipient=item.max_portions_per_recipient,
            special_instructions=item.special_instructions,
            image_url=item.image_url,
            status=item.status,
            created_at=item.created_at,
            distance_km=dist,
        )
        results.append(out)

    # Sort by nearest if user location provided, else by deadline approaching
    if user_lat is not None and user_lon is not None:
        results.sort(key=lambda x: (x.distance_km if x.distance_km is not None else 999999))
    else:
        results.sort(key=lambda x: x.collection_deadline)

    return results
