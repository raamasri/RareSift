from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.dependencies import rate_limit_moderate
from app.models.user import User
from app.core.validation import input_sanitizer

router = APIRouter()
logger = logging.getLogger(__name__)

class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., max_length=254)
    company: Optional[str] = Field(None, max_length=100)
    message: str = Field(..., min_length=10, max_length=1000)
    contact_type: str = Field("general", regex="^(general|demo|sales|support)$")
    
    @validator('name', 'company', 'message')
    def sanitize_text_fields(cls, v):
        if v is not None:
            return input_sanitizer.sanitize_string(v, 'name')
        return v
    
    @validator('email')
    def validate_email(cls, v):
        sanitized = input_sanitizer.sanitize_string(v, 'email')
        # Basic email validation
        if '@' not in sanitized or '.' not in sanitized.split('@')[-1]:
            raise ValueError('Invalid email format')
        return sanitized

class DemoRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., max_length=254)
    company: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    team_size: Optional[str] = Field(None, max_length=50)
    use_case: Optional[str] = Field(None, max_length=500)
    preferred_time: Optional[str] = Field(None, max_length=100)
    data_volume: Optional[str] = Field(None, max_length=100)
    
    @validator('name', 'company', 'phone', 'team_size', 'use_case', 'preferred_time', 'data_volume')
    def sanitize_text_fields(cls, v):
        if v is not None:
            return input_sanitizer.sanitize_string(v, 'name')
        return v
    
    @validator('email')
    def validate_email(cls, v):
        sanitized = input_sanitizer.sanitize_string(v, 'email')
        if '@' not in sanitized or '.' not in sanitized.split('@')[-1]:
            raise ValueError('Invalid email format')
        return sanitized

class NewsletterSignup(BaseModel):
    email: str = Field(..., max_length=254)
    source: Optional[str] = Field("landing_page", max_length=50)
    
    @validator('email')
    def validate_email(cls, v):
        sanitized = input_sanitizer.sanitize_string(v, 'email')
        if '@' not in sanitized or '.' not in sanitized.split('@')[-1]:
            raise ValueError('Invalid email format')
        return sanitized
    
    @validator('source')
    def sanitize_source(cls, v):
        if v is not None:
            return input_sanitizer.sanitize_string(v, 'name')
        return v

async def send_contact_email(contact_data: dict):
    """Background task to send contact email"""
    # In production, integrate with SendGrid, AWS SES, or similar
    logger.info(f"Sending contact email for {contact_data['email']}: {contact_data['contact_type']}")
    
    # Mock email sending - replace with real email service
    print(f"""
    📧 NEW CONTACT FORM SUBMISSION
    ═══════════════════════════════
    Type: {contact_data['contact_type'].upper()}
    Name: {contact_data['name']}
    Email: {contact_data['email']}
    Company: {contact_data.get('company', 'Not provided')}
    Message: {contact_data.get('message', 'Not provided')}
    Time: {datetime.now().isoformat()}
    ═══════════════════════════════
    """)

@router.post("/contact")
async def submit_contact_form(
    contact: ContactRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """Submit general contact form"""
    try:
        # Log the contact request
        contact_data = {
            "name": contact.name,
            "email": contact.email,
            "company": contact.company,
            "message": contact.message,
            "contact_type": contact.contact_type,
            "timestamp": datetime.now().isoformat()
        }
        
        # Send email in background
        background_tasks.add_task(send_contact_email, contact_data)
        
        return {
            "success": True,
            "message": "Thank you for your message! We'll get back to you within 24 hours.",
            "contact_id": f"contact_{int(datetime.now().timestamp())}"
        }
        
    except Exception as e:
        logger.error(f"Contact form submission failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit contact form")

@router.post("/demo-request")
async def request_demo(
    demo: DemoRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """Request a personalized demo"""
    try:
        demo_data = {
            "name": demo.name,
            "email": demo.email,
            "company": demo.company,
            "phone": demo.phone,
            "team_size": demo.team_size,
            "use_case": demo.use_case,
            "preferred_time": demo.preferred_time,
            "data_volume": demo.data_volume,
            "contact_type": "demo_request",
            "timestamp": datetime.now().isoformat()
        }
        
        # Send demo request email
        background_tasks.add_task(send_contact_email, demo_data)
        
        return {
            "success": True,
            "message": "Demo request received! Our team will contact you within 2 business hours to schedule your personalized demo.",
            "demo_id": f"demo_{int(datetime.now().timestamp())}"
        }
        
    except Exception as e:
        logger.error(f"Demo request failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit demo request")

@router.post("/newsletter")
async def subscribe_newsletter(
    signup: NewsletterSignup,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """Subscribe to newsletter/updates"""
    try:
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == signup.email).first()
        
        newsletter_data = {
            "email": signup.email,
            "source": signup.source,
            "contact_type": "newsletter",
            "timestamp": datetime.now().isoformat(),
            "existing_user": bool(existing_user)
        }
        
        # Send confirmation email
        background_tasks.add_task(send_contact_email, newsletter_data)
        
        return {
            "success": True,
            "message": "Thanks for subscribing! You'll receive updates about RareSift features and AV industry insights.",
            "subscription_id": f"newsletter_{int(datetime.now().timestamp())}"
        }
        
    except Exception as e:
        logger.error(f"Newsletter signup failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to subscribe to newsletter")

@router.get("/contact-info")
async def get_contact_info():
    """Get company contact information"""
    return {
        "company": "RareSift",
        "email": "hello@raresift.com",
        "phone": "+1 (555) 123-4567",
        "address": "San Francisco, CA",
        "support_email": "support@raresift.com",
        "sales_email": "sales@raresift.com",
        "hours": "Mon-Fri 9AM-6PM PST"
    }

@router.post("/pricing-inquiry")
async def submit_pricing_inquiry(
    inquiry: dict,
    background_tasks: BackgroundTasks,
    _: None = Depends(rate_limit_moderate)
):
    """Submit enterprise pricing inquiry"""
    try:
        pricing_data = {
            "name": inquiry.get("name"),
            "email": inquiry.get("email"),
            "company": inquiry.get("company"),
            "plan_interest": inquiry.get("plan"),
            "data_volume": inquiry.get("data_volume"),
            "team_size": inquiry.get("team_size"),
            "budget": inquiry.get("budget"),
            "timeline": inquiry.get("timeline"),
            "contact_type": "pricing_inquiry",
            "timestamp": datetime.now().isoformat()
        }
        
        background_tasks.add_task(send_contact_email, pricing_data)
        
        return {
            "success": True,
            "message": "Pricing inquiry received! Our sales team will contact you with a custom quote within 4 hours.",
            "inquiry_id": f"pricing_{int(datetime.now().timestamp())}"
        }
        
    except Exception as e:
        logger.error(f"Pricing inquiry failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit pricing inquiry")