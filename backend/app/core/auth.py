import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.user import User, Session as UserSession
from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key
    Returns: (full_key, hashed_key, prefix)
    """
    # Generate random key
    full_key = f"rs_{secrets.token_urlsafe(32)}"
    
    # Create hash for storage
    hashed_key = hashlib.sha256(full_key.encode()).hexdigest()
    
    # Create prefix for display
    prefix = full_key[:12] + "..."
    
    return full_key, hashed_key, prefix


def verify_api_key(api_key: str, stored_hash: str) -> bool:
    """Verify an API key against its hash"""
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    return key_hash == stored_hash


def create_session_token() -> str:
    """Generate a secure session token"""
    return secrets.token_urlsafe(64)


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user with email and password"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def get_user_by_token(db: Session, token: str) -> Optional[User]:
    """Get user by JWT token"""
    payload = verify_token(token)
    if payload is None:
        return None
    
    user_id: int = payload.get("sub")
    if user_id is None:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_user_by_api_key(db: Session, api_key: str) -> Optional[User]:
    """Get user by API key"""
    from app.models.user import APIKey
    
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    api_key_obj = db.query(APIKey).filter(
        APIKey.key_hash == api_key_hash,
        APIKey.is_active == True
    ).first()
    
    if not api_key_obj:
        return None
    
    # Check expiration
    if api_key_obj.expires_at and api_key_obj.expires_at < datetime.utcnow():
        return None
    
    # Update usage
    api_key_obj.last_used_at = datetime.utcnow()
    api_key_obj.usage_count += 1
    db.commit()
    
    return api_key_obj.user


def create_user_session(db: Session, user_id: int, user_agent: str = None, ip_address: str = None) -> str:
    """Create a new user session"""
    session_token = create_session_token()
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        user_agent=user_agent,
        ip_address=ip_address,
        expires_at=expires_at
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session_token


def get_user_by_session(db: Session, session_token: str) -> Optional[User]:
    """Get user by session token"""
    session = db.query(UserSession).filter(
        UserSession.session_token == session_token,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).first()
    
    if not session:
        return None
    
    # Update last accessed
    session.last_accessed_at = datetime.utcnow()
    db.commit()
    
    user = db.query(User).filter(User.id == session.user_id).first()
    return user


def invalidate_session(db: Session, session_token: str) -> bool:
    """Invalidate a user session"""
    session = db.query(UserSession).filter(
        UserSession.session_token == session_token
    ).first()
    
    if session:
        session.is_active = False
        db.commit()
        return True
    
    return False