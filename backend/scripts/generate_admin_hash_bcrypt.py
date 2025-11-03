#!/usr/bin/env python3
"""
Generate bcrypt-hashed admin password for RateMyProf
Usage: python generate_admin_hash_bcrypt.py "YourSecurePassword"
"""
import sys
import re
import bcrypt


def validate_password_strength(password: str) -> tuple:
    """
    Validate password meets security requirements
    
    Args:
        password: Plain text password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    return True, ""


def generate_admin_password_hash(password: str) -> str:
    """
    Generate bcrypt hash for admin password
    
    Args:
        password: Plain text password
        
    Returns:
        Bcrypt hashed password
    """
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python generate_admin_hash_bcrypt.py \"YourSecurePassword\"")
        print("\nPassword Requirements:")
        print("  • Minimum 12 characters")
        print("  • At least 1 uppercase letter")
        print("  • At least 1 lowercase letter")
        print("  • At least 1 digit")
        print("  • At least 1 special character (!@#$%^&*)")
        sys.exit(1)
    
    password = sys.argv[1]
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        print(f"❌ Error: {error_msg}")
        sys.exit(1)
    
    # Generate hash
    print("✅ Generating bcrypt hash...")
    hashed = generate_admin_password_hash(password)
    
    print("\n" + "="*70)
    print("ADMIN PASSWORD HASH GENERATED")
    print("="*70)
    print(f"\nADMIN_PASSWORD_HASH={hashed}")
    print("\n" + "="*70)
    print("\n📋 Next Steps:")
    print("1. Copy the hash above")
    print("2. Add to backend/.env file:")
    print(f"   ADMIN_PASSWORD_HASH={hashed}")
    print("3. Set in Railway environment variables")
    print("4. NEVER commit the .env file to GitHub!")
    print("="*70)
