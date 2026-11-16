"""Admin moderation, complaint, and audit schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class VerificationAction(BaseModel):
    action: str = Field(..., description="approve, reject, suspend")
    reason: Optional[str] = None


class ComplaintCreate(BaseModel):
    reservation_id: str
    complaint_type: str = Field(..., description="food_quality, hygiene, late_pickup, unsafe_packaging, otp_issue, other")
    description: str = Field(..., min_length=10)


class ComplaintUpdate(BaseModel):
    status: str = Field(..., description="open, investigating, resolved, dismissed")
    resolution_notes: Optional[str] = None


class ComplaintOut(BaseModel):
    id: str
    reporter_user_id: str
    reporter_name: Optional[str] = None
    reservation_id: str
    complaint_type: str
    description: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogOut(BaseModel):
    id: str
    actor_user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    metadata_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
