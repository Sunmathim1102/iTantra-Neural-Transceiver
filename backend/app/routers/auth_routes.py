import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.db_models import User, SystemLog
from app.schemas.api_schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserProfileResponse
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    role = "ADMIN" if req.email.lower().startswith("admin@") else (req.role or "USER")
    user = User(
        name=req.name,
        email=req.email,
        password_hash=get_password_hash(req.password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log = SystemLog(
        user_id=user.id,
        action="USER_REGISTER",
        details=f"User {user.name} registered with email {user.email}",
        level="INFO"
    )
    db.add(log)
    db.commit()

    token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name})
    
    log = SystemLog(
        user_id=user.id,
        action="USER_LOGIN",
        details=f"User {user.email} logged in",
        level="INFO"
    )
    db.add(log)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }
