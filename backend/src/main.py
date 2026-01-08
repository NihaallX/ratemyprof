"""Main FastAPI application for RateMyProf backend.

This module sets up the FastAPI application with all routes, middleware,
and database configuration for the RateMyProf India platform.

Updated: Fixed TrustedHostMiddleware to allow ratemyprof.me domain.
"""
import os
import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware import Middleware
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware
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
from src.api.notifications import router as notifications_router  # Updated to new unified system
from src.routers.settings import router as settings_router
from src.routers.request_college import router as request_college_router
from src.config.security import ALLOWED_ORIGINS, SECURITY_HEADERS, DOCS_ENABLED, AUTO_BAN_ENABLED
from src.middleware.ip_ban import ip_ban_middleware, cleanup_task, ip_ban_manager


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value
        
        # Add cache-control headers for static content
        # Cache API responses for 5 minutes (300 seconds)
        if request.url.path.startswith('/api/'):
            # Cache GET requests only
            if request.method == "GET":
                # Long cache for static data (colleges, professors)
                if any(path in request.url.path for path in ['/colleges', '/professors']):
                    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=600"
                # Short cache for dynamic data (reviews, stats)
                elif any(path in request.url.path for path in ['/reviews', '/stats', '/notifications']):
                    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
                # No cache for auth/admin endpoints
                elif any(path in request.url.path for path in ['/auth', '/admin', '/moderation']):
                    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
                else:
                    # Default: 5 minute cache
                    response.headers["Cache-Control"] = "public, max-age=300"
        
        return response


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager.
    
    Handles startup and shutdown events for the FastAPI application.
    Initializes Supabase connection and performs cleanup.
    """
    # Startup
    print("🚀 Starting RateMyProf API server v1.0.2...")
    await init_db()
    print("✅ Supabase connection initialized")
    
    # Start IP ban cleanup background task
    if AUTO_BAN_ENABLED:
        print("✅ IP ban system enabled - starting cleanup task")
        cleanup_job = asyncio.create_task(cleanup_task())
    
    yield
    
    # Shutdown
    print("🛑 Shutting down RateMyProf API server...")
    if AUTO_BAN_ENABLED:
        cleanup_job.cancel()
    await close_db()
    print("✅ Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="RateMyProf India API",
    description="Backend API for the RateMyProf India platform - helping students find and review professors across Indian colleges and universities.",
    version="1.0.2",
    docs_url="/docs" if DOCS_ENABLED else None,
    redoc_url="/redoc" if DOCS_ENABLED else None,
    lifespan=lifespan,
)

# Security headers middleware (applied first)
app.add_middleware(SecurityHeadersMiddleware)

# IP Ban middleware (blocks banned IPs before any processing)
if AUTO_BAN_ENABLED:
    app.middleware("http")(ip_ban_middleware)
    print("✅ IP ban middleware enabled")

# CORS middleware - Configure to allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=3600,
)

print(f"✅ CORS middleware active with {len(ALLOWED_ORIGINS)} allowed origins")


# Add explicit OPTIONS handler for all routes
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle OPTIONS requests for CORS preflight."""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600",
        }
    )


# Global exception handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors and return 422 status with detailed info."""
    error_details = []
    for error in exc.errors():
        field = error.get('loc', ['unknown'])[-1]
        message = error.get('msg', 'Validation error')
        error_type = error.get('type', '')
        
        # Create detailed error message
        field_error = f"{field}: {message}"
        
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
            error_details.append(field_error)  # Include field name in error
    
    # Also log the full error for debugging
    print(f"❌ Validation Error on {request.url.path}: {exc.errors()}")
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "; ".join(error_details),
            "details": exc.errors() if os.getenv("ENVIRONMENT") != "production" else None
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


# CORS Debug endpoint - helps troubleshoot CORS issues
@app.get("/cors-check", tags=["Debug"], include_in_schema=False)
async def cors_check(request: Request):
    """Check CORS configuration and request origin."""
    origin = request.headers.get("origin", "No origin header")
    return {
        "your_origin": origin,
        "allowed_origins": ALLOWED_ORIGINS,
        "is_allowed": origin in ALLOWED_ORIGINS,
        "cors_enabled": True
    }


# Health check endpoint - Internal use only (for Railway monitoring)
@app.get("/health", tags=["Health"], include_in_schema=False)
async def health_check(request: Request):
    """Health check endpoint for monitoring and load balancers.
    
    This endpoint should only be accessed by Railway's internal monitoring.
    Public access returns minimal information.
    """
    # Check if request is from Railway or internal monitoring
    user_agent = request.headers.get("user-agent", "").lower()
    is_internal = any(agent in user_agent for agent in ["railway", "kuma", "uptimerobot", "pingdom"])
    
    if not is_internal and os.getenv("ENVIRONMENT") == "production":
        # Return minimal info for public access
        return {"status": "ok"}
    
    # Full health info for internal monitoring
    return {
        "status": "healthy",
        "service": "RateMyProf India API",
        "version": "1.0.1",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


# Root endpoint - Minimal info
@app.get("/", tags=["Root"], include_in_schema=False)
async def root():
    """Root endpoint - Returns minimal API information."""
    base_url = "https://ratemyprof-backend.onrender.com" if os.getenv("ENVIRONMENT") == "production" else "http://localhost:8000"
    
    return {
        "service": "RateMyProf India API",
        "version": "1.0.1",
        "status": "operational",
        "api_base": f"{base_url}/v1",
        "documentation": "Contact admin for API documentation"
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

app.include_router(
    settings_router,
    prefix="/v1/settings",
    tags=["Settings"]
)

app.include_router(
    settings_router,
    prefix="/api/settings",
    tags=["Settings (Legacy)"]
)

app.include_router(
    request_college_router,
    prefix="/api",
    tags=["College Requests"]
)


# Landing Page Stats Endpoint
@app.get("/api/stats")
async def get_stats():
    """Get platform statistics for landing page."""
    from src.lib.database import supabase
    
    try:
        # Get counts from database
        professors_count = supabase.table('professors').select('id', count='exact').execute()
        reviews_count = supabase.table('reviews').select('id', count='exact').execute()
        colleges_count = supabase.table('colleges').select('id', count='exact').execute()
        
        return {
            "professors": professors_count.count or 0,
            "reviews": reviews_count.count or 0,
            "colleges": colleges_count.count or 0
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        # Return fallback data
        return {
            "professors": 10000,
            "reviews": 250000,
            "colleges": 500
        }


# Development server
if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True if os.getenv("ENVIRONMENT") == "development" else False,
        log_level="info",
    )

