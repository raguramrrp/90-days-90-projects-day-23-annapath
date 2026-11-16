"""Business and hotel schemas."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class BusinessCreate(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=150)
    business_type: str = Field(..., description="hotel, restaurant, bakery, catering, cafeteria, community_kitchen")
    fssai_license_number: Optional[str] = None
    registration_number: Optional[str] = None
    address: str = Field(..., min_length=5, max_length=300)
    city: str = Field(..., min_length=2, max_length=80)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    contact_phone: str = Field(..., pattern=r"^\+?[0-9]{10,14}$")
    operating_hours: Optional[str] = "08:00 AM - 11:00 PM"
    food_prep_storage_info: Optional[str] = None
    supported_distribution_methods: Optional[str] = "both"  # both, direct_pickup, volunteer_delivery


class BusinessUpdate(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    fssai_license_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_phone: Optional[str] = None
    operating_hours: Optional[str] = None
    food_prep_storage_info: Optional[str] = None
    supported_distribution_methods: Optional[str] = None


class BusinessOut(BaseModel):
    id: str
    owner_user_id: str
    business_name: str
    business_type: str
    fssai_license_number: Optional[str]
    registration_number: Optional[str]
    address: str
    city: str
    latitude: float
    longitude: float
    contact_phone: str
    operating_hours: str
    food_prep_storage_info: Optional[str]
    supported_distribution_methods: str
    verification_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BusinessStaffCreate(BaseModel):
    email: str
    permission_level: str = "staff"  # manager, staff, attendant


class BusinessStaffOut(BaseModel):
    id: str
    business_id: str
    user_id: str
    full_name: str
    email: str
    permission_level: str
    status: str
    invited_at: datetime

    model_config = ConfigDict(from_attributes=True)
