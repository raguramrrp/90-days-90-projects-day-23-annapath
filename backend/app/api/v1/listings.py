"""Surplus food listings API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import FoodListing, User
from backend.app.schemas.listing import FoodListingCreate, FoodListingUpdate, FoodListingOut, BusinessBrief
from backend.app.services.auth_service import get_current_user, require_roles
from backend.app.services.listing_service import create_listing, get_available_listings

router = APIRouter(prefix="/food-listings", tags=["Food Listings"])


@router.post("/", response_model=FoodListingOut, status_code=status.HTTP_201_CREATED)
def publish_listing(
    data: FoodListingCreate,
    current_user: User = Depends(require_roles("hotel_owner", "hotel_staff", "admin")),
    db: Session = Depends(get_db),
):
    """Publish a new surplus food listing with mandatory FSSAI safety confirmation."""
    listing = create_listing(db, data, current_user)
    b = listing.business
    brief = BusinessBrief(
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
    return FoodListingOut(
        id=listing.id,
        business_id=listing.business_id,
        business=brief,
        created_by=listing.created_by,
        title=listing.title,
        description=listing.description,
        category=listing.category,
        food_type=listing.food_type,
        quantity_available=listing.quantity_available,
        quantity_reserved=listing.quantity_reserved,
        quantity_distributed=listing.quantity_distributed,
        portion_size=listing.portion_size,
        unit=listing.unit,
        price_type=listing.price_type,
        price_per_unit=listing.price_per_unit,
        preparation_time=listing.preparation_time,
        collection_start=listing.collection_start,
        collection_deadline=listing.collection_deadline,
        storage_conditions=listing.storage_conditions,
        allergen_information=listing.allergen_information,
        fssai_safety_declaration=listing.fssai_safety_declaration,
        pickup_enabled=listing.pickup_enabled,
        delivery_enabled=listing.delivery_enabled,
        max_portions_per_recipient=listing.max_portions_per_recipient,
        special_instructions=listing.special_instructions,
        image_url=listing.image_url,
        status=listing.status,
        created_at=listing.created_at,
        distance_km=None,
    )


@router.get("/", response_model=List[FoodListingOut])
def discover_listings(
    lat: Optional[float] = Query(None, description="User current latitude for distance sorting"),
    lon: Optional[float] = Query(None, description="User current longitude for distance sorting"),
    city: Optional[str] = Query(None, description="Filter by Indian city (e.g. Bengaluru, Chennai)"),
    category: Optional[str] = Query(None, description="meals, bakery, curries_gravy, rice_breads, snacks, desserts"),
    food_type: Optional[str] = Query(None, description="vegetarian, non_vegetarian, vegan"),
    price_type: Optional[str] = Query(None, description="free or nominal"),
    delivery_only: Optional[bool] = Query(None),
    pickup_only: Optional[bool] = Query(None),
    max_distance_km: Optional[float] = Query(None, description="Max distance in km from user"),
    search: Optional[str] = Query(None, description="Keyword search in title, hotel name or description"),
    db: Session = Depends(get_db),
):
    """
    Public discovery feed of available surplus food.
    Automatically filters out expired and fully-reserved items.
    """
    return get_available_listings(
        db=db,
        user_lat=lat,
        user_lon=lon,
        city=city,
        category=category,
        food_type=food_type,
        price_type=price_type,
        delivery_only=delivery_only,
        pickup_only=pickup_only,
        max_distance_km=max_distance_km,
        search=search,
    )


@router.get("/{listing_id}", response_model=FoodListingOut)
def get_listing(listing_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed listing data including business coordinates and allergen details."""
    item = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food listing not found.")
    b = item.business
    brief = BusinessBrief(
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
    return FoodListingOut(
        id=item.id,
        business_id=item.business_id,
        business=brief,
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
        distance_km=None,
    )


@router.patch("/{listing_id}", response_model=FoodListingOut)
def update_listing(
    listing_id: str,
    update: FoodListingUpdate,
    current_user: User = Depends(require_roles("hotel_owner", "hotel_staff", "admin")),
    db: Session = Depends(get_db),
):
    """Update listing portion availability or deadline."""
    item = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food listing not found.")

    for k, v in update.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return get_listing(listing_id, db)


@router.post("/{listing_id}/cancel")
def cancel_listing(
    listing_id: str,
    current_user: User = Depends(require_roles("hotel_owner", "hotel_staff", "admin")),
    db: Session = Depends(get_db),
):
    """Mark a food listing as cancelled and close pending reservations."""
    item = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food listing not found.")
    item.status = "cancelled"
    db.commit()
    return {"status": "success", "message": "Listing cancelled successfully."}
