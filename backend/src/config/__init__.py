"""
Configuration package for RateMyProf backend.
"""
from .security import *

__all__ = [
    'ADMIN_USERNAME',
    'verify_admin_password',
    'hash_password',
    'verify_password',
    'SECRET_KEY',
    'ALGORITHM',
    'ACCESS_TOKEN_EXPIRE_MINUTES',
    'REFRESH_TOKEN_EXPIRE_DAYS',
    'ALLOWED_ORIGINS',
    'RATE_LIMIT_LOGIN_ATTEMPTS',
    'RATE_LIMIT_WINDOW_MINUTES',
    'SECURITY_HEADERS',
    'DOCS_ENABLED',
    'DOCS_ACCESS_TOKEN'
]
