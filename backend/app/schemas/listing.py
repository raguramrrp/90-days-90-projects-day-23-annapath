"""Food listing schemas."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, model_validator, ConfigDict


class FoodListingCreate(BaseModel):
    business_id: str
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    category: str = Field(..., description="meals, bakery, curries_gravy, rice_breads, snacks, desserts, produce, packaged_items")
    food_type: str = Field(..., description="vegetarian, non_vegetarian, vegan, contain_egg")
    quantity_available: int = Field(..., gt=0, description="Available portions")
    portion_size: Optional[str] = "1 Plate (~450g)"
    unit: Optional[str] = "portions"
    price_type: str = Field("free", description="free or nominal")
    price_per_unit: float = Field(0.0, ge=0.0)
    preparation_time: datetime
    collection_start: datetime
    collection_deadline: datetime
    storage_conditions: str = Field("hot_holding", description="hot_holding, chilled, ambient")
    allergen_information: Optional[str] = "None specified"
    fssai_safety_declaration: bool = Field(True, description="Confirmation that food complies with safety and hygienic storage")
    pickup_enabled: bool = True
    delivery_enabled: bool = True
    max_portions_per_recipient: int = Field(5, gt=0)
    special_instructions: Optional[str] = None
    image_url: Optional[str] = None

    @model_validator(mode="after")
    def validate_pricing_and_dates(self):
        if self.price_type == "free" and self.price_per_unit != 0.0:
            self.price_per_unit = 0.0
        if self.price_type == "nominal" and self.price_per_unit <= 0.0:
            raise ValueError("Nominal price listings must have a price_per_unit greater than 0")
        if self.collection_deadline <= self.collection_start:
            raise ValueError("Collection deadline must be after collection start time")
        if not self.fssai_safety_declaration:
            raise ValueError("Provider must confirm FSSAI safety suitability declaration to publish surplus food")
        return self


class FoodListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    food_type: Optional[str] = None
    quantity_available: Optional[int] = None
    portion_size: Optional[str] = None
    unit: Optional[str] = None
    price_type: Optional[str] = None
    price_per_unit: Optional[float] = None
    collection_start: Optional[datetime] = None
    collection_deadline: Optional[datetime] = None
    storage_conditions: Optional[str] = None
    allergen_information: Optional[str] = None
    pickup_enabled: Optional[bool] = None
    delivery_enabled: Optional[bool] = None
    max_portions_per_recipient: Optional[int] = None
    special_instructions: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None


class BusinessBrief(BaseModel):
    id: str
    business_name: str
    business_type: str
    address: str
    city: str
    latitude: float
    longitude: float
    contact_phone: str
    verification_status: str

    model_config = ConfigDict(from_attributes=True)


class FoodListingOut(BaseModel):
    id: str
    business_id: str
    business: Optional[BusinessBrief] = None
    created_by: str
    title: str
    description: str
    category: str
    food_type: str
    quantity_available: int
    quantity_reserved: int
    quantity_distributed: int
    portion_size: str
    unit: str
    price_type: str
    price_per_unit: float
    preparation_time: datetime
    collection_start: datetime
    collection_deadline: datetime
    storage_conditions: str
    allergen_information: str
    fssai_safety_declaration: bool
    pickup_enabled: bool
    delivery_enabled: bool
    max_portions_per_recipient: int
    special_instructions: Optional[str]
    image_url: Optional[str]
    status: str
    created_at: datetime
    distance_km: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
