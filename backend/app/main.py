"""ANNAPATH - Community Food Redistribution & Surplus Management Platform.
Main FastAPI application entrypoint.
"""

import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.services.listing_service import auto_expire_listings

# API Routers
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.businesses import router as businesses_router
from backend.app.api.v1.listings import router as listings_router
from backend.app.api.v1.reservations import router as reservations_router
from backend.app.api.v1.volunteers import router as volunteers_router
from backend.app.api.v1.admin import router as admin_router
from backend.app.api.v1.notifications import router as notifications_router

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ANNAPATH",
    description="Community Food Redistribution & Surplus Management Platform. Good food deserves another destination.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for development and local host
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_v1 = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=api_v1)
app.include_router(businesses_router, prefix=api_v1)
app.include_router(listings_router, prefix=api_v1)
app.include_router(reservations_router, prefix=api_v1)
app.include_router(volunteers_router, prefix=api_v1)
app.include_router(admin_router, prefix=api_v1)
app.include_router(notifications_router, prefix=api_v1)


@app.on_event("startup")
def startup_event():
    """Run database health check and auto-expire stale listings on boot."""
    db = SessionLocal()
    try:
        auto_expire_listings(db)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": "ANNAPATH",
        "version": "1.0.0",
        "market": "India",
        "tagline": "Good food deserves another destination.",
    }


# Frontend SPA static mount
FRONTEND_DIST = settings.BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Don't intercept API or docs routes
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "app": "ANNAPATH API",
            "tagline": "Good food deserves another destination.",
            "docs": "/docs",
            "frontend_status": "Run 'npm run build' in frontend directory to build the unified web dashboard.",
        }
