import React, { useState } from "react";
import {
  Plus, CheckCircle2, Clock, ShieldCheck, Key, AlertCircle,
  Building2, Utensils, X, Leaf, Users
} from "lucide-react";
import { FoodListing, Reservation, Business, HotelAnalytics } from "../types";
import { api } from "../api/client";

interface HotelDashboardProps {
  business: Business | null;
  listings: FoodListing[];
  reservations: Reservation[];
  analytics: HotelAnalytics | null;
  onRefresh: () => void;
}

export const HotelDashboard: React.FC<HotelDashboardProps> = ({
  business,
  listings,
  reservations,
  analytics,
  onRefresh,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [selectedResId, setSelectedResId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      // Reset form
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

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Surplus Food</span>
        </button>
      </div>

      {/* Impact Quick Metrics */}
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

      {/* Two Column Layout: Active Listings & Counter OTP Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Surplus Listings Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900">
              Active Surplus Listings
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
                  <th className="py-3 px-4">Deadline</th>
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 capitalize">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Counter OTP Verification Desk (1 col) */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-stone-900">
                Counter OTP Verification Desk
              </h3>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Enter the recipient's 6-digit collection OTP at the kitchen counter to verify handover.
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

            <form onSubmit={handleVerifyOTP} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Select Awaiting Reservation:
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
                  Enter 6-Digit Collection OTP:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 842109"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full text-center text-lg font-mono font-bold tracking-widest px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                {verifying ? "Verifying..." : "Verify & Hand Over Package"}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] text-stone-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>OTP is cryptographically verified against HMAC-SHA256 hash.</span>
          </div>
        </div>
      </div>

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
    </div>
  );
};
