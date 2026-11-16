"""Analytics and impact schemas."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class HotelAnalyticsOut(BaseModel):
    business_id: str
    business_name: str
    total_listings: int
    total_portions_published: int
    portions_reserved: int
    portions_redistributed: int  # verified completed pickups/deliveries ONLY
    portions_expired_or_cancelled: int
    redistribution_rate_pct: float
    free_portions_redistributed: int
    nominal_paid_portions_redistributed: int
    direct_pickups_completed: int
    volunteer_deliveries_completed: int
    estimated_food_waste_avoided_kg: float
    estimated_co2e_avoided_kg: float
    daily_trend: List[Dict[str, Any]]


class VolunteerAnalyticsOut(BaseModel):
    volunteer_id: str
    total_deliveries_completed: int
    total_portions_delivered: int
    estimated_distance_covered_km: float
    recent_tasks: List[Dict[str, Any]]


class CityActivity(BaseModel):
    city: str
    listings_count: int
    portions_redistributed: int
    active_providers: int


class PlatformAnalyticsOut(BaseModel):
    total_providers_verified: int
    total_active_recipients: int
    total_volunteers_verified: int
    total_listings_published: int
    total_portions_published: int
    total_portions_reserved: int
    total_portions_redistributed: int
    overall_redistribution_efficiency_pct: float
    free_redistribution_count: int
    paid_redistribution_count: int
    total_kg_food_saved: float
    total_co2e_emissions_avoided_kg: float
    city_breakdown: List[CityActivity]
    category_breakdown: Dict[str, int]
    open_complaints_count: int
