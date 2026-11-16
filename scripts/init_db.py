"""Database initialization and realistic sample data seeding script for ANNAPATH."""

import os
import sys
from datetime import datetime, timezone, timedelta

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import engine, Base, SessionLocal
from backend.app.models.entities import (
    User, UserProfile, Business, BusinessStaff, VolunteerProfile, Organisation,
    FoodListing, Reservation, DeliveryTask, DeliveryAddress, Notification, Complaint,
    AuditLog, DistributionEvent
)
from backend.app.security import hash_password, generate_otp, hash_otp


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def seed_database():
    print("Initializing ANNAPATH database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    now = utc_now()
    today_deadline_1 = now + timedelta(hours=3, minutes=30)
    today_deadline_2 = now + timedelta(hours=5)
    today_deadline_3 = now + timedelta(hours=2)
    today_deadline_4 = now + timedelta(hours=6)

    print("Seeding multi-role users...")
    # 1. Admin
    admin_user = User(
        full_name="Platform Administrator",
        email="admin@annapath.org",
        phone="+919876500001",
        password_hash=hash_password("adminpassword123"),
        role="admin",
        account_status="verified",
        phone_verified=True,
    )
    admin_user.profile = UserProfile(preferred_language="en", city="Bengaluru")
    db.add(admin_user)

    # 2. Hotel Owner 1 (Bengaluru)
    owner_blr = User(
        full_name="Pooja Hegde",
        email="owner@demokitchen.org",
        phone="+919876500002",
        password_hash=hash_password("ownerpassword123"),
        role="hotel_owner",
        account_status="verified",
        phone_verified=True,
    )
    owner_blr.profile = UserProfile(preferred_language="en", city="Bengaluru")
    db.add(owner_blr)

    # 3. Hotel Owner 2 (Chennai)
    owner_chn = User(
        full_name="Suresh Raman",
        email="owner@coastalpalms.org",
        phone="+919876500003",
        password_hash=hash_password("ownerpassword123"),
        role="hotel_owner",
        account_status="verified",
        phone_verified=True,
    )
    owner_chn.profile = UserProfile(preferred_language="ta", city="Chennai")
    db.add(owner_chn)

    # 4. Hotel Staff (Bengaluru)
    staff_blr = User(
        full_name="Kiran Kumar",
        email="staff@demokitchen.org",
        phone="+919876500004",
        password_hash=hash_password("staffpassword123"),
        role="hotel_staff",
        account_status="verified",
        phone_verified=True,
    )
    staff_blr.profile = UserProfile(preferred_language="en", city="Bengaluru")
    db.add(staff_blr)

    # 5. Volunteer 1 (Bengaluru)
    vol_blr = User(
        full_name="Arun Swaminathan",
        email="volunteer@annapath.org",
        phone="+919876500005",
        password_hash=hash_password("volunteerpassword123"),
        role="volunteer",
        account_status="verified",
        phone_verified=True,
    )
    vol_blr.profile = UserProfile(preferred_language="en", city="Bengaluru")
    vol_blr.volunteer_profile = VolunteerProfile(
        verification_status="verified",
        service_radius_km=12.0,
        availability_status="available",
        preferred_service_area="Central Bengaluru / Indiranagar",
        vehicle_type="two_wheeler",
        total_deliveries_completed=14,
    )
    db.add(vol_blr)

    # 6. Recipient 1 (General Public)
    rec_ravi = User(
        full_name="Ravi Shankar",
        email="recipient@annapath.org",
        phone="+919876500006",
        password_hash=hash_password("recipientpassword123"),
        role="recipient",
        account_status="verified",
        phone_verified=True,
    )
    rec_ravi.profile = UserProfile(preferred_language="en", city="Bengaluru")
    db.add(rec_ravi)

    # 7. Organisation / NGO (Robin Hood Army Bangalore)
    ngo_user = User(
        full_name="Sneha Das (Robin Hood Army)",
        email="ngo@robinhoodarmy.org",
        phone="+919876500007",
        password_hash=hash_password("ngopassword123"),
        role="organisation",
        account_status="verified",
        phone_verified=True,
    )
    ngo_user.profile = UserProfile(preferred_language="en", city="Bengaluru")
    ngo_user.owned_organisations = [
        Organisation(
            organisation_name="Robin Hood Army Bengaluru Chapter",
            organisation_type="ngo",
            registration_number="RHA-KA-2021-884",
            address="14th Main, HAL 2nd Stage, Indiranagar",
            city="Bengaluru",
            verification_status="verified",
        )
    ]
    db.add(ngo_user)

    db.flush()

    print("Seeding verified food provider businesses...")
    # Business 1: Heritage Community Dining (Demo Outlet)
    biz_taj = Business(
        owner_user_id=owner_blr.id,
        business_name="Heritage Community Dining (Demo Outlet)",
        business_type="hotel",
        fssai_license_number="DEMO-FSSAI-0019283",
        registration_number="BLR-DEMO-2020-041",
        address="Community Zone 4, Sector 7",
        city="Bengaluru",
        latitude=12.9866,
        longitude=77.5833,
        contact_phone="+918066605660",
        operating_hours="07:00 AM - 11:30 PM",
        food_prep_storage_info="HACCP compliant blast chilling and steam warmers maintain >= 65°C hot holding.",
        supported_distribution_methods="both",
        verification_status="verified",
    )
    db.add(biz_taj)

    # Business 2: Coastal Palms Banquet Kitchen (Demo Outlet)
    biz_chola = Business(
        owner_user_id=owner_chn.id,
        business_name="Coastal Palms Banquet Kitchen (Demo Outlet)",
        business_type="hotel",
        fssai_license_number="DEMO-FSSAI-0028374",
        registration_number="CHN-DEMO-2018-912",
        address="South Metro Hub 12, Demo Area",
        city="Chennai",
        latitude=13.0105,
        longitude=80.2206,
        contact_phone="+914422200000",
        operating_hours="06:30 AM - 11:00 PM",
        food_prep_storage_info="FSSAI 5-star hygiene rating. Food sealed in insulated food-grade containers.",
        supported_distribution_methods="both",
        verification_status="verified",
    )
    db.add(biz_chola)

    # Business 3: Greenleaf Community Bakehouse (Demo Outlet)
    biz_bakery = Business(
        owner_user_id=owner_blr.id,
        business_name="Greenleaf Community Bakehouse (Demo Outlet)",
        business_type="bakery",
        fssai_license_number="DEMO-FSSAI-0037465",
        registration_number="BLR-DEMO-2022-105",
        address="East Community Center, Road 3",
        city="Bengaluru",
        latitude=12.9719,
        longitude=77.5996,
        contact_phone="+918041122334",
        operating_hours="08:00 AM - 09:30 PM",
        food_prep_storage_info="Freshly baked sourdough and bread loaves stored in moisture-controlled bins.",
        supported_distribution_methods="direct_pickup",
        verification_status="verified",
    )
    db.add(biz_bakery)

    db.flush()

    # Assign staff Kiran to Taj West End
    staff_assignment = BusinessStaff(
        business_id=biz_taj.id,
        user_id=staff_blr.id,
        permission_level="manager",
        status="active",
    )
    db.add(staff_assignment)

    print("Seeding surplus food listings...")
    # Listing 1: South Indian Executive Thali (Free, Bangalore)
    listing_thali = FoodListing(
        business_id=biz_taj.id,
        created_by=owner_blr.id,
        title="South Indian Executive Thali Meals (Surplus)",
        description="Freshly prepared lunch buffet thali meals including Sambar, Rasam, Poriyal, Curd Rice, Steamed Sona Masoori Rice, and Appalam. Hygienically packed in 3-compartment takeaway containers.",
        category="meals",
        food_type="vegetarian",
        quantity_available=28,
        quantity_reserved=4,
        quantity_distributed=18,
        portion_size="1 Meal Box (~500g)",
        unit="portions",
        price_type="free",
        price_per_unit=0.0,
        preparation_time=now - timedelta(hours=2),
        collection_start=now,
        collection_deadline=today_deadline_1,
        storage_conditions="hot_holding",
        allergen_information="Contains Dairy (Ghee, Curd). Nut-free, Gluten-free.",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=5,
        special_instructions="Counter collection at Kitchen Dispatch Gate 2. Please bring a cloth bag if collecting multiple portions.",
        image_url="https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_thali)

    # Listing 2: Sourdough Breads & Croissants (Nominal ₹15, Bangalore)
    listing_bread = FoodListing(
        business_id=biz_bakery.id,
        created_by=owner_blr.id,
        title="Artisanal French Baguettes & Sourdough Loaves",
        description="End-of-day surplus artisanal sourdough loaves, garlic baguettes, and butter croissants. Crispy crust and soft crumb, baked this morning.",
        category="bakery",
        food_type="vegetarian",
        quantity_available=16,
        quantity_reserved=2,
        quantity_distributed=12,
        portion_size="Pack of 2 Loaves",
        unit="packets",
        price_type="nominal",
        price_per_unit=15.0,
        preparation_time=now - timedelta(hours=6),
        collection_start=now,
        collection_deadline=today_deadline_2,
        storage_conditions="ambient",
        allergen_information="Contains Gluten, Dairy (Butter).",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=False,
        max_portions_per_recipient=4,
        special_instructions="Pickup at retail billing counter. Pay ₹15/pack at counter or exact change.",
        image_url="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_bread)

    # Listing 3: Royal Awadhi Dum Biryani (Nominal ₹25, Chennai)
    listing_biryani = FoodListing(
        business_id=biz_chola.id,
        created_by=owner_chn.id,
        title="Royal Awadhi Chicken Dum Biryani with Mirchi Salan",
        description="Premium long-grain Basmati rice dum-cooked with tender spiced chicken cuts, saffron, brown onions, and aromatic spices. Maintained at 68°C in insulated cambro containers.",
        category="meals",
        food_type="non_vegetarian",
        quantity_available=20,
        quantity_reserved=5,
        quantity_distributed=25,
        portion_size="1 Portion (~550g with Gravy)",
        unit="portions",
        price_type="nominal",
        price_per_unit=25.0,
        preparation_time=now - timedelta(hours=3),
        collection_start=now,
        collection_deadline=today_deadline_3,
        storage_conditions="hot_holding",
        allergen_information="Contains Dairy (Yogurt/Ghee). May contain traces of cashew nuts.",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=6,
        special_instructions="Collect from Banquet Service Entrance, Service Lift B.",
        image_url="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_biryani)

    # Listing 4: Dal Makhani & Jeera Rice Pots (Free, Bangalore)
    listing_dal = FoodListing(
        business_id=biz_taj.id,
        created_by=owner_blr.id,
        title="Slow-Cooked Dal Makhani & Fragrant Jeera Rice",
        description="Creamy 24-hour slow-cooked black lentils in rich tomato puree and butter, paired with cumin-tempered Basmati rice.",
        category="curries_gravy",
        food_type="vegetarian",
        quantity_available=15,
        quantity_reserved=0,
        quantity_distributed=10,
        portion_size="1 Meal Bowl (~450g)",
        unit="portions",
        price_type="free",
        price_per_unit=0.0,
        preparation_time=now - timedelta(hours=2, minutes=30),
        collection_start=now,
        collection_deadline=today_deadline_4,
        storage_conditions="hot_holding",
        allergen_information="Contains Dairy (Butter, Cream).",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=5,
        special_instructions="Available for both pickup and volunteer delivery.",
        image_url="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_dal)

    db.flush()

    print("Seeding sample active reservations and OTPs...")
    # Active Reservation 1: Direct Pickup by Ravi (Ready for pickup with OTP)
    otp1 = "842109"
    res1 = Reservation(
        listing_id=listing_thali.id,
        recipient_user_id=rec_ravi.id,
        quantity=2,
        price_per_unit_snapshot=0.0,
        total_price=0.0,
        distribution_method="direct_pickup",
        status="confirmed",
        pickup_otp_hash=hash_otp(otp1),
        pickup_otp_plain=otp1,
        created_at=now - timedelta(minutes=45),
    )
    db.add(res1)

    # Active Reservation 2: Volunteer Delivery for Ravi (Volunteer Arun assigned)
    otp2_p = "319452"
    otp2_d = "754210"
    res2 = Reservation(
        listing_id=listing_thali.id,
        recipient_user_id=rec_ravi.id,
        quantity=2,
        price_per_unit_snapshot=0.0,
        total_price=0.0,
        distribution_method="volunteer_delivery",
        status="confirmed",
        pickup_otp_hash=hash_otp(otp2_p),
        pickup_otp_plain=otp2_p,
        delivery_otp_hash=hash_otp(otp2_d),
        delivery_otp_plain=otp2_d,
        created_at=now - timedelta(minutes=25),
    )
    db.add(res2)

    # Historical Completed Reservation 1 (Direct Pickup)
    res_comp1 = Reservation(
        listing_id=listing_thali.id,
        recipient_user_id=rec_ravi.id,
        quantity=3,
        price_per_unit_snapshot=0.0,
        total_price=0.0,
        distribution_method="direct_pickup",
        status="collected",
        pickup_otp_hash=hash_otp("112233"),
        pickup_otp_plain="112233",
        created_at=now - timedelta(days=1, hours=2),
        completed_at=now - timedelta(days=1, hours=1),
    )
    db.add(res_comp1)

    # Historical Completed Reservation 2 (Volunteer Delivery)
    res_comp2 = Reservation(
        listing_id=listing_biryani.id,
        recipient_user_id=rec_ravi.id,
        quantity=4,
        price_per_unit_snapshot=25.0,
        total_price=100.0,
        distribution_method="volunteer_delivery",
        status="delivered",
        pickup_otp_hash=hash_otp("445566"),
        delivery_otp_hash=hash_otp("778899"),
        created_at=now - timedelta(days=2),
        completed_at=now - timedelta(days=2, hours=-1),
    )
    db.add(res_comp2)

    db.flush()

    res2_addr = DeliveryAddress(
        reservation_id=res2.id,
        recipient_user_id=rec_ravi.id,
        address_line="Community Support Desk, Ward 88, Bellandur",
        city="Bengaluru",
        latitude=12.9279,
        longitude=77.6718,
        access_instructions="Community desk handover. Contact recipient upon volunteer arrival.",
    )
    db.add(res2_addr)

    res2_task = DeliveryTask(
        reservation_id=res2.id,
        volunteer_user_id=vol_blr.id,
        pickup_status="pending",
        delivery_status="accepted",
        assigned_at=now - timedelta(minutes=15),
    )
    db.add(res2_task)

    # Seed 1 sample complaint for admin moderation
    sample_complaint = Complaint(
        reporter_user_id=rec_ravi.id,
        reservation_id=res_comp1.id,
        complaint_type="hygiene",
        description="Packaging container lid was slightly loose upon collection. Food was fresh and tasty, but requested hotel staff use double-sealed tape.",
        status="open",
        created_at=now - timedelta(hours=18),
    )
    db.add(sample_complaint)

    # Audit log
    audit_init = AuditLog(
        actor_user_id=admin_user.id,
        action="system_seed_data_initialized",
        entity_type="system",
        entity_id="init-seed-001",
        metadata_json='{"status": "success", "outlets": 3, "listings": 4}',
        created_at=now,
    )
    db.add(audit_init)

    db.commit()
    db.close()
    print("ANNAPATH database initialized and seeded successfully!")


if __name__ == "__main__":
    seed_database()
