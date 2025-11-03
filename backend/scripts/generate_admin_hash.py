"""
Generate hashed admin password for deployment.
Run this script locally to generate the ADMIN_PASSWORD_HASH environment variable.
"""
import sys
from passlib.context import CryptContext

# Same configuration as security.py
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    deprecated="auto",
    bcrypt__rounds=12,
    pbkdf2_sha256__rounds=100000
)

def generate_admin_password_hash(password: str) -> str:
    """Generate double-hashed password for admin."""
    return pwd_context.hash(password)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_admin_hash.py <password>")
        print("\nExample:")
        print("  python generate_admin_hash.py 'YourSecureP@ssw0rd!'")
        print("\nThen set the environment variable:")
        print("  ADMIN_PASSWORD_HASH='<generated_hash>'")
        sys.exit(1)
    
    password = sys.argv[1]
    
    # Validate password strength
    if len(password) < 12:
        print("❌ Password must be at least 12 characters!")
        sys.exit(1)
    
    if not any(c.isupper() for c in password):
        print("❌ Password must contain at least one uppercase letter!")
        sys.exit(1)
    
    if not any(c.islower() for c in password):
        print("❌ Password must contain at least one lowercase letter!")
        sys.exit(1)
    
    if not any(c.isdigit() for c in password):
        print("❌ Password must contain at least one digit!")
        sys.exit(1)
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        print("❌ Password must contain at least one special character!")
        sys.exit(1)
    
    print("✅ Generating double-hashed password...")
    hashed = generate_admin_password_hash(password)
    
    print("\n" + "="*80)
    print("🔐 ADMIN PASSWORD HASH GENERATED")
    print("="*80)
    print(f"\nAdd this to your environment variables:\n")
    print(f"ADMIN_PASSWORD_HASH='{hashed}'")
    print("\n" + "="*80)
    print("\n⚠️  IMPORTANT: Store this hash securely in:")
    print("  - Railway: Project Settings → Variables")
    print("  - Vercel: Project Settings → Environment Variables")
    print("  - Local: backend/.env file (DO NOT COMMIT!)")
    print("\n🔥 DELETE THIS OUTPUT after copying the hash!")
    print("="*80)
