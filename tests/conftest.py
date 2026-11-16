"""Pytest configuration and database fixtures for ANNAPATH."""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pytest
from backend.app.database import SessionLocal
from scripts.init_db import seed_database


@pytest.fixture(scope="session", autouse=True)
def init_test_data():
    """Ensure database has baseline seed data."""
    seed_database()


@pytest.fixture(scope="function")
def db():
    """Provide a database session for each test."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
