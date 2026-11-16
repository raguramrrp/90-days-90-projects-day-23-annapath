"""SQLAlchemy database models for PLATEWISE."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)  # hotel_owner, hotel_staff, volunteer, recipient, organisation, admin
    account_status = Column(String(30), nullable=False, default="verified")  # pending_verification, verified, rejected, suspended, deactivated
    phone_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    owned_businesses = relationship("Business", back_populates="owner", foreign_keys="Business.owner_user_id")
    staff_assignments = relationship("BusinessStaff", back_populates="user")
    volunteer_profile = relationship("VolunteerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    owned_organisations = relationship("Organisation", back_populates="owner")
    reservations = relationship("Reservation", back_populates="recipient", foreign_keys="Reservation.recipient_user_id")
    volunteer_tasks = relationship("DeliveryTask", back_populates="volunteer", foreign_keys="DeliveryTask.volunteer_user_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    complaints_reported = relationship("Complaint", back_populates="reporter")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    profile_photo = Column(String(500), nullable=True)
    preferred_language = Column(String(10), default="en")
    city = Column(String(80), nullable=True)
    notification_preferences = Column(String(255), default="in_app,email")

    user = relationship("User", back_populates="profile")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    business_name = Column(String(150), nullable=False)
    business_type = Column(String(50), nullable=False)  # hotel, restaurant, bakery, catering, cafeteria, community_kitchen
    fssai_license_number = Column(String(50), nullable=True)
    registration_number = Column(String(60), nullable=True)
    address = Column(String(300), nullable=False)
    city = Column(String(80), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_phone = Column(String(20), nullable=False)
    operating_hours = Column(String(100), default="08:00 AM - 11:00 PM")
    food_prep_storage_info = Column(Text, nullable=True)
    supported_distribution_methods = Column(String(30), default="both")  # both, direct_pickup, volunteer_delivery
    verification_status = Column(String(30), default="verified")  # pending, verified, rejected, suspended
    created_at = Column(DateTime, default=utc_now)

    owner = relationship("User", back_populates="owned_businesses", foreign_keys=[owner_user_id])
    staff = relationship("BusinessStaff", back_populates="business", cascade="all, delete-orphan")
    listings = relationship("FoodListing", back_populates="business", cascade="all, delete-orphan")


class BusinessStaff(Base):
    __tablename__ = "business_staff"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    permission_level = Column(String(30), default="staff")  # manager, staff, attendant
    status = Column(String(30), default="active")  # active, suspended, removed
    invited_at = Column(DateTime, default=utc_now)

    business = relationship("Business", back_populates="staff")
    user = relationship("User", back_populates="staff_assignments")


class VolunteerProfile(Base):
    __tablename__ = "volunteer_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    verification_status = Column(String(30), default="verified")  # pending, verified, rejected
    service_radius_km = Column(Float, default=8.0)
    availability_status = Column(String(30), default="available")  # available, busy, offline
    preferred_service_area = Column(String(120), default="Central City")
    vehicle_type = Column(String(40), default="two_wheeler")  # bicycle, two_wheeler, car, walking
    total_deliveries_completed = Column(Integer, default=0)

    user = relationship("User", back_populates="volunteer_profile")


class Organisation(Base):
    __tablename__ = "organisations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    organisation_name = Column(String(150), nullable=False)
    organisation_type = Column(String(50), default="ngo")  # ngo, shelter, community_kitchen, orphanage
    registration_number = Column(String(60), nullable=True)
    address = Column(String(300), nullable=False)
    city = Column(String(80), nullable=False)
    verification_status = Column(String(30), default="verified")  # pending, verified, rejected
    created_at = Column(DateTime, default=utc_now)

    owner = relationship("User", back_populates="owned_organisations")
    reservations = relationship("Reservation", back_populates="organisation")


class FoodListing(Base):
    __tablename__ = "food_listings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # meals, bakery, curries_gravy, rice_breads, snacks, desserts
    food_type = Column(String(30), nullable=False)  # vegetarian, non_vegetarian, vegan, contain_egg
    quantity_available = Column(Integer, nullable=False, default=0)
    quantity_reserved = Column(Integer, nullable=False, default=0)
    quantity_distributed = Column(Integer, nullable=False, default=0)
    portion_size = Column(String(80), default="1 Plate (~450g)")
    unit = Column(String(30), default="portions")
    price_type = Column(String(20), nullable=False, default="free")  # free, nominal
    price_per_unit = Column(Float, nullable=False, default=0.0)
    preparation_time = Column(DateTime, nullable=False)
    collection_start = Column(DateTime, nullable=False)
    collection_deadline = Column(DateTime, nullable=False, index=True)
    storage_conditions = Column(String(50), default="hot_holding")  # hot_holding, chilled, ambient
    allergen_information = Column(String(255), default="None specified")
    fssai_safety_declaration = Column(Boolean, default=True)
    pickup_enabled = Column(Boolean, default=True)
    delivery_enabled = Column(Boolean, default=True)
    max_portions_per_recipient = Column(Integer, default=5)
    special_instructions = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    status = Column(String(30), default="published", index=True)  # draft, published, fully_reserved, expired, cancelled, completed
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        CheckConstraint("quantity_available >= 0", name="check_positive_available_quantity"),
        CheckConstraint("price_per_unit >= 0", name="check_positive_price"),
    )

    business = relationship("Business", back_populates="listings")
    reservations = relationship("Reservation", back_populates="listing", cascade="all, delete-orphan")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    listing_id = Column(String(36), ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    organisation_id = Column(String(36), ForeignKey("organisations.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    price_per_unit_snapshot = Column(Float, nullable=False, default=0.0)
    total_price = Column(Float, nullable=False, default=0.0)
    distribution_method = Column(String(30), nullable=False)  # direct_pickup, volunteer_delivery
    status = Column(String(30), default="pending_approval", index=True)  # pending_approval, confirmed, ready_for_pickup, collected, out_for_delivery, delivered, rejected, cancelled, expired
    pickup_otp_hash = Column(String(64), nullable=True)
    pickup_otp_plain = Column(String(10), nullable=True)  # visible only to authorized recipient & owner in testing
    delivery_otp_hash = Column(String(64), nullable=True)
    delivery_otp_plain = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_positive_reservation_quantity"),
    )

    listing = relationship("FoodListing", back_populates="reservations")
    recipient = relationship("User", back_populates="reservations", foreign_keys=[recipient_user_id])
    organisation = relationship("Organisation", back_populates="reservations")
    delivery_task = relationship("DeliveryTask", back_populates="reservation", uselist=False, cascade="all, delete-orphan")
    delivery_address = relationship("DeliveryAddress", back_populates="reservation", uselist=False, cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="reservation")
    events = relationship("DistributionEvent", back_populates="reservation", cascade="all, delete-orphan")


class DeliveryTask(Base):
    __tablename__ = "delivery_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reservation_id = Column(String(36), ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False, unique=True)
    volunteer_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    pickup_status = Column(String(30), default="pending")  # pending, reached_hotel, picked_up, failed
    delivery_status = Column(String(30), default="available", index=True)  # available, accepted, en_route, delivered, failed, cancelled
    assigned_at = Column(DateTime, nullable=True)
    picked_up_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    failure_reason = Column(String(255), nullable=True)

    reservation = relationship("Reservation", back_populates="delivery_task")
    volunteer = relationship("User", back_populates="volunteer_tasks", foreign_keys=[volunteer_user_id])


class DeliveryAddress(Base):
    __tablename__ = "delivery_addresses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reservation_id = Column(String(36), ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False, unique=True)
    recipient_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    address_line = Column(String(300), nullable=False)
    city = Column(String(80), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    access_instructions = Column(String(255), nullable=True)

    reservation = relationship("Reservation", back_populates="delivery_address")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_type = Column(String(40), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="notifications")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reporter_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reservation_id = Column(String(36), ForeignKey("reservations.id"), nullable=False)
    complaint_type = Column(String(50), nullable=False)  # food_quality, hygiene, late_pickup, unsafe_packaging, otp_issue, other
    description = Column(Text, nullable=False)
    status = Column(String(30), default="open")  # open, investigating, resolved, dismissed
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    reporter = relationship("User", back_populates="complaints_reported")
    reservation = relationship("Reservation", back_populates="complaints")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(80), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class DistributionEvent(Base):
    __tablename__ = "distribution_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reservation_id = Column(String(36), ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)
    actor_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    event_timestamp = Column(DateTime, default=utc_now)
    verification_method = Column(String(40), default="otp_direct")

    reservation = relationship("Reservation", back_populates="events")
