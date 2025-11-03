"""
Security configuration for RateMyProf backend.
All sensitive credentials are loaded from environment variables.
"""
import os
from typing import List
import bcrypt

# Admin credentials from environment variables
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")  # Must be pre-hashed with bcrypt

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable must be set!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours default
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# CORS Configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://ratemyprof.me,https://www.ratemyprof.me,http://localhost:3000"
).split(",")

# Rate Limiting Configuration
RATE_LIMIT_LOGIN_ATTEMPTS = int(os.getenv("RATE_LIMIT_LOGIN_ATTEMPTS", "5"))
RATE_LIMIT_WINDOW_MINUTES = int(os.getenv("RATE_LIMIT_WINDOW_MINUTES", "15"))

# IP Banning Configuration (Smart Auto-Ban)
AUTO_BAN_ENABLED = os.getenv("AUTO_BAN_ENABLED", "true").lower() == "true"
BAN_THRESHOLD_FAILED_LOGINS = int(os.getenv("BAN_THRESHOLD_FAILED_LOGINS", "10"))  # 10 failed logins = ban
BAN_THRESHOLD_RAPID_REQUESTS = int(os.getenv("BAN_THRESHOLD_RAPID_REQUESTS", "100"))  # 100 requests/minute = ban
BAN_DURATION_MINUTES = int(os.getenv("BAN_DURATION_MINUTES", "60"))  # 1 hour default ban
REQUESTS_WINDOW_SECONDS = int(os.getenv("REQUESTS_WINDOW_SECONDS", "60"))  # Track requests per minute
WHITELIST_IPS = os.getenv("WHITELIST_IPS", "").split(",") if os.getenv("WHITELIST_IPS") else []

# Security Headers
SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
}

# API Documentation access
DOCS_ENABLED = os.getenv("DOCS_ENABLED", "false").lower() == "true"
DOCS_ACCESS_TOKEN = os.getenv("DOCS_ACCESS_TOKEN")  # Required to access /api-docs


def verify_admin_password(plain_password: str) -> bool:
    """
    Verify admin password using bcrypt hashing.
    
    Args:
        plain_password: Plain text password from login attempt
        
    Returns:
        bool: True if password matches, False otherwise
    """
    if not ADMIN_PASSWORD_HASH:
        raise ValueError("ADMIN_PASSWORD_HASH not configured!")
    
    return bcrypt.checkpw(plain_password.encode('utf-8'), ADMIN_PASSWORD_HASH.encode('utf-8'))


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt (12 rounds).
    
    Args:
        password: Plain text password
        
    Returns:
        str: Bcrypt hashed password
    """
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against bcrypt hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Bcrypt hashed password from database
        
    Returns:
        bool: True if password matches
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
