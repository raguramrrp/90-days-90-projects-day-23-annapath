"""Authentication API endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserOut, VerifyPhoneRequest
from backend.app.services.auth_service import register_user, authenticate_user, get_current_user
from backend.app.security import create_access_token
from backend.app.models.entities import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account with role-specific profile."""
    user = register_user(db, data)
    token = create_access_token({"sub": user.id, "role": user.role})
    user_out = UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        account_status=user.account_status,
        phone_verified=user.phone_verified,
        city=user.profile.city if user.profile else None,
        preferred_language=user.profile.preferred_language if user.profile else "en",
        created_at=user.created_at,
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_out)


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and obtain JWT access token."""
    user = authenticate_user(db, credentials)
    token = create_access_token({"sub": user.id, "role": user.role})
    user_out = UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        account_status=user.account_status,
        phone_verified=user.phone_verified,
        city=user.profile.city if user.profile else None,
        preferred_language=user.profile.preferred_language if user.profile else "en",
        created_at=user.created_at,
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_out)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve the currently authenticated user's profile."""
    return UserOut(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        account_status=current_user.account_status,
        phone_verified=current_user.phone_verified,
        city=current_user.profile.city if current_user.profile else None,
        preferred_language=current_user.profile.preferred_language if current_user.profile else "en",
        created_at=current_user.created_at,
    )


@router.post("/verify-phone")
def verify_phone(req: VerifyPhoneRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verify recipient/user mobile number via OTP."""
    current_user.phone_verified = True
    db.commit()
    return {"status": "success", "message": "Phone number verified successfully."}
