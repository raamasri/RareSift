"""
Input validation and sanitization utilities
"""

import re
import html
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from pydantic import BaseModel, Field, validator
import bleach

# Allowed HTML tags and attributes for text fields (very restrictive)
ALLOWED_TAGS = []  # No HTML tags allowed in any user input
ALLOWED_ATTRIBUTES = {}

# Regex patterns for validation
PATTERNS = {
    'filename': re.compile(r'^[a-zA-Z0-9_\-\.]+$'),
    'location': re.compile(r'^[a-zA-Z0-9\s\-\.,]+$'),
    'weather': re.compile(r'^[a-zA-Z0-9\s\-]+$'),
    'time_of_day': re.compile(r'^[a-zA-Z0-9\s\-]+$'),
    'search_query': re.compile(r'^[a-zA-Z0-9\s\-\.,\?!]+$'),
    'email': re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    'username': re.compile(r'^[a-zA-Z0-9_\-]{3,50}$'),
}

# Maximum lengths for different field types
MAX_LENGTHS = {
    'search_query': 500,
    'location': 200,
    'weather': 50,
    'time_of_day': 50,
    'filename': 255,
    'description': 1000,
    'name': 100,
    'email': 254,
    'company': 100,
    'role': 50,
}

class InputSanitizer:
    """Utilities for sanitizing and validating user input"""
    
    @staticmethod
    def sanitize_string(text: str, field_type: str = 'general') -> str:
        """
        Sanitize a string input to prevent XSS and injection attacks
        """
        if not text:
            return ""
            
        # Convert to string if not already
        text = str(text)
        
        # Check maximum length
        max_len = MAX_LENGTHS.get(field_type, 500)
        if len(text) > max_len:
            raise HTTPException(
                status_code=400,
                detail=f"Input too long. Maximum {max_len} characters allowed."
            )
        
        # Strip HTML tags and escape HTML entities
        text = bleach.clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
        text = html.escape(text)
        
        # Remove null bytes and control characters
        text = text.replace('\x00', '')
        text = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', text)
        
        # Strip leading/trailing whitespace
        text = text.strip()
        
        return text
    
    @staticmethod
    def validate_pattern(text: str, field_type: str) -> bool:
        """
        Validate text against allowed patterns
        """
        if not text:
            return True  # Empty strings are handled separately
            
        pattern = PATTERNS.get(field_type)
        if pattern:
            return bool(pattern.match(text))
        return True
    
    @staticmethod
    def sanitize_search_query(query: str) -> str:
        """
        Sanitize search query input
        """
        if not query:
            raise HTTPException(status_code=400, detail="Search query cannot be empty")
        
        sanitized = InputSanitizer.sanitize_string(query, 'search_query')
        
        # Additional search query validation
        if len(sanitized.strip()) < 2:
            raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
        
        # Check for potential SQL injection patterns
        sql_patterns = [
            r'\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b',
            r'[\'";]',  # Common SQL injection characters
            r'--',      # SQL comments
            r'/\*|\*/', # SQL block comments
        ]
        
        for pattern in sql_patterns:
            if re.search(pattern, sanitized.lower()):
                raise HTTPException(status_code=400, detail="Invalid characters in search query")
        
        return sanitized
    
    @staticmethod
    def sanitize_metadata_field(value: str, field_type: str) -> str:
        """
        Sanitize metadata fields like weather, time_of_day, location
        """
        if not value:
            return ""
            
        sanitized = InputSanitizer.sanitize_string(value, field_type)
        
        # Validate against pattern if defined
        if not InputSanitizer.validate_pattern(sanitized, field_type):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {field_type} format. Only letters, numbers, spaces, and basic punctuation allowed."
            )
        
        return sanitized
    
    @staticmethod
    def sanitize_numeric_input(value: Any, field_name: str, min_val: float = None, max_val: float = None) -> Optional[float]:
        """
        Sanitize and validate numeric input
        """
        if value is None:
            return None
            
        try:
            num_value = float(value)
            
            # Check for NaN or infinity
            if not (num_value == num_value):  # NaN check
                raise ValueError("Invalid number")
            if abs(num_value) == float('inf'):
                raise ValueError("Number too large")
            
            # Check bounds
            if min_val is not None and num_value < min_val:
                raise HTTPException(
                    status_code=400,
                    detail=f"{field_name} must be at least {min_val}"
                )
            if max_val is not None and num_value > max_val:
                raise HTTPException(
                    status_code=400,
                    detail=f"{field_name} must be at most {max_val}"
                )
            
            return num_value
            
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {field_name}. Must be a valid number."
            )

class ValidatedSearchRequest(BaseModel):
    """Validated search request model"""
    query: str = Field(..., min_length=2, max_length=500)
    limit: int = Field(10, ge=1, le=100)
    similarity_threshold: float = Field(0.5, ge=0.0, le=1.0)
    
    @validator('query')
    def validate_query(cls, v):
        return InputSanitizer.sanitize_search_query(v)

class ValidatedVideoMetadata(BaseModel):
    """Validated video metadata model"""
    weather: Optional[str] = Field(None, max_length=50)
    time_of_day: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=200)
    speed_avg: Optional[float] = Field(None, ge=0.0, le=300.0)  # km/h, reasonable max speed
    
    @validator('weather')
    def validate_weather(cls, v):
        if v is not None:
            return InputSanitizer.sanitize_metadata_field(v, 'weather')
        return v
    
    @validator('time_of_day')
    def validate_time_of_day(cls, v):
        if v is not None:
            return InputSanitizer.sanitize_metadata_field(v, 'time_of_day')
        return v
    
    @validator('location')
    def validate_location(cls, v):
        if v is not None:
            return InputSanitizer.sanitize_metadata_field(v, 'location')
        return v

class ValidatedUserProfile(BaseModel):
    """Validated user profile model"""
    full_name: str = Field(..., min_length=1, max_length=100)
    company: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = Field(None, max_length=50)
    
    @validator('full_name', 'company', 'role')
    def sanitize_text_fields(cls, v):
        if v is not None:
            return InputSanitizer.sanitize_string(v, 'name')
        return v

# Global sanitizer instance
input_sanitizer = InputSanitizer()