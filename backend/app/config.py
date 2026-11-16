"""Configuration settings for ANNAPATH."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings:
    PROJECT_NAME: str = "ANNAPATH"
    VERSION: str = "1.0.0"
    TAGLINE: str = "Good food deserves another destination."
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "annapath-surplus-redistribution-secret-key-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/annapath.db")
    
    # Food Safety Defaults (FSSAI aligned)
    STRICT_FOOD_SAFETY_CHECK: bool = True
    DEFAULT_MAX_RESERVATION_PORTIONS: int = 10
    DEFAULT_CURRENCY: str = "INR"
    
    # Emissions factor: ~2.5 kg CO2e saved per kg food waste avoided (FAO/UNEP benchmark)
    CO2E_PER_KG_FOOD: float = 2.5
    # Average meal weight in kg for surplus portions
    AVERAGE_MEAL_WEIGHT_KG: float = 0.45
    BASE_DIR: Path = BASE_DIR


settings = Settings()
