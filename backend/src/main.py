"""Main FastAPI application for RateMyProf backend.

This module sets up the FastAPI application with all routes, middleware,
and database configuration for the RateMyProf India platform.
"""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import uvicorn

from src.lib.database import init_db, close_db
from src.api.professors_simple import router as professors_router  # Using simplified version
from src.api.reviews import router as reviews_router
from src.api.auth import router as auth_router
from src.api.colleges import router as colleges_router
from src.api.college_reviews import router as college_reviews_router
from src.api.moderation import router as moderation_router
from src.api.user_limits import router as user_limits_router
from src.api.college_review_moderation import router as college_review_moderation_router
from src.routers.notifications import router as notifications_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager.
    
    Handles startup and shutdown events for the FastAPI application.
    Initializes Supabase connection and performs cleanup.
    """
    # Startup
    print("🚀 Starting RateMyProf API server...")
    await init_db()
    print("✅ Supabase connection initialized")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down RateMyProf API server...")
    await close_db()
    print("✅ Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="RateMyProf India API",
    description="Backend API for the RateMyProf India platform - helping students find and review professors across Indian colleges and universities.",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
    lifespan=lifespan,
)

# CORS middleware - Allow all origins temporarily for debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins to debug CORS issue
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Trusted host middleware for production
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "api.ratemyprof-india.com",
            "*.railway.app",  # Railway deployment
            "*.render.com",   # Render deployment
            "ratemyprof.me",  # Production frontend domain
            "www.ratemyprof.me",  # Production with www
        ]
    )


# Global exception handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors and return 400 status."""
    error_details = []
    for error in exc.errors():
        field = error.get('loc', ['unknown'])[-1]
        message = error.get('msg', 'Validation error')
        
        if field == 'email':
            error_details.append("Invalid email format")
        elif field == 'password':
            if 'at least 8 characters' in message:
                error_details.append("Password must be at least 8 characters long")
            else:
                error_details.append(message)
        elif field == 'name':
            error_details.append(message)
        elif field == 'college_id':
            error_details.append(message)
        else:
            error_details.append(message)
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "; ".join(error_details)
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent error format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,  # Make error message the content
            "status_code": exc.status_code,
            "path": str(request.url.path),
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    # Log the error in production
    print(f"Unexpected error: {exc}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error",
            "status_code": 500,
            "path": str(request.url.path),
        }
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "service": "RateMyProf India API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to RateMyProf India API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "health_url": "/health",
    }


# Include all routers with v1 prefix
app.include_router(
    auth_router,
    prefix="/v1/auth",
    tags=["Authentication"]
)

# Add backward compatibility routes without v1 prefix
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication (Legacy)"]
)

app.include_router(
    professors_router,
    prefix="/v1/professors",
    tags=["Professors"]
)

app.include_router(
    professors_router,
    prefix="/api/professors",
    tags=["Professors (Legacy)"]
)

app.include_router(
    reviews_router,
    prefix="/v1/reviews",
    tags=["Reviews"]
)

app.include_router(
    reviews_router,
    prefix="/api/reviews",
    tags=["Reviews (Legacy)"]
)

app.include_router(
    colleges_router,
    prefix="/v1/colleges",
    tags=["Colleges"]
)

app.include_router(
    colleges_router,
    prefix="/api/colleges",
    tags=["Colleges (Legacy)"]
)

app.include_router(
    college_reviews_router,
    prefix="/v1/college-reviews",
    tags=["College Reviews"]
)

app.include_router(
    college_reviews_router,
    prefix="/api/college-reviews",
    tags=["College Reviews (Legacy)"]
)

app.include_router(
    moderation_router,
    prefix="/v1/moderation",
    tags=["Moderation"]
)

app.include_router(
    moderation_router,
    prefix="/api/moderation",
    tags=["Moderation (Legacy)"]
)

app.include_router(
    user_limits_router,
    prefix="/v1/user",
    tags=["User Limits"]
)

app.include_router(
    user_limits_router,
    prefix="/api/user",
    tags=["User Limits (Legacy)"]
)

app.include_router(
    notifications_router,
    prefix="/v1/notifications",
    tags=["Notifications"]
)

app.include_router(
    notifications_router,
    prefix="/api/notifications",
    tags=["Notifications (Legacy)"]
)

app.include_router(
    college_review_moderation_router,
    prefix="/v1/college-review-moderation",
    tags=["College Review Moderation"]
)

app.include_router(
    college_review_moderation_router,
    prefix="/api/college-review-moderation",
    tags=["College Review Moderation (Legacy)"]
)


# Development server
if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True if os.getenv("ENVIRONMENT") == "development" else False,
        log_level="info",
    )

