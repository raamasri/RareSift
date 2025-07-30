from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.dependencies import rate_limit_moderate
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    message: str
    contact_type: str = "general"  # general, demo, sales, support

class DemoRequest(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None
    team_size: Optional[str] = None
    use_case: Optional[str] = None
    preferred_time: Optional[str] = None
    data_volume: Optional[str] = None

class NewsletterSignup(BaseModel):
    email: EmailStr
    source: Optional[str] = "landing_page"

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