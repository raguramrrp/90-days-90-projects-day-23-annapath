"""Authentication, password security, and JWT authorization tests."""

import pytest
from fastapi import HTTPException
from backend.app.schemas.auth import UserRegister, UserLogin
from backend.app.services.auth_service import register_user, authenticate_user
from backend.app.security import (
    hash_password, verify_password, create_access_token, decode_access_token,
    generate_otp, hash_otp, verify_otp_hash
)
from backend.app.models.entities import User


def test_password_hashing():
    """Verify PBKDF2-HMAC-SHA256 password hashing with salt."""
    raw = "MySecurePassword123!"
    hashed = hash_password(raw)
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_otp_generation_and_hashing():
    """Verify numeric OTP generation and HMAC-SHA256 verification."""
    otp = generate_otp(6)
    assert len(otp) == 6
    assert otp.isdigit()

    otp_hash = hash_otp(otp)
    assert verify_otp_hash(otp, otp_hash) is True
    assert verify_otp_hash("000000", otp_hash) is False


def test_jwt_token_creation_and_decoding():
    """Verify JWT token encoding, claim retrieval, and integrity."""
    data = {"sub": "user-uuid-12345", "role": "hotel_owner"}
    token = create_access_token(data)
    assert isinstance(token, str)
    assert len(token.split(".")) == 3

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-uuid-12345"
    assert decoded["role"] == "hotel_owner"
    assert "exp" in decoded

    # Tampered token
    tampered = token[:-5] + "XXXXX"
    assert decode_access_token(tampered) is None


def test_user_registration(db):
    """Verify user registration with profile creation."""
    reg = UserRegister(
        full_name="New Volunteer Tester",
        email="newvolunteer@test.org",
        phone="+919999911111",
        password="testpassword123",
        role="volunteer",
        city="Bengaluru",
        preferred_language="en",
    )
    user = register_user(db, reg)
    assert user.id is not None
    assert user.email == "newvolunteer@test.org"
    assert user.role == "volunteer"
    assert user.volunteer_profile is not None
    assert user.volunteer_profile.availability_status == "available"


def test_duplicate_user_registration_fails(db):
    """Verify registration fails if email already exists."""
    reg = UserRegister(
        full_name="Duplicate Tester",
        email="admin@annapath.org",  # already exists from seed
        phone="+919999922222",
        password="password123",
        role="recipient",
    )
    with pytest.raises(HTTPException) as exc:
        register_user(db, reg)
    assert exc.value.status_code == 400
    assert "already exists" in exc.value.detail


def test_user_authentication(db):
    """Verify valid login and invalid login rejection."""
    # Seeded hotel owner
    creds = UserLogin(email="owner@demokitchen.org", password="ownerpassword123")
    user = authenticate_user(db, creds)
    assert user.email == "owner@demokitchen.org"
    assert user.role == "hotel_owner"

    # Wrong password
    bad_creds = UserLogin(email="owner@demokitchen.org", password="wrongpassword")
    with pytest.raises(HTTPException) as exc:
        authenticate_user(db, bad_creds)
    assert exc.value.status_code == 401
