from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_user_by_token, get_user_by_api_key, get_user_by_session
from app.models.user import User

# Security scheme for API key and JWT
security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get the current authenticated user from JWT token, API key, or session
    """
    # Try JWT token first
    if credentials:
        token = credentials.credentials
        user = get_user_by_token(db, token)
        if user and user.is_active:
            # Update last activity
            from datetime import datetime
            user.last_active_at = datetime.utcnow()
            db.commit()
            return user
    
    # Try API key from headers
    api_key = request.headers.get("X-API-Key")
    if api_key:
        user = get_user_by_api_key(db, api_key)
        if user and user.is_active:
            user.last_active_at = datetime.utcnow()
            db.commit()
            return user
    
    # Try session cookie
    session_token = request.cookies.get("session_token")
    if session_token:
        user = get_user_by_session(db, session_token)
        if user and user.is_active:
            user.last_active_at = datetime.utcnow()
            db.commit()
            return user
    
    return None


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """
    Get current user and ensure they are active (required for protected endpoints)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get current user and ensure they are a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return current_user


async def get_optional_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> Optional[User]:
    """
    Get current user if authenticated, but don't require authentication
    """
    return current_user


class RateLimiter:
    """
    Simple rate limiter based on user and endpoint
    """
    def __init__(self, calls: int, period: int):
        self.calls = calls
        self.period = period
        self.requests = {}
    
    def __call__(self, request: Request, user: Optional[User] = Depends(get_optional_user)):
        import time
        
        # Use user ID if authenticated, otherwise use IP address
        key = f"user_{user.id}" if user else f"ip_{request.client.host}"
        now = time.time()
        
        # Clean old requests
        if key in self.requests:
            self.requests[key] = [req_time for req_time in self.requests[key] if now - req_time < self.period]
        else:
            self.requests[key] = []
        
        # Check rate limit
        if len(self.requests[key]) >= self.calls:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: {self.calls} calls per {self.period} seconds"
            )
        
        # Add current request
        self.requests[key].append(now)


# Pre-configured rate limiters
rate_limit_strict = RateLimiter(calls=10, period=60)  # 10 calls per minute
rate_limit_moderate = RateLimiter(calls=100, period=60)  # 100 calls per minute
rate_limit_generous = RateLimiter(calls=1000, period=3600)  # 1000 calls per hour