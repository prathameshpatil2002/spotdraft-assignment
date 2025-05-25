from fastapi import Depends, HTTPException, status, Request, Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
from dotenv import load_dotenv

from ..schemas.schemas import TokenData
from ..models.models import User
from ..database.database import get_db

# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token handling
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password, hashed_password):
    """Verify the password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Hash a password."""
    return pwd_context.hash(password)


def get_user(db: Session, username: str):
    """Get a user by username."""
    return db.query(User).filter(User.username == username).first()


def authenticate_user(db: Session, username: str, password: str):
    """Authenticate a user."""
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict):
    """Create an access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get the current user from the token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        userid: str = payload.get("userid")
        if userid is None:
            raise credentials_exception
        token_data = TokenData(userid=userid,username=payload.get("username"),email=payload.get("email"))
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_user_from_cookie(
    request: Request, 
    db: Session = Depends(get_db),
    access_token: Optional[str] = Cookie(None, alias="access_token")
):
    """Get the current user from cookie token for templates."""
    if not access_token:
        return None
    
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            return None
        user = get_user(db, username=username)
        if user is None:
            return None
        return user
    except JWTError:
        return None 