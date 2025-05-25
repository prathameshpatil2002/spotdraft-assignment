from fastapi import APIRouter, Depends, HTTPException, status, Request, Form, Response
from sqlalchemy.orm import Session

from ..schemas.schemas import UserCreate, User
from ..models.models import User as UserModel
from ..database.database import get_db

from ..auth.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user,
)

router = APIRouter(prefix="/auth",tags=["authentication"])


@router.post("/login")
async def login_form(
    request: Request,
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Login form submission handler."""
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(
        data={
                "userid": user.id,
                "username": user.username,
                "email": user.email,
             }, 
    )
    
    # Set the token as a cookie for the web interface
    response.set_cookie(
        key="access_token", 
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="strict"
    )
    
    # Return token for API clients
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register")
async def register_user(
    request: Request,
    response: Response,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Register a new user."""
    # Handle both API and form submissions
    try:
        user = UserCreate(username=username, email=email, password=password)
    except Exception as e:
        raise HTTPException(
        status_code=400, detail="Invalid registration data"
    )
        

    # Check if the username already exists
    db_user = db.query(UserModel).filter(UserModel.username == user.username.lower()).first()
    if db_user:
            raise HTTPException(
                status_code=400, detail="Username already registered"
            )
    
    # Check if the email already exists
    db_email = db.query(UserModel).filter(UserModel.email == user.email).first()
    if db_email:
            raise HTTPException(
                status_code=400, detail="Email already registered"
            )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = UserModel(
        username=user.username.lower(),
        email=user.email,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = create_access_token(
    data={
            "userid": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
            }, 
)

    # Set the token as a cookie for the web interface
    response.set_cookie(
        key="access_token", 
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="strict"
    )
    
    # Return token for API clients
    return {
            "success":True, 
            "message":"User Registered Successfully",
            "access_token": access_token, 
            "token_type": "bearer"
        }
        


@router.get("/user/me", response_model=User)
async def read_users_me(current_user: UserModel = Depends(get_current_active_user)):
    """Get the current user."""
    return current_user 