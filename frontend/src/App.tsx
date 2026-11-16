import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { RoleSwitcher, DEMO_USERS } from "./components/RoleSwitcher";
import { FoodDiscovery } from "./components/FoodDiscovery";
import { ReserveModal } from "./components/ReserveModal";
import { RecipientDashboard } from "./components/RecipientDashboard";
import { HotelDashboard } from "./components/HotelDashboard";
import { VolunteerDashboard } from "./components/VolunteerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ImpactReport } from "./components/ImpactReport";
import { SafetyGuidelinesModal } from "./components/SafetyGuidelinesModal";

import {
  User, FoodListing, Reservation, DeliveryTask, InAppNotification,
  Complaint, Business, HotelAnalytics, PlatformAnalytics, UserRole
} from "./types";
import { api } from "./api/client";
import { AlertCircle, X } from "lucide-react";

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("discover");
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Core Data States
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [volunteerTasks, setVolunteerTasks] = useState<DeliveryTask[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [hotelAnalytics, setHotelAnalytics] = useState<HotelAnalytics | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);

  // Modals
  const [selectedListingForReserve, setSelectedListingForReserve] = useState<FoodListing | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [complaintResId, setComplaintResId] = useState<string | null>(null);
  const [complaintType, setComplaintType] = useState("food_quality");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Auto-login default demo user (Recipient) on initial mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = api.getToken();
        if (stored) {
          const me = await api.getMe();
          setCurrentUser(me);
        } else {
          // Default to recipient Ravi
          const res = await api.login(DEMO_USERS[0].email, DEMO_USERS[0].password);
          setCurrentUser(res.user);
        }
      } catch (e) {
        // Fallback to login
        const res = await api.login(DEMO_USERS[0].email, DEMO_USERS[0].password);
        setCurrentUser(res.user);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Fetch data whenever user or filters change
  const refreshData = async () => {
    try {
      // 1. Food Listings (Public/All)
      const listData = await api.getListings(filters);
      setListings(listData);

      // 2. Notifications
      if (currentUser) {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      }

      // 3. Platform Analytics
      const pAnalytics = await api.getPlatformAnalytics();
      setPlatformAnalytics(pAnalytics);

      if (!currentUser) return;

      // Role specific loads
      if (currentUser.role === "recipient") {
        const myRes = await api.getMyReservations();
        setReservations(myRes);
      } else if (currentUser.role === "hotel_owner" || currentUser.role === "hotel_staff") {
        const myBiz = await api.getMyBusinesses();
        setBusinesses(myBiz);
        if (myBiz.length > 0) {
          const hAnalytics = await api.getBusinessAnalytics(myBiz[0].id);
          setHotelAnalytics(hAnalytics);
        }
        const incomingRes = await api.getMyReservations();
        setReservations(incomingRes);
      } else if (currentUser.role === "volunteer") {
        const vTasks = await api.getVolunteerTasks();
        setVolunteerTasks(vTasks);
      } else if (currentUser.role === "admin") {
        const allBiz = await api.getAdminBusinesses();
        setBusinesses(allBiz);
        const allVols = await api.getAdminVolunteers();
        setVolunteers(allVols);
        const allComps = await api.getComplaints();
        setComplaints(allComps);
        const logs = await api.getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error("Data refresh error:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
      // Set appropriate initial tab
      if (currentUser.role === "hotel_owner" || currentUser.role === "hotel_staff") {
        setActiveTab("listings");
      } else if (currentUser.role === "volunteer") {
        setActiveTab("tasks");
      } else if (currentUser.role === "admin") {
        setActiveTab("admin_overview");
      } else {
        setActiveTab("discover");
      }
    }
  }, [currentUser, filters]);

  // Handle Switch Role
  const handleSelectRole = async (role: UserRole, email: string, pwd: string) => {
    try {
      setLoading(true);
      const res = await api.login(email, pwd);
      setCurrentUser(res.user);
    } catch (e: any) {
      alert("Role switch failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  const handleFileComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintResId || !complaintDesc.trim()) return;
    try {
      setSubmittingComplaint(true);
      await api.fileComplaint(complaintResId, complaintType, complaintDesc.trim());
      alert("Complaint reported to platform safety team. We will inspect the issue.");
      setComplaintResId(null);
      setComplaintDesc("");
      refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to submit complaint.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      {/* 1. Instant Role Switcher for Reviewers/Evaluators */}
      <RoleSwitcher
        currentRole={currentUser?.role || "recipient"}
        currentEmail={currentUser?.email || ""}
        onSelectRole={handleSelectRole}
      />

      {/* 2. Top Navigation Bar */}
      <Navbar
        user={currentUser}
        notifications={notifications}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => {
          api.setToken(null);
          setCurrentUser(null);
        }}
        onOpenSafety={() => setShowSafetyModal(true)}
        onMarkNotificationRead={handleMarkNotificationRead}
      />

      {/* 3. Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin w-10 h-10 border-3 border-emerald-800 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-xs text-stone-500 font-medium">Authenticating & loading surplus ecosystem...</p>
          </div>
        ) : (
          <>
            {/* RECIPIENT WORKSPACE */}
            {activeTab === "discover" && (
              <FoodDiscovery
                listings={listings}
                loading={false}
                onSelectListing={(l) => setSelectedListingForReserve(l)}
                onSearchChange={(s) => setFilters((prev) => ({ ...prev, search: s }))}
                onFilterChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
              />
            )}

            {activeTab === "reservations" && (
              <RecipientDashboard
                reservations={reservations}
                onRefresh={refreshData}
                onOpenComplaintModal={(resId) => setComplaintResId(resId)}
              />
            )}

            {activeTab === "impact" && (
              <ImpactReport analytics={platformAnalytics} />
            )}

            {/* HOTEL OWNER / STAFF WORKSPACE */}
            {(activeTab === "listings" || activeTab === "verify_desk" || activeTab === "analytics" || activeTab === "staff") && (
              <HotelDashboard
                business={businesses[0] || null}
                listings={listings}
                reservations={reservations}
                analytics={hotelAnalytics}
                onRefresh={refreshData}
              />
            )}

            {/* VOLUNTEER WORKSPACE */}
            {(activeTab === "tasks" || activeTab === "active_run" || activeTab === "vol_impact") && (
              <VolunteerDashboard
                tasks={volunteerTasks}
                onRefresh={refreshData}
              />
            )}

            {/* ADMIN WORKSPACE */}
            {(activeTab.startsWith("admin_")) && (
              <AdminDashboard
                analytics={platformAnalytics}
                businesses={businesses}
                volunteers={volunteers}
                complaints={complaints}
                auditLogs={auditLogs}
                onRefresh={refreshData}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Reserve Modal */}
      {selectedListingForReserve && (
        <ReserveModal
          listing={selectedListingForReserve}
          onClose={() => setSelectedListingForReserve(null)}
          onSuccess={(res) => {
            setSelectedListingForReserve(null);
            refreshData();
            setActiveTab("reservations");
          }}
        />
      )}

      {/* 5. Food Safety Guidelines Modal */}
      {showSafetyModal && (
        <SafetyGuidelinesModal onClose={() => setShowSafetyModal(false)} />
      )}

      {/* 6. Complaint / Report Modal */}
      {complaintResId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative">
            <button
              onClick={() => setComplaintResId(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-stone-900 mb-1">
              Report Food Quality or Service Issue
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              All safety reports are investigated by platform administrators and logged in compliance audits.
            </p>

            <form onSubmit={handleFileComplaintSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Issue Category
                </label>
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                >
                  <option value="food_quality">Food Quality or Freshness</option>
                  <option value="hygiene">Packaging or Hygiene</option>
                  <option value="late_pickup">Late Handover at Counter</option>
                  <option value="unsafe_packaging">Damaged or Leaking Box</option>
                  <option value="otp_issue">OTP Verification Issue</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Describe what happened *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details about packaging condition, temperature, or handover time..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className="w-full text-xs p-3 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                disabled={submittingComplaint}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {submittingComplaint ? "Filing Report..." : "Submit Report to Platform Safety"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 mt-12 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium">
            <strong>ANNAPATH</strong> — India's Community Food Redistribution & Surplus Management Network
          </p>
          <div className="flex items-center gap-4 text-stone-400 text-[11px]">
            <span>FSSAI Compliant</span>
            <span>•</span>
            <span>Zero Landfill Mission</span>
            <span>•</span>
            <span>UNEP Benchmark</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
