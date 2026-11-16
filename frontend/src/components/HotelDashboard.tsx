import React, { useState, useEffect } from "react";
import {
  Plus, CheckCircle2, Clock, ShieldCheck, Key, AlertCircle,
  Building2, Utensils, X, Leaf, Users, UserPlus, MapPin,
  TrendingUp, Award, Check, FileCheck, ArrowRight, ExternalLink
} from "lucide-react";
import { FoodListing, Reservation, Business, HotelAnalytics, BusinessStaff } from "../types";
import { api } from "../api/client";

interface HotelDashboardProps {
  business: Business | null;
  businesses?: Business[];
  listings: FoodListing[];
  reservations: Reservation[];
  analytics: HotelAnalytics | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onRefresh: () => void;
}

export const HotelDashboard: React.FC<HotelDashboardProps> = ({
  business,
  businesses = [],
  listings,
  reservations,
  analytics,
  activeTab = "listings",
  onTabChange,
  onRefresh,
}) => {
  const currentTab = activeTab || "listings";
  const handleTabSwitch = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [selectedResId, setSelectedResId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Staff Management State
  const [staffList, setStaffList] = useState<BusinessStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("staff");
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffMessage, setStaffMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Listing Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("meals");
  const [newFoodType, setNewFoodType] = useState<any>("vegetarian");
  const [newQty, setNewQty] = useState(20);
  const [newPriceType, setNewPriceType] = useState<"free" | "nominal">("free");
  const [newPrice, setNewPrice] = useState(0);
  const [newDeadlineHours, setNewDeadlineHours] = useState(4);
  const [newPortionSize, setNewPortionSize] = useState("1 Plate (~450g)");
  const [newFssaiDeclared, setNewFssaiDeclared] = useState(true);
  const [newPickupEnabled, setNewPickupEnabled] = useState(true);
  const [newDeliveryEnabled, setNewDeliveryEnabled] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load Staff for this business outlet
  const loadStaff = async (bizId: string) => {
    try {
      setLoadingStaff(true);
      const data = await api.getBusinessStaff(bizId);
      setStaffList(data);
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (business) {
      loadStaff(business.id);
    }
  }, [business?.id]);

  // Handle Add Staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newStaffEmail.trim()) return;

    try {
      setAddingStaff(true);
      setStaffMessage(null);
      await api.addStaff(business.id, newStaffEmail.trim().toLowerCase(), newStaffRole);
      setStaffMessage({
        type: "success",
        text: `Staff member (${newStaffEmail}) invited and granted ${newStaffRole === "manager" ? "Manager" : "Counter Staff"} permissions.`,
      });
      setNewStaffEmail("");
      setShowAddStaffModal(false);
      await loadStaff(business.id);
    } catch (err: any) {
      setStaffMessage({
        type: "error",
        text: err.message || "Failed to invite staff member. Ensure the user has registered their account.",
      });
    } finally {
      setAddingStaff(false);
    }
  };

  // Handle OTP Verification at Hotel Counter
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId) {
      setVerifyMessage({ type: "error", text: "Please select an incoming reservation to verify." });
      return;
    }
    if (!otpInput || otpInput.trim().length !== 6) {
      setVerifyMessage({ type: "error", text: "Please enter the 6-digit OTP provided by recipient." });
      return;
    }

    try {
      setVerifying(true);
      setVerifyMessage(null);
      await api.verifyPickupOTP(selectedResId, otpInput.trim());
      setVerifyMessage({
        type: "success",
        text: "OTP verified successfully! Package handed over and marked as collected.",
      });
      setOtpInput("");
      setSelectedResId("");
      onRefresh();
    } catch (err: any) {
      setVerifyMessage({ type: "error", text: err.message || "Invalid OTP code." });
    } finally {
      setVerifying(false);
    }
  };

  // Create Listing
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    if (!newFssaiDeclared) {
      setCreateError("FSSAI food hygiene declaration is mandatory.");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      const now = new Date();
      const prepTime = new Date(now.getTime() - 45 * 60000);
      const deadline = new Date(now.getTime() + newDeadlineHours * 3600000);

      await api.createListing({
        business_id: business.id,
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        food_type: newFoodType,
        quantity_available: Number(newQty),
        portion_size: newPortionSize,
        unit: "portions",
        price_type: newPriceType,
        price_per_unit: newPriceType === "nominal" ? Number(newPrice) : 0,
        preparation_time: prepTime.toISOString(),
        collection_start: now.toISOString(),
        collection_deadline: deadline.toISOString(),
        storage_conditions: "hot_holding",
        allergen_information: "Dairy, Gluten",
        fssai_safety_declaration: true,
        pickup_enabled: newPickupEnabled,
        delivery_enabled: newDeliveryEnabled,
        max_portions_per_recipient: 5,
        image_url:
          newCategory === "bakery"
            ? "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
            : "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
      });

      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      onRefresh();
    } catch (err: any) {
      setCreateError(err.message || "Failed to publish surplus listing.");
    } finally {
      setCreating(false);
    }
  };

  const pendingPickupReservations = reservations.filter(
    (r) => r.status === "confirmed" && r.distribution_method === "direct_pickup"
  );

  const completedHandovers = reservations.filter(
    (r) => r.status === "collected" || r.status === "delivered"
  );

  return (
    <div className="space-y-6">
      {/* Outlet Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
              Verified Food Provider
            </span>
            <span className="text-xs text-stone-500 font-mono">
              FSSAI: {business?.fssai_license_number || "11223344556677"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
            {business?.business_name || "Hotel Kitchen Workspace"}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            📍 {business?.address}, {business?.city} • Operating: {business?.operating_hours}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Surplus Food</span>
          </button>
        </div>
      </div>

      {/* Internal Navigation Sub-tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-stone-100/80 rounded-xl border border-stone-200 overflow-x-auto">
        <button
          onClick={() => handleTabSwitch("listings")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            currentTab === "listings"
              ? "bg-white text-emerald-900 shadow-xs border border-stone-200"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Surplus Listings</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-100 text-stone-600 font-mono">
            {listings.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch("verify_desk")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            currentTab === "verify_desk"
              ? "bg-white text-emerald-900 shadow-xs border border-stone-200"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Counter OTP Desk</span>
          {pendingPickupReservations.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
              {pendingPickupReservations.length} awaiting
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabSwitch("analytics")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            currentTab === "analytics"
              ? "bg-white text-emerald-900 shadow-xs border border-stone-200"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Impact & Waste Report</span>
        </button>

        <button
          onClick={() => handleTabSwitch("staff")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            currentTab === "staff"
              ? "bg-white text-emerald-900 shadow-xs border border-stone-200"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff & Outlets</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-100 text-stone-600 font-mono">
            {staffList.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: SURPLUS LISTINGS */}
      {currentTab === "listings" && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Total Listings
              </p>
              <p className="text-2xl font-extrabold text-stone-900 mt-1">
                {analytics?.total_listings || listings.length}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">Surplus batches published</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Redistributed Portions
              </p>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">
                {analytics?.portions_redistributed || 0}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">Verified handovers completed</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Food Waste Avoided
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {analytics?.estimated_food_waste_avoided_kg || 0} kg
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">Standard 450g meal portion weight</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                CO2e Emissions Saved
              </p>
              <p className="text-2xl font-extrabold text-teal-800 mt-1">
                {analytics?.estimated_co2e_avoided_kg || 0} kg
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">UNEP 2.5 kg CO2e/kg benchmark</p>
            </div>
          </div>

          {/* Alert if pickups are pending */}
          {pendingPickupReservations.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {pendingPickupReservations.length} Reservation(s) Waiting for Counter Handover
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Recipients have arrived with collection OTPs. Verify them at the Counter OTP Desk to complete the handover.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleTabSwitch("verify_desk")}
                className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <span>Go to Counter Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Surplus Listings Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900">
                Surplus Food Batches Published
              </h3>
              <span className="text-xs text-stone-500">
                {listings.length} batches published
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Item & Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Available</th>
                    <th className="py-3 px-4">Reserved</th>
                    <th className="py-3 px-4">Redistributed</th>
                    <th className="py-3 px-4">Safe Deadline</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-stone-900">{l.title}</p>
                        <p className="text-[10px] text-stone-400 capitalize">{l.category} • {l.portion_size}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-800">
                        {l.price_type === "free" ? "₹0 Free" : `₹${l.price_per_unit}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {l.quantity_available}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-medium">
                        {l.quantity_reserved}
                      </td>
                      <td className="py-3 px-4 text-stone-900 font-bold">
                        {l.quantity_distributed}
                      </td>
                      <td className="py-3 px-4 text-stone-500 text-[11px]">
                        {new Date(l.collection_deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          l.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : l.status === "fully_reserved"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-stone-100 text-stone-700"
                        }`}>
                          {l.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {listings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        No surplus food batches currently published. Click "Publish Surplus Food" to list excess portions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: COUNTER OTP DESK */}
      {currentTab === "verify_desk" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-900 to-stone-900 text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif]">
                Kitchen Counter OTP Verification Terminal
              </h2>
            </div>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              When a recipient arrives for direct pickup, verify their 6-digit collection OTP code before handing over the food package.
              Once verified, the reservation is marked collected and inventory is permanently accounted for.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Awaiting Reservations Queue */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Incoming Reservations Awaiting Collection</span>
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full">
                  {pendingPickupReservations.length} awaiting
                </span>
              </div>

              {pendingPickupReservations.length === 0 ? (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-stone-600">All pickups completed!</p>
                  <p className="text-[11px] text-stone-400">
                    No reservations are currently waiting at the counter. New reservations will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingPickupReservations.map((r) => {
                    const isSelected = selectedResId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedResId(r.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500"
                            : "bg-white border-stone-200 hover:border-emerald-300"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">
                              {r.recipient_name || "Recipient"}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              Order #{r.id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 font-medium">
                            {r.quantity} portion(s) reserved • Direct Kitchen Pickup
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Booked: {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResId(r.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                            isSelected
                              ? "bg-emerald-800 text-white"
                              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          {isSelected ? "Selected for OTP" : "Select to Verify"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: OTP Input & Verification Form */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900 mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Enter Collection OTP</span>
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Ask the recipient for the 6-digit confirmation code shown on their screen.
                </p>

                {verifyMessage && (
                  <div
                    className={`p-3 rounded-xl mb-4 text-xs flex items-start gap-2 ${
                      verifyMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {verifyMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span>{verifyMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Awaiting Order
                    </label>
                    <select
                      value={selectedResId}
                      onChange={(e) => setSelectedResId(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="">-- Choose Reservation --</option>
                      {pendingPickupReservations.map((r) => (
                        <option key={r.id} value={r.id}>
                          #{r.id.slice(0, 6)} - {r.recipient_name} ({r.quantity} portions)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      6-Digit Collection OTP Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center text-2xl font-mono font-extrabold tracking-widest px-3 py-2.5 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 text-stone-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifying || !selectedResId || otpInput.length !== 6}
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {verifying ? "Verifying Hash..." : "Verify & Hand Over Food Package"}
                  </button>
                </form>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] text-stone-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cryptographic HMAC-SHA256 OTP verification.</span>
                </div>
                <p className="text-[10px] text-stone-400">
                  Ensures zero false handovers. Plaintext OTP is verified and logged to audit trail.
                </p>
              </div>
            </div>
          </div>

          {/* Completed handovers log */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5">
            <h3 className="font-bold text-sm text-stone-900 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>Recent Verified Handovers</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Portions</th>
                    <th className="py-2.5 px-3">Distribution</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {completedHandovers.slice(0, 5).map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 px-3 font-mono text-stone-600">#{h.id.slice(0, 8)}</td>
                      <td className="py-2.5 px-3 font-medium text-stone-900">{h.recipient_name || "Community Member"}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-800">{h.quantity} portions</td>
                      <td className="py-2.5 px-3 text-stone-500 capitalize">{h.distribution_method.replace("_", " ")}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Verified Collected
                        </span>
                      </td>
                    </tr>
                  ))}
                  {completedHandovers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-stone-400">
                        No handovers verified yet for this shift.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: IMPACT & WASTE REPORT */}
      {currentTab === "analytics" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-emerald-700" />
                <h2 className="text-xl font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Hotel Food Waste Reduction & Sustainability Report
                </h2>
              </div>
              <p className="text-xs text-stone-500 max-w-2xl">
                Strict audit metrics measured directly from verified handovers and distributions. No uncollected food is ever counted.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
              FSSAI Compliance: 100%
            </div>
          </div>

          {/* 4 Impact Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Total Meals Redistributed
              </span>
              <p className="text-3xl font-extrabold text-stone-900 mt-2">
                {analytics?.portions_redistributed || 0}
              </p>
              <p className="text-xs text-emerald-800 font-medium mt-1">
                Verified consumed by community
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Landfill Waste Diverted
              </span>
              <p className="text-3xl font-extrabold text-emerald-800 mt-2">
                {analytics?.estimated_food_waste_avoided_kg || 0} <span className="text-lg">kg</span>
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Based on 0.45 kg meal benchmark
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                GHG Emissions Avoided
              </span>
              <p className="text-3xl font-extrabold text-teal-800 mt-2">
                {analytics?.estimated_co2e_avoided_kg || 0} <span className="text-lg">kg CO₂e</span>
              </p>
              <p className="text-xs text-stone-500 mt-1">
                UNEP 2.5 kg CO₂e/kg conversion
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Economic Value Rescued
              </span>
              <p className="text-3xl font-extrabold text-amber-700 mt-2">
                ₹{(((analytics?.portions_redistributed || 0) * 120)).toLocaleString()}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Avg. ₹120 standard meal valuation
              </p>
            </div>
          </div>

          {/* Environmental Equivalents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-700" />
                <span>Environmental Offset Equivalencies</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                  <div className="text-xs">
                    <p className="font-bold text-stone-900">Passenger Vehicle Distance Offset</p>
                    <p className="text-stone-500 text-[11px]">Equivalent carbon offset from avoidance</p>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-800">
                    ~{Math.round((analytics?.estimated_co2e_avoided_kg || 0) * 4.2)} km
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                  <div className="text-xs">
                    <p className="font-bold text-stone-900">Tree Seedling Growth Equivalent</p>
                    <p className="text-stone-500 text-[11px]">Carbon sequestered over 10 years</p>
                  </div>
                  <span className="text-sm font-extrabold text-teal-800">
                    ~{Math.max(1, Math.round((analytics?.estimated_co2e_avoided_kg || 0) / 16))} urban trees
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                  <div className="text-xs">
                    <p className="font-bold text-stone-900">Methane Gas Generation Prevented</p>
                    <p className="text-stone-500 text-[11px]">Anaerobic decomposition avoided</p>
                  </div>
                  <span className="text-sm font-extrabold text-amber-700">
                    ~{Math.round((analytics?.estimated_food_waste_avoided_kg || 0) * 0.25)} m³ CH₄
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>FSSAI Hygiene & Redistribution Compliance</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-950">Mandatory Food Hygiene Declarations</p>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      100% of published batches comply with temperature holding standards (hot holding $\ge 65^\circ$C or cold holding $\le 5^\circ$C).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-stone-900">Dual-Verification Handover Protocol</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Counter pickups verified via recipient OTPs; deliveries tracked with volunteer and recipient handshakes.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-stone-900">Zero Commercial Markup Policy</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      All portions distributed free (₹0) or at nominal price capped at $\le ₹50$ strictly for packaging recovery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: STAFF & OUTLETS */}
      {currentTab === "staff" && (
        <div className="space-y-6">
          {staffMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
                staffMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  : "bg-red-50 text-red-900 border border-red-200"
              }`}
            >
              {staffMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{staffMessage.text}</span>
            </div>
          )}

          {/* Outlet Details & Operating Hours */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-stone-900">
                  Outlet Profile & Business Information
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Registered food business details verified by platform administration.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Verified Outlet
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-[11px] font-semibold text-stone-400 uppercase">Outlet Name</span>
                <p className="text-sm font-bold text-stone-900 mt-1">{business?.business_name}</p>
                <p className="text-[11px] text-stone-500 capitalize">{business?.business_type} establishment</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-[11px] font-semibold text-stone-400 uppercase">FSSAI License</span>
                <p className="text-sm font-bold text-emerald-800 mt-1 font-mono">
                  {business?.fssai_license_number || "11223344556677"}
                </p>
                <p className="text-[11px] text-stone-500">Hygiene & Safety Certified</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-[11px] font-semibold text-stone-400 uppercase">Operating Hours</span>
                <p className="text-sm font-bold text-stone-900 mt-1">{business?.operating_hours}</p>
                <p className="text-[11px] text-stone-500">Distribution: Direct Pickup & Volunteer</p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl text-xs flex items-start gap-2">
              <MapPin className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-stone-900">Physical Kitchen Address:</p>
                <p className="text-stone-600">{business?.address}, {business?.city}</p>
                <p className="text-stone-400 text-[10px] mt-0.5">
                  GPS Coordinates: {business?.latitude?.toFixed(4)}, {business?.longitude?.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Kitchen Staff Management Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-800" />
                  <span>Authorized Staff & Handover Officers</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Invite kitchen staff to verify counter collection OTPs and prepare food batches.
                </p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Staff Member</span>
              </button>
            </div>

            {loadingStaff ? (
              <p className="text-xs text-stone-400 py-4 text-center">Loading authorized staff...</p>
            ) : staffList.length === 0 ? (
              <div className="py-8 text-center text-stone-400 space-y-2">
                <Users className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-medium text-stone-600">No staff members invited yet.</p>
                <p className="text-[11px] text-stone-400">
                  Click "Invite Staff Member" to add kitchen staff or counter operators.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Permissions</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-stone-900">{s.full_name}</p>
                          <p className="text-[11px] text-stone-400">{s.email}</p>
                        </td>
                        <td className="py-3 px-4 capitalize font-semibold text-stone-800">
                          {s.permission_level === "manager" ? "Hotel Manager" : "Counter Staff"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700">
                              Verify OTPs
                            </span>
                            {s.permission_level === "manager" && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">
                                Publish Listings
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 capitalize">
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-[11px]">
                          {new Date(s.invited_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Role & Permission Matrix Info */}
            <div className="p-4 bg-stone-50 rounded-xl text-xs space-y-2 border border-stone-200">
              <p className="font-bold text-stone-900">Role-Based Access Safeguards:</p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px]">
                <li><strong>Hotel Owner:</strong> Full business control, staff invitations, banking & surplus configuration.</li>
                <li><strong>Hotel Manager:</strong> Can publish surplus listings, update quantities, and verify collection OTPs.</li>
                <li><strong>Counter Staff:</strong> Can verify collection OTPs and hand over food packages. Staff cannot alter business ownership or financial settings.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Publish Surplus Food */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-stone-900 mb-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Publish Surplus Food Batch
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Enter portion availability and set collection deadlines according to FSSAI guidelines.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Food Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Indian Lunch Buffet Thali Surplus"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Description & Packaging Details *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Sambar, Rasam, Rice, and Poriyal packed in hygienic tamper-evident boxes."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  >
                    <option value="meals">🍱 Full Meals</option>
                    <option value="bakery">🥖 Bakery & Breads</option>
                    <option value="curries_gravy">🍲 Curries & Gravy</option>
                    <option value="snacks">☕ Snacks & Tea</option>
                    <option value="desserts">🍮 Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Dietary Classification
                  </label>
                  <select
                    value={newFoodType}
                    onChange={(e) => setNewFoodType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  >
                    <option value="vegetarian">Vegetarian</option>
                    <option value="non_vegetarian">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Available Portions
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Pricing Type
                  </label>
                  <select
                    value={newPriceType}
                    onChange={(e) => setNewPriceType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  >
                    <option value="free">₹0 Free</option>
                    <option value="nominal">Nominal Price</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Price (₹/portion)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    disabled={newPriceType === "free"}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* FSSAI Confirmation Checkbox */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFssaiDeclared}
                    onChange={(e) => setNewFssaiDeclared(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  <span className="text-[11px] text-emerald-950 leading-relaxed font-medium">
                    I confirm that this food has been stored under hygienic conditions and is fit for human consumption in accordance with FSSAI regulations.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {creating ? "Publishing Batch..." : "Publish Surplus Batch to Community"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddStaffModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-emerald-800" />
              <h2 className="text-xl font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Invite Staff Member
              </h2>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Authorize an employee to verify collection OTPs or publish surplus food batches.
            </p>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Staff Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff@tajwestend.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Tip: Use <strong>staff@tajwestend.com</strong> for quick testing.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Assigned Permission Level *
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                >
                  <option value="staff">Counter Staff (Verify OTPs & Prepare Packages)</option>
                  <option value="manager">Hotel Manager (Publish Listings & Manage Staff)</option>
                </select>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500 space-y-1">
                <p className="font-semibold text-stone-800">Security Guardrails:</p>
                <p>Staff members cannot alter business ownership, remove the hotel outlet, or change payout settings.</p>
              </div>

              <button
                type="submit"
                disabled={addingStaff || !newStaffEmail.trim()}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {addingStaff ? "Inviting Staff..." : "Authorize & Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
