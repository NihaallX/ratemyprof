"""Vercel entry point for FastAPI backend.

This file serves as the entry point for Vercel serverless functions.
It imports the main FastAPI app and exposes it for Vercel.
"""
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Ensure Vercel environment variables are available
# Vercel doesn't use .env files, so skip dotenv loading
os.environ['SKIP_DOTENV'] = '1'

# Debug: Print environment to verify variables are loaded
print("=" * 60)
print("🔍 Vercel Environment Check:")
print(f"SUPABASE_URL: {'✅ Set' if os.getenv('SUPABASE_URL') else '❌ Missing'}")
print(f"JWT_SECRET_KEY: {'✅ Set' if os.getenv('JWT_SECRET_KEY') else '❌ Missing'}")
print(f"ALLOWED_ORIGINS: {os.getenv('ALLOWED_ORIGINS', 'Not set')}")
print("=" * 60)

try:
    from src.main import app
    
    # Health check for Vercel
    @app.get("/")
    async def root():
        return {"status": "ok", "message": "RateMyProf API is running on Vercel"}
    
    print("✅ FastAPI app loaded successfully for Vercel")
except Exception as e:
    print(f"❌ Error loading FastAPI app: {str(e)}")
    import traceback
    traceback.print_exc()
    # Create a minimal error app
    from fastapi import FastAPI
    app = FastAPI()
    
    @app.get("/")
    async def error():
        return {"error": str(e), "message": "Failed to load main app"}
    
    @app.get("/health")
    async def health():
        return {"status": "error", "details": str(e)}

# Export for Vercel ASGI
app = app
