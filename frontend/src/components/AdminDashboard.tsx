import React, { useState } from "react";
import {
  ShieldCheck, AlertTriangle, Building2, Truck, Check, X,
  FileText, Clock, Users, ArrowUpRight, Search
} from "lucide-react";
import { Business, User, Complaint, PlatformAnalytics } from "../types";
import { api } from "../api/client";

interface AdminDashboardProps {
  analytics: PlatformAnalytics | null;
  businesses: Business[];
  volunteers: User[];
  complaints: Complaint[];
  auditLogs: any[];
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  analytics,
  businesses,
  volunteers,
  complaints,
  auditLogs,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<"overview" | "businesses" | "volunteers" | "complaints" | "audit">("overview");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [acting, setActing] = useState(false);

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
          <p className="text-xs text-stone-500 mt-0.5">
            Monitor verified food outlets, volunteer authorizations, safety complaints, and immutable audit logs.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 gap-1 text-xs">
          <button
            onClick={() => setSubTab("overview")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === "overview"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSubTab("businesses")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === "businesses"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Providers ({businesses.length})
          </button>
          <button
            onClick={() => setSubTab("volunteers")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === "volunteers"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Volunteers ({volunteers.length})
          </button>
          <button
            onClick={() => setSubTab("complaints")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === "complaints"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Complaints ({complaints.length})
          </button>
          <button
            onClick={() => setSubTab("audit")}
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
            <h3 className="font-bold text-sm text-stone-900">
              Registered Food Provider Businesses
            </h3>
            <span className="text-xs text-stone-500">
              Total: {businesses.length}
            </span>
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
                    <td className="py-3 px-4">
                      <p className="text-stone-700">{b.city}</p>
                      <p className="text-[10px] text-stone-400 truncate max-w-xs">{b.address}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {b.fssai_license_number || "Pending"}
                    </td>
                    <td className="py-3 px-4 capitalize text-stone-700">
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
                          className="px-2 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-[11px] font-bold"
                        >
                          Approve
                        </button>
                      )}
                      {b.verification_status !== "suspended" && (
                        <button
                          onClick={() => handleVerifyBusiness(b.id, "suspend")}
                          disabled={acting}
                          className="px-2 py-1 bg-stone-100 hover:bg-red-50 text-red-700 rounded text-[11px] font-semibold border border-stone-200"
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
            <h3 className="font-bold text-sm text-stone-900">
              Community Volunteer Profiles
            </h3>
            <span className="text-xs text-stone-500">
              Total: {volunteers.length}
            </span>
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
                    <td className="py-3 px-4 text-stone-600">{v.email}</td>
                    <td className="py-3 px-4 font-mono text-stone-600">{v.phone}</td>
                    <td className="py-3 px-4 text-stone-700">{v.city || "Bengaluru"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 capitalize">
                        {v.account_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.account_status === "verified" ? (
                        <button
                          onClick={() => handleVerifyVolunteer(v.id, "suspend")}
                          disabled={acting}
                          className="px-2 py-1 text-red-700 hover:bg-red-50 text-[11px] font-medium border border-red-200 rounded"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyVolunteer(v.id, "approve")}
                          disabled={acting}
                          className="px-2 py-1 bg-emerald-800 text-white text-[11px] font-bold rounded"
                        >
                          Approve
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
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-stone-900">
                Food Safety, Hygiene & Service Complaints
              </h3>
              <p className="text-xs text-stone-500">
                Investigate packaging, temperature holding, and collection anomalies.
              </p>
            </div>
            <span className="text-xs font-semibold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
              {complaints.filter((c) => c.status === "open").length} open cases
            </span>
          </div>

          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 capitalize flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Category: {c.complaint_type.replace("_", " ")}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === "open"
                        ? "bg-red-100 text-red-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <p className="text-xs text-stone-700 bg-white p-3 rounded-lg border border-stone-200">
                  "{c.description}"
                </p>

                {c.resolution_notes && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                    <strong>Resolution Notes:</strong> {c.resolution_notes}
                  </p>
                )}

                {c.status === "open" && (
                  <div>
                    {resolvingId === c.id ? (
                      <div className="space-y-2 pt-2">
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
                  <th className="py-2.5 px-4">Entity ID</th>
                  <th className="py-2.5 px-4">Metadata</th>
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
                    <td className="py-2.5 px-4 text-stone-600">
                      {log.entity_type}
                    </td>
                    <td className="py-2.5 px-4 text-stone-400">
                      {log.entity_id?.slice(0, 12)}
                    </td>
                    <td className="py-2.5 px-4 text-stone-500 truncate max-w-xs">
                      {log.metadata_json || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
