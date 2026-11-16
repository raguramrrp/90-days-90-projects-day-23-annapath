"""Authentication and user schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="Valid email address")
    phone: str = Field(..., pattern=r"^\+?[0-9]{10,14}$")
    password: str = Field(..., min_length=6)
    role: str = Field("recipient", description="hotel_owner, hotel_staff, volunteer, recipient, organisation, admin")
    city: Optional[str] = "Bengaluru"
    preferred_language: Optional[str] = "en"


class UserLogin(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    role: str
    account_status: str
    phone_verified: bool
    city: Optional[str] = None
    preferred_language: Optional[str] = "en"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerifyPhoneRequest(BaseModel):
    phone: str
    otp: str


TokenResponse.model_rebuild()
