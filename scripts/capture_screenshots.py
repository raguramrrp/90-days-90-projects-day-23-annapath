"""Capture comprehensive feature screenshots of ANNAPATH using headless browser."""

import os
import sys
import time
import socket
import threading
import subprocess
import urllib.request
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

SCREENSHOTS_DIR = ROOT_DIR / "screenshots"
SCREENSHOTS_DIR.mkdir(exist_ok=True)

CHROME_PATHS = [
    Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
    Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
]

BROWSER_EXE = None
for p in CHROME_PATHS:
    if p.exists():
        BROWSER_EXE = str(p)
        break

if not BROWSER_EXE:
    print("Error: No Chrome or Edge executable found.")
    sys.exit(1)

print(f"Using browser binary: {BROWSER_EXE}")


def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


# Relative paths for views
VIEW_DEFS = [
    {
        "filename": "01_recipient_food_discovery.png",
        "path": "/?role=recipient&tab=discover",
        "title": "Recipient - Food Discovery Feed",
    },
    {
        "filename": "02_recipient_reservations.png",
        "path": "/?role=recipient&tab=reservations",
        "title": "Recipient - My Reservations & OTPs",
    },
    {
        "filename": "03_platform_impact_report.png",
        "path": "/?role=recipient&tab=impact",
        "title": "Public - Platform Impact & Waste Diversion",
    },
    {
        "filename": "04_fssai_safety_guidelines.png",
        "path": "/?role=recipient&tab=discover&modal=safety",
        "title": "Compliance - FSSAI Food Safety Protocols",
    },
    {
        "filename": "05_hotel_owner_dashboard.png",
        "path": "/?role=hotel_owner&tab=listings",
        "title": "Hotel Owner - Surplus Food Listings Workspace",
    },
    {
        "filename": "06_hotel_counter_otp_desk.png",
        "path": "/?role=hotel_owner&tab=verify_desk",
        "title": "Hotel Staff - Counter OTP Verification Terminal",
    },
    {
        "filename": "07_hotel_impact_analytics.png",
        "path": "/?role=hotel_owner&tab=analytics",
        "title": "Hotel Owner - Waste Prevention & Impact Report",
    },
    {
        "filename": "08_hotel_staff_and_outlets.png",
        "path": "/?role=hotel_owner&tab=staff",
        "title": "Hotel Owner - Staff & Outlet Permissions",
    },
    {
        "filename": "09_volunteer_available_tasks.png",
        "path": "/?role=volunteer&tab=tasks",
        "title": "Volunteer - Available Delivery Tasks",
    },
    {
        "filename": "10_volunteer_active_run.png",
        "path": "/?role=volunteer&tab=active_run",
        "title": "Volunteer - Live Delivery Mission Stepper",
    },
    {
        "filename": "11_volunteer_impact.png",
        "path": "/?role=volunteer&tab=vol_impact",
        "title": "Volunteer - Contribution History & Impact",
    },
    {
        "filename": "12_admin_platform_overview.png",
        "path": "/?role=admin&tab=admin_overview",
        "title": "Admin - Governance & Platform Health KPIs",
    },
    {
        "filename": "13_admin_food_providers.png",
        "path": "/?role=admin&tab=admin_businesses",
        "title": "Admin - Food Provider Verification & Onboarding",
    },
    {
        "filename": "14_admin_volunteers.png",
        "path": "/?role=admin&tab=admin_volunteers",
        "title": "Admin - Volunteer Review & Authorizations",
    },
    {
        "filename": "15_admin_complaints_and_safety.png",
        "path": "/?role=admin&tab=admin_complaints",
        "title": "Admin - Food Safety & Complaint Investigations",
    },
    {
        "filename": "16_admin_audit_logs.png",
        "path": "/?role=admin&tab=admin_audit",
        "title": "Admin - Immutable System Audit Logs",
    },
]


def wait_for_server(port, timeout=20):
    url = f"http://127.0.0.1:{port}/api/health"
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.4)
    return False


def capture_all():
    import uvicorn
    from backend.app.main import app

    port = get_free_port()
    print(f"Allocated test server port: {port}")

    config = uvicorn.Config(app=app, host="127.0.0.1", port=port, log_level="warning")
    server = uvicorn.Server(config)
    server_thread = threading.Thread(target=server.run, daemon=True)
    server_thread.start()

    try:
        print(f"Waiting for server startup on http://127.0.0.1:{port}...")
        if not wait_for_server(port):
            print(f"Failed to reach server on http://127.0.0.1:{port}")
            return

        print("Server is UP. Capturing feature screenshots...\n")

        for idx, view in enumerate(VIEW_DEFS, 1):
            out_file = SCREENSHOTS_DIR / view["filename"]
            target_url = f"http://127.0.0.1:{port}{view['path']}"
            print(f"[{idx:02d}/{len(VIEW_DEFS):02d}] Capturing: {view['title']} -> {view['filename']}")

            cmd = [
                BROWSER_EXE,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                "--window-size=1280,860",
                "--virtual-time-budget=3000",
                f"--screenshot={str(out_file)}",
                target_url,
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(0.5)

        print(f"\nAll {len(VIEW_DEFS)} screenshots successfully captured into {SCREENSHOTS_DIR}")

    finally:
        print("Stopping server...")
        server.should_exit = True
        server_thread.join(timeout=3)


if __name__ == "__main__":
    capture_all()
