#!/usr/bin/env python3
"""
Generate bcrypt-hashed admin password for RateMyProf

SECURITY NOTICE: 
This script accepts password input to prevent exposure in shell history.

Usage: 
  python generate_admin_hash_bcrypt.py
  (You'll be prompted to enter password securely)
  
Legacy usage (NOT RECOMMENDED - exposes password in shell history):
  python generate_admin_hash_bcrypt.py "YourSecurePassword"
"""
import sys
import re
import bcrypt
import getpass


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
    # Check if password provided as argument (legacy, less secure)
    if len(sys.argv) > 2:
        print("❌ Error: Too many arguments")
        print("\n⚠️  SECURITY WARNING: Passing passwords as command-line arguments")
        print("   exposes them in shell history and process listings.")
        print("\nRecommended usage:")
        print("  python generate_admin_hash_bcrypt.py")
        print("  (You'll be prompted to enter password securely)")
        sys.exit(1)
    
    if len(sys.argv) == 2:
        print("\n⚠️  SECURITY WARNING:")
        print("   You're passing the password as a command-line argument.")
        print("   This exposes it in your shell history and process listings.")
        print("   Consider running without arguments for secure input.\n")
        password = sys.argv[1]
    else:
        # Secure method: Use getpass to hide password input
        print("Password Requirements:")
        print("  • Minimum 12 characters")
        print("  • At least 1 uppercase letter")
        print("  • At least 1 lowercase letter")
        print("  • At least 1 digit")
        print("  • At least 1 special character (!@#$%^&*)\n")
        
        try:
            password = getpass.getpass("Enter admin password: ")
            password_confirm = getpass.getpass("Confirm password: ")
            
            if password != password_confirm:
                print("❌ Error: Passwords do not match")
                sys.exit(1)
        except KeyboardInterrupt:
            print("\n\n❌ Operation cancelled")
            sys.exit(1)
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        # Security: Don't log the actual password or password details that might expose it
        print(f"❌ Password validation failed: {error_msg}")
        # Clear password from memory
        password = None
        sys.exit(1)
    
    # Generate hash
    print("✅ Generating bcrypt hash...")
    hashed = generate_admin_password_hash(password)
    
    # Security: Clear password from memory immediately after use
    password = None
    
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
