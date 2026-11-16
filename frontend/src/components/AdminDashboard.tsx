import React, { useState, useEffect } from "react";
import {
  ShieldCheck, AlertTriangle, Building2, Truck, Check, X,
  FileText, Clock, Users, ArrowUpRight, Search, Plus, UserPlus
} from "lucide-react";
import { Business, User, Complaint, PlatformAnalytics } from "../types";
import { api } from "../api/client";

interface AdminDashboardProps {
  analytics: PlatformAnalytics | null;
  businesses: Business[];
  volunteers: User[];
  complaints: Complaint[];
  auditLogs: any[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  analytics,
  businesses,
  volunteers,
  complaints,
  auditLogs,
  activeTab = "admin_overview",
  onTabChange,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<"overview" | "businesses" | "volunteers" | "complaints" | "audit">("overview");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [acting, setActing] = useState(false);

  // Add Provider Modal State
  const [showAddBizModal, setShowAddBizModal] = useState(false);
  const [newBizName, setNewBizName] = useState("");
  const [newBizType, setNewBizType] = useState("restaurant");
  const [newBizFssai, setNewBizFssai] = useState("11223334008899");
  const [newBizCity, setNewBizCity] = useState("Bengaluru");
  const [newBizAddress, setNewBizAddress] = useState("");
  const [newBizPhone, setNewBizPhone] = useState("+919876500011");
  const [newBizHours, setNewBizHours] = useState("08:00 AM - 10:00 PM");
  const [submittingBiz, setSubmittingBiz] = useState(false);

  // Add Volunteer Modal State
  const [showAddVolModal, setShowAddVolModal] = useState(false);
  const [newVolName, setNewVolName] = useState("");
  const [newVolEmail, setNewVolEmail] = useState("");
  const [newVolPhone, setNewVolPhone] = useState("+919876500022");
  const [newVolCity, setNewVolCity] = useState("Bengaluru");
  const [newVolArea, setNewVolArea] = useState("Central Community Zone");
  const [newVolVehicle, setNewVolVehicle] = useState("two_wheeler");
  const [submittingVol, setSubmittingVol] = useState(false);

  useEffect(() => {
    if (activeTab && activeTab.startsWith("admin_")) {
      const mapped = activeTab.replace("admin_", "") as any;
      if (["overview", "businesses", "volunteers", "complaints", "audit"].includes(mapped)) {
        setSubTab(mapped);
      }
    }
  }, [activeTab]);

  const handleSubTabChange = (tab: "overview" | "businesses" | "volunteers" | "complaints" | "audit") => {
    setSubTab(tab);
    if (onTabChange) {
      onTabChange(`admin_${tab}`);
    }
  };

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim() || !newBizAddress.trim()) return;
    try {
      setSubmittingBiz(true);
      await api.addAdminBusiness({
        business_name: newBizName.trim(),
        business_type: newBizType,
        fssai_license_number: newBizFssai.trim(),
        address: newBizAddress.trim(),
        city: newBizCity,
        contact_phone: newBizPhone.trim(),
        operating_hours: newBizHours.trim(),
        supported_distribution_methods: "both",
      });
      setShowAddBizModal(false);
      setNewBizName("");
      setNewBizAddress("");
      onRefresh();
    } catch (err: any) {
      alert("Failed to add provider: " + (err.message || "Unknown error"));
    } finally {
      setSubmittingBiz(false);
    }
  };

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName.trim() || !newVolEmail.trim()) return;
    try {
      setSubmittingVol(true);
      await api.addAdminVolunteer({
        full_name: newVolName.trim(),
        email: newVolEmail.trim().toLowerCase(),
        phone: newVolPhone.trim(),
        city: newVolCity,
        preferred_service_area: newVolArea.trim(),
        vehicle_type: newVolVehicle,
      });
      setShowAddVolModal(false);
      setNewVolName("");
      setNewVolEmail("");
      onRefresh();
    } catch (err: any) {
      alert("Failed to add volunteer: " + (err.message || "Unknown error"));
    } finally {
      setSubmittingVol(false);
    }
  };

  const handleVerifyBusiness = async (bizId: string, action: string) => {
    try {
      setActing(true);
      await api.verifyBusiness(bizId, action);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to moderate business.");
    } finally {
      setActing(false);
    }
  };

  const handleVerifyVolunteer = async (userId: string, action: string) => {
    try {
      setActing(true);
      await api.verifyVolunteer(userId, action);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to moderate volunteer.");
    } finally {
      setActing(false);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    if (!resolutionText.trim()) {
      alert("Please provide resolution notes before closing this issue.");
      return;
    }
    try {
      setActing(true);
      await api.resolveComplaint(complaintId, "resolved", resolutionText.trim());
      setResolvingId(null);
      setResolutionText("");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to resolve complaint.");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">
              Platform Administration
            </span>
            <span className="text-xs text-stone-500">
              Audit Compliance & Trust Framework
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Platform Governance & Moderation
          </h1>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 gap-1 text-xs">
          <button
            onClick={() => handleSubTabChange("overview")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === "overview"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleSubTabChange("businesses")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === "businesses"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Providers ({businesses.length})
          </button>
          <button
            onClick={() => handleSubTabChange("volunteers")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === "volunteers"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Volunteers ({volunteers.length})
          </button>
          <button
            onClick={() => handleSubTabChange("complaints")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === "complaints"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Complaints ({complaints.length})
          </button>
          <button
            onClick={() => handleSubTabChange("audit")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === "audit"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* OVERVIEW SUB-TAB */}
      {subTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <p className="text-[11px] font-semibold text-stone-400 uppercase">Verified Providers</p>
              <p className="text-3xl font-extrabold text-stone-900 mt-1">
                {analytics?.total_providers_verified || 0}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">Hotels, caterers & bakeries</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <p className="text-[11px] font-semibold text-stone-400 uppercase">Redistributed Meals</p>
              <p className="text-3xl font-extrabold text-emerald-800 mt-1">
                {analytics?.total_portions_redistributed || 0}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">Verified completed handovers</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <p className="text-[11px] font-semibold text-stone-400 uppercase">Total Food Saved</p>
              <p className="text-3xl font-extrabold text-emerald-700 mt-1">
                {analytics?.total_kg_food_saved || 0} kg
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">Avoided from landfill decay</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <p className="text-[11px] font-semibold text-stone-400 uppercase">Emissions Avoided</p>
              <p className="text-3xl font-extrabold text-teal-800 mt-1">
                {analytics?.total_co2e_emissions_avoided_kg || 0} kg
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">CO2 equivalent footprint avoided</p>
            </div>
          </div>

          {/* City Redistribution Activity */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 mb-3">
              City-Wise Food Redistribution Activity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {analytics?.city_breakdown.map((c) => (
                <div key={c.city} className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-800">{c.city}</span>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      {c.portions_redistributed} meals saved
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-2 space-y-0.5">
                    <p>• {c.active_providers} verified food outlets</p>
                    <p>• {c.listings_count} surplus batches</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BUSINESSES SUB-TAB */}
      {subTab === "businesses" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                Registered Food Provider Businesses
              </h3>
              <span className="text-xs text-stone-500">
                Total: {businesses.length} registered outlets
              </span>
            </div>
            <button
              onClick={() => setShowAddBizModal(true)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Food Provider</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Business Name & Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">FSSAI License</th>
                  <th className="py-3 px-4">Methods</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-stone-900">{b.business_name}</p>
                      <p className="text-[10px] text-stone-400 capitalize">{b.business_type}</p>
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {b.city} • <span className="text-[11px] text-stone-400">{b.address}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-700">
                      {b.fssai_license_number || "11223334001928"}
                    </td>
                    <td className="py-3 px-4 capitalize text-stone-600">
                      {b.supported_distribution_methods.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          b.verification_status === "verified"
                            ? "bg-green-100 text-green-800"
                            : b.verification_status === "suspended"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.verification_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {b.verification_status !== "verified" && (
                        <button
                          onClick={() => handleVerifyBusiness(b.id, "approve")}
                          disabled={acting}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold"
                        >
                          Approve
                        </button>
                      )}
                      {b.verification_status === "verified" && (
                        <button
                          onClick={() => handleVerifyBusiness(b.id, "suspend")}
                          disabled={acting}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VOLUNTEERS SUB-TAB */}
      {subTab === "volunteers" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                Community Volunteer Profiles
              </h3>
              <span className="text-xs text-stone-500">
                Total: {volunteers.length} registered volunteers
              </span>
            </div>
            <button
              onClick={() => setShowAddVolModal(true)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Volunteer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Volunteer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {volunteers.map((v) => (
                  <tr key={v.id} className="hover:bg-stone-50/50">
                    <td className="py-3 px-4 font-bold text-stone-900">{v.full_name}</td>
                    <td className="py-3 px-4 text-stone-500">{v.email}</td>
                    <td className="py-3 px-4 text-stone-600">{v.phone}</td>
                    <td className="py-3 px-4 text-stone-600">{v.city || "Bengaluru"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          v.account_status === "verified"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {v.account_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {v.account_status !== "verified" ? (
                        <button
                          onClick={() => handleVerifyVolunteer(v.id, "approve")}
                          disabled={acting}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold"
                        >
                          Verify ID
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyVolunteer(v.id, "suspend")}
                          disabled={acting}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded text-[11px] font-semibold"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLAINTS SUB-TAB */}
      {subTab === "complaints" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                Reported Safety & Service Issues
              </h3>
              <p className="text-xs text-stone-500">
                Investigate packaging, temperature, hygiene, and handover complaints.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full">
              {complaints.filter((c) => c.status === "open").length} open cases
            </span>
          </div>

          <div className="space-y-3">
            {complaints.length === 0 && (
              <div className="py-12 text-center text-xs text-stone-400">
                No active complaints filed on the platform.
              </div>
            )}
            {complaints.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase">
                      {c.complaint_type.replace("_", " ")}
                    </span>
                    <span className="text-stone-400 font-mono text-[11px]">
                      Case #{c.id.slice(0, 8)}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      c.status === "resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <p className="text-stone-800 font-medium">{c.description}</p>
                <p className="text-[11px] text-stone-400">
                  Reported by {c.reporter_name || "Recipient"} • {new Date(c.created_at).toLocaleDateString()}
                </p>

                {c.resolution_notes && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                    <strong>Resolution Note:</strong> {c.resolution_notes}
                  </div>
                )}

                {c.status !== "resolved" && (
                  <div className="pt-2">
                    {resolvingId === c.id ? (
                      <div className="space-y-2 bg-white p-3 rounded-xl border border-stone-200">
                        <textarea
                          rows={2}
                          placeholder="Enter investigation outcome and corrective actions..."
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveComplaint(c.id)}
                            disabled={acting}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold"
                          >
                            Close & Resolve Case
                          </button>
                          <button
                            onClick={() => setResolvingId(null)}
                            className="px-3 py-1.5 text-stone-500 hover:bg-stone-200 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setResolvingId(c.id);
                          setResolutionText("");
                        }}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold"
                      >
                        Investigate & Resolve
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOGS SUB-TAB */}
      {subTab === "audit" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900">
              System Audit Trail & Handover Log
            </h3>
            <span className="text-xs text-stone-400">
              Latest 100 immutable events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity Type</th>
                  <th className="py-2.5 px-4">Reference ID</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="py-2.5 px-4 text-stone-500">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-emerald-800">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-stone-600 capitalize">
                      {log.entity_type.replace("_", " ")}
                    </td>
                    <td className="py-2.5 px-4 text-stone-500 font-mono">
                      #{log.entity_id?.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                        Logged
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD FOOD PROVIDER */}
      {showAddBizModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddBizModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-emerald-800" />
              <h2 className="text-xl font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Register New Food Provider
              </h2>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Add a partner hotel kitchen, restaurant, catering business, or bakery to the redistribution network.
            </p>

            <form onSubmit={handleAddBusiness} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Business / Kitchen Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunrise Community Kitchen"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Establishment Type
                  </label>
                  <select
                    value={newBizType}
                    onChange={(e) => setNewBizType(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  >
                    <option value="hotel">Hotel / Dining</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="bakery">Bakery</option>
                    <option value="catering">Catering Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    FSSAI License Number (14-digit)
                  </label>
                  <input
                    type="text"
                    required
                    value={newBizFssai}
                    onChange={(e) => setNewBizFssai(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Metro City
                  </label>
                  <select
                    value={newBizCity}
                    onChange={(e) => setNewBizCity(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={newBizPhone}
                    onChange={(e) => setNewBizPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Physical Kitchen Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 5 Community Center, Main Road"
                  value={newBizAddress}
                  onChange={(e) => setNewBizAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={newBizHours}
                  onChange={(e) => setNewBizHours(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                />
              </div>

              <button
                type="submit"
                disabled={submittingBiz}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {submittingBiz ? "Registering Provider..." : "Register & Verify Food Provider"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD VOLUNTEER */}
      {showAddVolModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddVolModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-emerald-800" />
              <h2 className="text-xl font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Register New Volunteer
              </h2>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Onboard a community volunteer to assist with surplus meal handovers.
            </p>

            <form onSubmit={handleAddVolunteer} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Volunteer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Krishnan"
                  value={newVolName}
                  onChange={(e) => setNewVolName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. meera.volunteer@annapath.org"
                  value={newVolEmail}
                  onChange={(e) => setNewVolEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newVolPhone}
                    onChange={(e) => setNewVolPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Metro City
                  </label>
                  <select
                    value={newVolCity}
                    onChange={(e) => setNewVolCity(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Service Area / Zone
                  </label>
                  <input
                    type="text"
                    required
                    value={newVolArea}
                    onChange={(e) => setNewVolArea(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Transport Type
                  </label>
                  <select
                    value={newVolVehicle}
                    onChange={(e) => setNewVolVehicle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 rounded-lg border border-stone-300"
                  >
                    <option value="two_wheeler">Two-Wheeler / Scooter</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="four_wheeler">Four-Wheeler / Car</option>
                    <option value="walking">Walking / Local</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingVol}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {submittingVol ? "Onboarding Volunteer..." : "Register & Authorize Volunteer"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
