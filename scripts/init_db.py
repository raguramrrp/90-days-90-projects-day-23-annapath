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
    today_deadline_5 = now + timedelta(hours=4)
    today_deadline_6 = now + timedelta(hours=7)

    print("Seeding multi-role users...")
    # 1. Admin
    admin_user = User(
        full_name="Platform Administrator",
        email="admin@annapath.org",
        phone="+919000000001",
        password_hash=hash_password("adminpassword123"),
        role="admin",
        account_status="verified",
        phone_verified=True,
    )
    admin_user.profile = UserProfile(preferred_language="en", city="Bengaluru")
    db.add(admin_user)

    # 2. Hotel Owner 1 (Bengaluru)
    owner_blr = User(
        full_name="Ananya Deshmukh",
        email="ananya.deshmukh@annapath.org",
        phone="+919000000002",
        password_hash=hash_password("ownerpassword123"),
        role="hotel_owner",
        account_status="verified",
        phone_verified=True,
    )
    owner_blr.profile = UserProfile(preferred_language="en", city="Bengaluru")
    db.add(owner_blr)

    # 3. Hotel Owner 2 (Chennai)
    owner_chn = User(
        full_name="Vikramaditya Iyer",
        email="vikramaditya.iyer@coastalpalms.org",
        phone="+919000000003",
        password_hash=hash_password("ownerpassword123"),
        role="hotel_owner",
        account_status="verified",
        phone_verified=True,
    )
    owner_chn.profile = UserProfile(preferred_language="ta", city="Chennai")
    db.add(owner_chn)

    # 4. Hotel Staff (Bengaluru)
    staff_blr = User(
        full_name="Rohan Verma",
        email="rohan.verma@annapath.org",
        phone="+919000000004",
        password_hash=hash_password("staffpassword123"),
        role="hotel_staff",
        account_status="verified",
        phone_verified=True,
    )
    staff_blr.profile = UserProfile(preferred_language="en", city="Bengaluru")
    db.add(staff_blr)

    # 5. Volunteer 1 (Bengaluru)
    vol_blr = User(
        full_name="Karthik Sundaram",
        email="karthik.sundaram@annapath.org",
        phone="+919000000005",
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
        total_deliveries_completed=18,
    )
    db.add(vol_blr)

    # 6. Recipient 1 (General Public)
    rec_aditya = User(
        full_name="Aditya Varma",
        email="aditya.varma@annapath.org",
        phone="+919000000006",
        password_hash=hash_password("recipientpassword123"),
        role="recipient",
        account_status="verified",
        phone_verified=True,
    )
    rec_aditya.profile = UserProfile(preferred_language="en", city="Bengaluru")
    db.add(rec_aditya)

    # 7. Organisation / NGO (Seva Bhojan Community Trust)
    ngo_user = User(
        full_name="Sunita Menon (Seva Bhojan Foundation)",
        email="sunita.menon@sevabhojan.org",
        phone="+919000000007",
        password_hash=hash_password("ngopassword123"),
        role="organisation",
        account_status="verified",
        phone_verified=True,
    )
    ngo_user.profile = UserProfile(preferred_language="en", city="Bengaluru")
    ngo_user.owned_organisations = [
        Organisation(
            organisation_name="Seva Bhojan Community Trust",
            organisation_type="ngo",
            registration_number="SBT-KA-2021-419",
            address="Community Hall, 5th Cross, Indiranagar",
            city="Bengaluru",
            verification_status="verified",
        )
    ]
    db.add(ngo_user)

    db.flush()

    print("Seeding verified food provider businesses...")
    # Business 1: Heritage Bhavan Central Kitchen
    biz_heritage = Business(
        owner_user_id=owner_blr.id,
        business_name="Heritage Bhavan Central Kitchen",
        business_type="hotel",
        fssai_license_number="11223334001928",
        registration_number="KA-BLR-FSS-2020-041",
        address="42 Silver Oak Marg, Vasanth Nagar",
        city="Bengaluru",
        latitude=12.9866,
        longitude=77.5833,
        contact_phone="+919000000101",
        operating_hours="07:00 AM - 11:30 PM",
        food_prep_storage_info="HACCP compliant blast chilling and steam warmers maintain >= 65°C hot holding.",
        supported_distribution_methods="both",
        verification_status="verified",
    )
    db.add(biz_heritage)

    # Business 2: Coastal Palms Banquet Kitchen
    biz_coastal = Business(
        owner_user_id=owner_chn.id,
        business_name="Coastal Palms Banquet Kitchen",
        business_type="hotel",
        fssai_license_number="11223334002837",
        registration_number="TN-CHN-FSS-2018-912",
        address="77 Bayview Boulevard, Mylapore",
        city="Chennai",
        latitude=13.0105,
        longitude=80.2206,
        contact_phone="+919000000102",
        operating_hours="06:30 AM - 11:00 PM",
        food_prep_storage_info="FSSAI 5-star hygiene rating. Food sealed in insulated food-grade containers.",
        supported_distribution_methods="both",
        verification_status="verified",
    )
    db.add(biz_coastal)

    # Business 3: Greenleaf Artisanal Bakehouse
    biz_bakery = Business(
        owner_user_id=owner_blr.id,
        business_name="Greenleaf Artisanal Bakehouse",
        business_type="bakery",
        fssai_license_number="11223334003746",
        registration_number="KA-BLR-FSS-2022-105",
        address="15 Orchid Lane, Defense Colony, Indiranagar",
        city="Bengaluru",
        latitude=12.9719,
        longitude=77.5996,
        contact_phone="+919000000103",
        operating_hours="08:00 AM - 09:30 PM",
        food_prep_storage_info="Freshly baked sourdough and bread loaves stored in moisture-controlled bins.",
        supported_distribution_methods="direct_pickup",
        verification_status="verified",
    )
    db.add(biz_bakery)

    # Business 4: Annapurna Satvik Community Kitchen
    biz_annapurna = Business(
        owner_user_id=owner_blr.id,
        business_name="Annapurna Satvik Community Kitchen",
        business_type="restaurant",
        fssai_license_number="11223334004812",
        registration_number="KA-BLR-FSS-2021-314",
        address="83 Blossom Avenue, 4th Block, Jayanagar",
        city="Bengaluru",
        latitude=12.9250,
        longitude=77.5838,
        contact_phone="+919000000104",
        operating_hours="06:30 AM - 10:30 PM",
        food_prep_storage_info="Pure vegetarian facility. Traditional steam vessels and hot holding cabinets maintain >= 65°C.",
        supported_distribution_methods="both",
        verification_status="verified",
    )
    db.add(biz_annapurna)

    # Business 5: Udupi Sri Krishna Prasada Nilayam
    biz_udupi = Business(
        owner_user_id=owner_blr.id,
        business_name="Udupi Sri Krishna Prasada Nilayam",
        business_type="restaurant",
        fssai_license_number="11223334005923",
        registration_number="KA-BLR-FSS-2023-559",
        address="19 Temple View Lane, Malleshwaram",
        city="Bengaluru",
        latitude=13.0031,
        longitude=77.5706,
        contact_phone="+919000000105",
        operating_hours="06:00 AM - 10:00 PM",
        food_prep_storage_info="Strict satvik South Indian vegetarian kitchen. Food temperature verified with digital thermometers.",
        supported_distribution_methods="both",
        verification_status="verified",
    )
    db.add(biz_udupi)

    # Business 6: Madhuram Sweets & Tiffin Centre
    biz_madhuram = Business(
        owner_user_id=owner_chn.id,
        business_name="Madhuram Sweets & Tiffin Centre",
        business_type="catering",
        fssai_license_number="11223334006154",
        registration_number="TN-CHN-FSS-2022-771",
        address="61 Weavers Colony Road, T. Nagar",
        city="Chennai",
        latitude=13.0418,
        longitude=80.2337,
        contact_phone="+919000000106",
        operating_hours="07:00 AM - 10:30 PM",
        food_prep_storage_info="Ghee-based sweets and savory snacks stored in climate-controlled transparent display cabinets.",
        supported_distribution_methods="both",
        verification_status="verified",
    )
    db.add(biz_madhuram)

    # Business 7: Navratna Pure Veg Banquet Kitchen
    biz_navratna = Business(
        owner_user_id=owner_blr.id,
        business_name="Navratna Pure Veg Banquet Kitchen",
        business_type="hotel",
        fssai_license_number="11223334007291",
        registration_number="KA-BLR-FSS-2024-882",
        address="104 Emerald Crest, Outer Ring Road, Bellandur",
        city="Bengaluru",
        latitude=12.9352,
        longitude=77.6772,
        contact_phone="+919000000107",
        operating_hours="07:00 AM - 11:00 PM",
        food_prep_storage_info="State-of-the-art commercial banquet kitchen with walk-in chillers and insulated stainless transport cambros.",
        supported_distribution_methods="both",
        verification_status="verified",
    )
    db.add(biz_navratna)

    db.flush()

    # Assign staff Rohan to Heritage Bhavan Central Kitchen
    staff_assignment = BusinessStaff(
        business_id=biz_heritage.id,
        user_id=staff_blr.id,
        permission_level="manager",
        status="active",
    )
    db.add(staff_assignment)

    print("Seeding surplus food listings...")
    # Listing 1: South Indian Executive Thali (Free, Bangalore)
    listing_thali = FoodListing(
        business_id=biz_heritage.id,
        created_by=owner_blr.id,
        title="South Indian Executive Thali Meals (Surplus)",
        description="Freshly prepared lunch buffet thali meals including Sambar, Rasam, Poriyal, Curd Rice, Steamed Sona Masoori Rice, and Appalam. Hygienically packed in 3-compartment takeaway containers.",
        category="meals",
        food_type="vegetarian",
        quantity_available=32,
        quantity_reserved=4,
        quantity_distributed=20,
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

    # Listing 2: Steamed Idli & Crispy Medu Vada Combo (Free, Bangalore)
    listing_idli = FoodListing(
        business_id=biz_udupi.id,
        created_by=owner_blr.id,
        title="Steamed Idli & Crispy Medu Vada Combo with Coconut Chutney",
        description="Piping hot, fluffy steamed rice idlis and golden crispy lentil medu vadas, served with freshly ground coconut chutney and drumstick sambar. Surplus breakfast batch packed in eco-friendly meal boxes.",
        category="breakfast",
        food_type="vegetarian",
        quantity_available=25,
        quantity_reserved=2,
        quantity_distributed=15,
        portion_size="Box of 4 Idlis + 2 Vadas with Sambar & Chutney",
        unit="boxes",
        price_type="free",
        price_per_unit=0.0,
        preparation_time=now - timedelta(hours=1, minutes=30),
        collection_start=now,
        collection_deadline=today_deadline_5,
        storage_conditions="hot_holding",
        allergen_information="Gluten-free, Nut-free, Vegan.",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=4,
        special_instructions="Counter collection at Malleshwaram kitchen dispatch desk.",
        image_url="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_idli)

    # Listing 3: Shahi Paneer Butter Masala with Tandoori Rotis (Nominal ₹20, Bangalore)
    listing_paneer = FoodListing(
        business_id=biz_navratna.id,
        created_by=owner_blr.id,
        title="Shahi Paneer Butter Masala with Tandoori Butter Rotis",
        description="Tender fresh cottage cheese cubes simmered in a velvety, rich tomato, butter, and cashew gravy infused with kasuri methi. Accompanied by 3 freshly rolled tandoori butter rotis.",
        category="curries_gravy",
        food_type="vegetarian",
        quantity_available=22,
        quantity_reserved=3,
        quantity_distributed=16,
        portion_size="1 Box (450g Paneer Butter Masala + 3 Tandoori Rotis)",
        unit="portions",
        price_type="nominal",
        price_per_unit=20.0,
        preparation_time=now - timedelta(hours=2),
        collection_start=now,
        collection_deadline=today_deadline_2,
        storage_conditions="hot_holding",
        allergen_information="Contains Dairy (Paneer, Butter, Cream), Tree Nuts (Cashew).",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=4,
        special_instructions="Banquet Dispatch Counter near West Gate. Nominal contribution covers eco-packaging.",
        image_url="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_paneer)

    # Listing 4: Hyderabadi Veg Dum Biryani (Free, Bangalore)
    listing_vegbiryani = FoodListing(
        business_id=biz_annapurna.id,
        created_by=owner_blr.id,
        title="Hyderabadi Veg Dum Biryani with Fresh Vegetable Raita",
        description="Aromatic aged Basmati rice dum-cooked with garden vegetables, saffron milk, caramelized shallots, mint, and whole roasted spices in sealed handis. Maintained at 68°C in insulated warmers.",
        category="meals",
        food_type="vegetarian",
        quantity_available=30,
        quantity_reserved=5,
        quantity_distributed=24,
        portion_size="1 Meal Box (~500g with Raita & Mirchi Ka Salan)",
        unit="portions",
        price_type="free",
        price_per_unit=0.0,
        preparation_time=now - timedelta(hours=2, minutes=15),
        collection_start=now,
        collection_deadline=today_deadline_1,
        storage_conditions="hot_holding",
        allergen_information="Contains Dairy (Ghee, Curd). Gluten-free.",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=5,
        special_instructions="Handover at Jayanagar Community Gate 1. Available for both pickup and volunteer delivery.",
        image_url="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_vegbiryani)

    # Listing 5: Karnataka Bisi Bele Bath (Free, Bangalore)
    listing_bisibele = FoodListing(
        business_id=biz_udupi.id,
        created_by=owner_blr.id,
        title="Karnataka Bisi Bele Bath with Spiced Boondi & Potato Chips",
        description="Traditional Karnataka spicy lentil-rice dish cooked with toor dal, mixed country vegetables, tamarind, nutmeg, and aromatic Bisi Bele Bath powder, tempered in pure desi ghee with crunchy cashews.",
        category="meals",
        food_type="vegetarian",
        quantity_available=20,
        quantity_reserved=0,
        quantity_distributed=14,
        portion_size="1 Meal Bowl (~450g with Boondi packet)",
        unit="portions",
        price_type="free",
        price_per_unit=0.0,
        preparation_time=now - timedelta(hours=1, minutes=45),
        collection_start=now,
        collection_deadline=today_deadline_3,
        storage_conditions="hot_holding",
        allergen_information="Contains Dairy (Desi Ghee), Tree Nuts (Cashews). Gluten-free.",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=5,
        special_instructions="Piping hot. Collect from Malleshwaram kitchen counter.",
        image_url="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_bisibele)

    # Listing 6: Crispy Masala Dosa with Sambar (Nominal ₹15, Bangalore)
    listing_dosa = FoodListing(
        business_id=biz_heritage.id,
        created_by=owner_blr.id,
        title="Golden Crispy Masala Dosa with Drumstick Sambar & Chutney",
        description="Crispy golden fermented rice-lentil crepes filled with spiced onion-potato palya, served with steaming hot vegetable drumstick sambar and fresh coconut chutney.",
        category="breakfast",
        food_type="vegetarian",
        quantity_available=18,
        quantity_reserved=2,
        quantity_distributed=10,
        portion_size="Set of 2 Stuffed Masala Dosas with Sambar",
        unit="portions",
        price_type="nominal",
        price_per_unit=15.0,
        preparation_time=now - timedelta(hours=1),
        collection_start=now,
        collection_deadline=today_deadline_5,
        storage_conditions="hot_holding",
        allergen_information="Contains Mustard seeds. Gluten-free, Vegan-friendly.",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=False,
        max_portions_per_recipient=4,
        special_instructions="Collect from Heritage Bhavan Kitchen Dispatch Gate 2.",
        image_url="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_dosa)

    # Listing 7: Amritsari Chole Kulche (Nominal ₹20, Bangalore)
    listing_chole = FoodListing(
        business_id=biz_navratna.id,
        created_by=owner_blr.id,
        title="Amritsari Chole Kulche with Pickled Green Chillies & Onions",
        description="Authentic dark Amritsari chickpea curry simmered in tea-infused broth, pomegranate seed powder, and freshly roasted garam masala. Paired with soft tandoor-baked kulchas and house-pickled onions.",
        category="meals",
        food_type="vegetarian",
        quantity_available=24,
        quantity_reserved=4,
        quantity_distributed=18,
        portion_size="2 Soft Tandoori Kulchas + 350ml Chole Masala Bowl",
        unit="portions",
        price_type="nominal",
        price_per_unit=20.0,
        preparation_time=now - timedelta(hours=2, minutes=30),
        collection_start=now,
        collection_deadline=today_deadline_2,
        storage_conditions="hot_holding",
        allergen_information="Contains Gluten (Wheat Kulcha). Vegan.",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=5,
        special_instructions="Collect at Bellandur Banquet Entrance.",
        image_url="https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_chole)

    # Listing 8: Warm Gulab Jamun & Moong Dal Halwa (Free, Chennai)
    listing_sweets = FoodListing(
        business_id=biz_madhuram.id,
        created_by=owner_chn.id,
        title="Warm Gulab Jamun & Moong Dal Halwa Sweet Box",
        description="Golden melt-in-mouth milk-solid dumplings soaked in rose and green cardamom syrup, paired with rich roasted lentils halwa garnished with slivered almonds and pistachios.",
        category="desserts",
        food_type="vegetarian",
        quantity_available=20,
        quantity_reserved=2,
        quantity_distributed=16,
        portion_size="Sweet Box (4 Khoya Gulab Jamuns + 150g Moong Dal Halwa)",
        unit="boxes",
        price_type="free",
        price_per_unit=0.0,
        preparation_time=now - timedelta(hours=3),
        collection_start=now,
        collection_deadline=today_deadline_6,
        storage_conditions="ambient",
        allergen_information="Contains Dairy (Khoya, Ghee), Gluten, Tree Nuts (Almonds, Pistachios).",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=True,
        max_portions_per_recipient=4,
        special_instructions="Surplus sweet batch. Collect from Madhuram front counter.",
        image_url="https://images.unsplash.com/photo-1589301773859-f8319f3949f2?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_sweets)

    # Listing 9: Fresh Baked Golden Veg Puffs & Samosas (Free, Bangalore)
    listing_puffs = FoodListing(
        business_id=biz_bakery.id,
        created_by=owner_blr.id,
        title="Fresh Baked Golden Veg Puff Pastries & Cocktail Samosas",
        description="Flaky multi-layered puff pastry filled with curried spiced potatoes, peas, and carrots, paired with crispy Punjabi cocktail samosas and tangy tamarind dip.",
        category="snacks",
        food_type="vegetarian",
        quantity_available=18,
        quantity_reserved=1,
        quantity_distributed=14,
        portion_size="Pack of 3 Veg Puffs + 3 Cocktail Samosas",
        unit="packets",
        price_type="free",
        price_per_unit=0.0,
        preparation_time=now - timedelta(hours=2),
        collection_start=now,
        collection_deadline=today_deadline_2,
        storage_conditions="ambient",
        allergen_information="Contains Gluten (Wheat flour). Dairy-free.",
        fssai_safety_declaration=True,
        pickup_enabled=True,
        delivery_enabled=False,
        max_portions_per_recipient=4,
        special_instructions="Collect at Indiranagar retail counter before 9 PM.",
        image_url="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
        status="published",
    )
    db.add(listing_puffs)

    # Listing 10: Artisanal Sourdough & French Baguettes (Nominal ₹15, Bangalore)
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

    # Listing 11: Slow-Cooked Dal Makhani & Jeera Rice (Free, Bangalore)
    listing_dal = FoodListing(
        business_id=biz_annapurna.id,
        created_by=owner_blr.id,
        title="Slow-Cooked Dal Makhani & Fragrant Jeera Rice Bowls",
        description="Creamy 24-hour slow-cooked black lentils in rich tomato puree and butter, paired with cumin-tempered Basmati rice.",
        category="curries_gravy",
        food_type="vegetarian",
        quantity_available=25,
        quantity_reserved=3,
        quantity_distributed=18,
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

    # Listing 12: Royal Awadhi Dum Biryani (Nominal ₹25, Chennai)
    listing_biryani = FoodListing(
        business_id=biz_coastal.id,
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

    db.flush()

    print("Seeding active reservations and OTPs...")
    # Active Reservation 1: Direct Pickup by Aditya (Ready for pickup with OTP)
    otp1 = "842109"
    res1 = Reservation(
        listing_id=listing_thali.id,
        recipient_user_id=rec_aditya.id,
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

    # Active Reservation 2: Volunteer Delivery for Aditya (Volunteer Karthik assigned)
    otp2_p = "319452"
    otp2_d = "754210"
    res2 = Reservation(
        listing_id=listing_vegbiryani.id,
        recipient_user_id=rec_aditya.id,
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
        recipient_user_id=rec_aditya.id,
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
        recipient_user_id=rec_aditya.id,
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
        recipient_user_id=rec_aditya.id,
        address_line="Civic Center Handover Desk, Ward 88, Bellandur",
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

    # Seed 1 complaint for admin moderation
    complaint_1 = Complaint(
        reporter_user_id=rec_aditya.id,
        reservation_id=res_comp1.id,
        complaint_type="hygiene",
        description="Packaging container lid was slightly loose upon collection. Food was fresh and tasty, but requested kitchen staff use double-sealed tape.",
        status="open",
        created_at=now - timedelta(hours=18),
    )
    db.add(complaint_1)

    # Audit log
    audit_init = AuditLog(
        actor_user_id=admin_user.id,
        action="system_verified_providers_initialized",
        entity_type="system",
        entity_id="fssai-audit-001",
        metadata_json='{"status": "success", "outlets": 7, "listings": 12}',
        created_at=now,
    )
    db.add(audit_init)

    db.commit()
    db.close()
    print("ANNAPATH database initialized and seeded successfully with 7 partner kitchens and 12 surplus listings!")


if __name__ == "__main__":
    seed_database()
