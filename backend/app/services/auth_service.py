"""Authentication and authorization services."""

from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import User, UserProfile, Business, VolunteerProfile
from backend.app.schemas.auth import UserRegister, UserLogin
from backend.app.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

security_scheme = HTTPBearer(auto_error=False)


def register_user(db: Session, reg: UserRegister) -> User:
    """Register a new user with role-specific profile."""
    # Check duplicate email
    if db.query(User).filter(User.email == reg.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )
    # Check duplicate phone
    if db.query(User).filter(User.phone == reg.phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this phone number already exists.",
        )

    # Hotels, volunteers, and admins start as verified for immediate smooth evaluation
    # while retaining admin verification capabilities
    user = User(
        full_name=reg.full_name.strip(),
        email=reg.email.lower().strip(),
        phone=reg.phone.strip(),
        password_hash=hash_password(reg.password),
        role=reg.role,
        account_status="verified",
        phone_verified=True,
    )
    db.add(user)
    db.flush()

    # User profile
    profile = UserProfile(
        user_id=user.id,
        preferred_language=reg.preferred_language or "en",
        city=reg.city or "Bengaluru",
    )
    db.add(profile)

    # If volunteer, create volunteer profile
    if reg.role == "volunteer":
        v_profile = VolunteerProfile(
            user_id=user.id,
            verification_status="verified",
            service_radius_km=10.0,
            availability_status="available",
            preferred_service_area=reg.city or "Central Bengaluru",
        )
        db.add(v_profile)

    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, credentials: UserLogin) -> User:
    """Authenticate a user via email and password."""
    user = db.query(User).filter(User.email == credentials.email.lower().strip()).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.account_status in ("suspended", "deactivated"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account has been {user.account_status}. Please contact platform administrators.",
        )
    return user


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to retrieve and validate the authenticated user from JWT."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(auth.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.account_status in ("suspended", "deactivated"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.account_status}.",
        )
    return user


def require_roles(*allowed_roles: str):
    """Enforce role-based access control on routes."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}. Your role is '{current_user.role}'.",
            )
        return current_user
    return role_checker
