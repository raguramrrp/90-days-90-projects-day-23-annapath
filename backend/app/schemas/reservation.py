"""Reservation and booking schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class DeliveryAddressCreate(BaseModel):
    address_line: str = Field(..., min_length=5, max_length=300)
    city: str = Field(..., min_length=2, max_length=80)
    latitude: Optional[float] = 12.9716
    longitude: Optional[float] = 77.5946
    access_instructions: Optional[str] = None


class ReservationCreate(BaseModel):
    listing_id: str
    quantity: int = Field(..., gt=0, description="Number of portions to reserve")
    distribution_method: str = Field("direct_pickup", description="direct_pickup or volunteer_delivery")
    organisation_id: Optional[str] = None
    delivery_address: Optional[DeliveryAddressCreate] = None


class PickupOTPVerify(BaseModel):
    otp: str = Field(..., min_length=4, max_length=10)


class DeliveryOTPVerify(BaseModel):
    otp: str = Field(..., min_length=4, max_length=10)


class ReservationOut(BaseModel):
    id: str
    listing_id: str
    recipient_user_id: str
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    organisation_id: Optional[str] = None
    listing_title: Optional[str] = None
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    quantity: int
    price_per_unit_snapshot: float
    total_price: float
    distribution_method: str
    status: str
    pickup_otp_plain: Optional[str] = None
    delivery_otp_plain: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
