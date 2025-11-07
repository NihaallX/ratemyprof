"""
API Router: Request College
Handles college addition requests and sends email notifications
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime

router = APIRouter()

class CollegeRequest(BaseModel):
    college_name: str
    city: str
    state: str
    requester_name: str
    requester_email: EmailStr
    additional_info: Optional[str] = None

def send_email(request: CollegeRequest):
    """Send email notification about college request"""
    
    # Email configuration
    SENDER_EMAIL = os.getenv("SMTP_EMAIL", "noreply@ratemyprof.in")
    SENDER_PASSWORD = os.getenv("SMTP_PASSWORD")
    RECIPIENT_EMAIL = "ratemyprofgn@gmail.com"
    
    if not SENDER_PASSWORD:
        # If no SMTP configured, just log the request
        print(f"College Request (Email not configured): {request.dict()}")
        return
    
    # Create email content
    subject = f"New College Request: {request.college_name}"
    
    html_body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #4e46e5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }}
            .field {{ margin-bottom: 15px; }}
            .label {{ font-weight: bold; color: #4e46e5; }}
            .value {{ margin-left: 10px; }}
            .footer {{ margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px; font-size: 12px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🎓 New College Addition Request</h2>
            </div>
            <div class="content">
                <div class="field">
                    <span class="label">College/University Name:</span>
                    <span class="value">{request.college_name}</span>
                </div>
                <div class="field">
                    <span class="label">City:</span>
                    <span class="value">{request.city}</span>
                </div>
                <div class="field">
                    <span class="label">State:</span>
                    <span class="value">{request.state}</span>
                </div>
                <div class="field">
                    <span class="label">Requester Name:</span>
                    <span class="value">{request.requester_name}</span>
                </div>
                <div class="field">
                    <span class="label">Requester Email:</span>
                    <span class="value"><a href="mailto:{request.requester_email}">{request.requester_email}</a></span>
                </div>
                {f'''
                <div class="field">
                    <span class="label">Additional Information:</span>
                    <div class="value" style="margin-top: 5px; white-space: pre-wrap;">{request.additional_info}</div>
                </div>
                ''' if request.additional_info else ''}
                <div class="field">
                    <span class="label">Submitted:</span>
                    <span class="value">{datetime.now().strftime('%B %d, %Y at %I:%M %p IST')}</span>
                </div>
            </div>
            <div class="footer">
                <p>This is an automated email from RateMyProf India. The user has requested to add their college to the platform.</p>
                <p>Reply to <a href="mailto:{request.requester_email}">{request.requester_email}</a> to follow up with them.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    New College Addition Request
    ============================
    
    College/University Name: {request.college_name}
    City: {request.city}
    State: {request.state}
    
    Requester Information:
    Name: {request.requester_name}
    Email: {request.requester_email}
    
    {f"Additional Information:\n{request.additional_info}\n" if request.additional_info else ""}
    
    Submitted: {datetime.now().strftime('%B %d, %Y at %I:%M %p IST')}
    
    ---
    Reply to {request.requester_email} to follow up.
    """
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SENDER_EMAIL
        message["To"] = RECIPIENT_EMAIL
        message["Reply-To"] = request.requester_email
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_body, "plain")
        part2 = MIMEText(html_body, "html")
        message.attach(part1)
        message.attach(part2)
        
        # Send email via Gmail SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, message.as_string())
            
        print(f"College request email sent successfully for: {request.college_name}")
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        # Don't raise exception - we still want to return success to user
        # Just log the request
        print(f"Logged college request: {request.dict()}")

@router.post("/request-college")
async def request_college(request: CollegeRequest):
    """
    Handle college addition request
    Sends email to ratemyprofgn@gmail.com
    """
    try:
        # Send email notification
        send_email(request)
        
        return {
            "success": True,
            "message": "College request submitted successfully. We'll review it and get back to you soon!"
        }
        
    except Exception as e:
        print(f"Error processing college request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to submit college request. Please try again or email us directly."
        )
