from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..schemas.schemas import User, UserUpdate, UserWithDetails
from ..models.models import User as UserModel
from ..database.database import get_db
from ..auth.auth import get_current_active_user, get_password_hash

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[User])
async def get_users(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    """Get all users."""
    users = db.query(UserModel).all()
    return users


@router.get("/{user_id}", response_model=UserWithDetails)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Get a user by ID with their feeds and comments."""
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.put("/profile", response_model=User)
async def update_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    """Update the current user's profile."""
    # Check if username already exists if changing username
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(UserModel).filter(UserModel.username == user_update.username.lower()).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = user_update.username.lower()
    
    # Check if email already exists if changing email
    if user_update.email and user_update.email != current_user.email:
        existing_email = db.query(UserModel).filter(UserModel.email == user_update.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
    
    # Update password if provided
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user 