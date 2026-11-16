export type UserRole = "recipient" | "hotel_owner" | "hotel_staff" | "volunteer" | "organisation" | "admin";

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  account_status: string;
  phone_verified: boolean;
  city?: string;
  preferred_language?: string;
  created_at: string;
}

export interface Business {
  id: string;
  owner_user_id: string;
  business_name: string;
  business_type: string;
  fssai_license_number?: string;
  registration_number?: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  operating_hours: string;
  food_prep_storage_info?: string;
  supported_distribution_methods: string;
  verification_status: string;
  created_at: string;
}

export interface BusinessStaff {
  id: string;
  business_id: string;
  user_id: string;
  full_name: string;
  email: string;
  permission_level: string;
  status: string;
  invited_at: string;
}

export interface FoodListing {
  id: string;
  business_id: string;
  business?: Business;
  created_by: string;
  title: string;
  description: string;
  category: string;
  food_type: "vegetarian" | "non_vegetarian" | "vegan" | "contain_egg";
  quantity_available: number;
  quantity_reserved: number;
  quantity_distributed: number;
  portion_size: string;
  unit: string;
  price_type: "free" | "nominal";
  price_per_unit: number;
  preparation_time: string;
  collection_start: string;
  collection_deadline: string;
  storage_conditions: string;
  allergen_information: string;
  fssai_safety_declaration: boolean;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  max_portions_per_recipient: number;
  special_instructions?: string;
  image_url?: string;
  status: string;
  created_at: string;
  distance_km?: number;
}

export interface Reservation {
  id: string;
  listing_id: string;
  recipient_user_id: string;
  recipient_name?: string;
  recipient_phone?: string;
  organisation_id?: string;
  listing_title?: string;
  business_name?: string;
  business_address?: string;
  quantity: number;
  price_per_unit_snapshot: number;
  total_price: number;
  distribution_method: "direct_pickup" | "volunteer_delivery";
  status: "pending_approval" | "confirmed" | "ready_for_pickup" | "collected" | "out_for_delivery" | "delivered" | "rejected" | "cancelled" | "expired";
  pickup_otp_plain?: string;
  delivery_otp_plain?: string;
  created_at: string;
  completed_at?: string;
}

export interface DeliveryTask {
  id: string;
  reservation_id: string;
  volunteer_user_id?: string;
  pickup_status: string;
  delivery_status: "available" | "accepted" | "en_route" | "delivered" | "failed" | "cancelled";
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  food_title?: string;
  quantity?: number;
  pickup_business_name?: string;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  delivery_address?: string;
  delivery_city?: string;
  recipient_name?: string;
  recipient_phone?: string;
  access_instructions?: string;
}

export interface InAppNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  read_at?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  reporter_user_id: string;
  reporter_name?: string;
  reservation_id: string;
  complaint_type: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  resolution_notes?: string;
  created_at: string;
}

export interface HotelAnalytics {
  business_id: string;
  business_name: string;
  total_listings: number;
  total_portions_published: number;
  portions_reserved: number;
  portions_redistributed: number;
  portions_expired_or_cancelled: number;
  redistribution_rate_pct: number;
  free_portions_redistributed: number;
  nominal_paid_portions_redistributed: number;
  direct_pickups_completed: number;
  volunteer_deliveries_completed: number;
  estimated_food_waste_avoided_kg: number;
  estimated_co2e_avoided_kg: number;
  daily_trend: Array<{ day: string; portions: number }>;
}

export interface PlatformAnalytics {
  total_providers_verified: number;
  total_active_recipients: number;
  total_volunteers_verified: number;
  total_listings_published: number;
  total_portions_published: number;
  total_portions_reserved: number;
  total_portions_redistributed: number;
  overall_redistribution_efficiency_pct: number;
  free_redistribution_count: number;
  paid_redistribution_count: number;
  total_kg_food_saved: number;
  total_co2e_emissions_avoided_kg: number;
  city_breakdown: Array<{
    city: string;
    listings_count: number;
    portions_redistributed: number;
    active_providers: number;
  }>;
  category_breakdown: Record<string, number>;
  open_complaints_count: number;
}
