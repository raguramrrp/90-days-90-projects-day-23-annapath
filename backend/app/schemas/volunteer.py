"""Volunteer schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class VolunteerProfileUpdate(BaseModel):
    service_radius_km: Optional[float] = Field(None, ge=1.0, le=50.0)
    availability_status: Optional[str] = Field(None, description="available, busy, offline")
    preferred_service_area: Optional[str] = None
    vehicle_type: Optional[str] = None


class DeliveryTaskOut(BaseModel):
    id: str
    reservation_id: str
    volunteer_user_id: Optional[str] = None
    pickup_status: str
    delivery_status: str
    assigned_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    failure_reason: Optional[str] = None

    # Contextual data
    food_title: Optional[str] = None
    quantity: Optional[int] = None
    pickup_business_name: Optional[str] = None
    pickup_address: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    delivery_address: Optional[str] = None
    delivery_city: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    access_instructions: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
