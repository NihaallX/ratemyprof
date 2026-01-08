"""Vercel entry point for FastAPI backend.

This file serves as the entry point for Vercel serverless functions.
It imports the main FastAPI app and exposes it for Vercel.
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from src.main import app

# Vercel will call this handler
handler = app
