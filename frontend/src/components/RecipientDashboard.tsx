import React, { useState } from "react";
import {
  Clock, MapPin, CheckCircle2, AlertTriangle, ShieldCheck, XCircle,
  Truck, ShoppingBag, Key, ChevronRight, AlertCircle
} from "lucide-react";
import { Reservation } from "../types";
import { api } from "../api/client";

interface RecipientDashboardProps {
  reservations: Reservation[];
  onRefresh: () => void;
  onOpenComplaintModal: (reservationId: string) => void;
}

export const RecipientDashboard: React.FC<RecipientDashboardProps> = ({
  reservations,
  onRefresh,
  onOpenComplaintModal,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation? Reserved portions will be released back to the community.")) {
      return;
    }
    try {
      setCancellingId(id);
      await api.cancelReservation(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to cancel reservation.");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
      case "ready_for_pickup":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Ready for Collection
          </span>
        );
      case "out_for_delivery":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
            <Truck className="w-3 h-3" /> Volunteer En Route
          </span>
        );
      case "collected":
      case "delivered":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 capitalize">
            {status.replace("_", " ")}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
            My Food Reservations
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Track active meal handovers, access OTP codes, and report quality issues.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors"
        >
          Refresh Feed
        </button>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-800 text-base">
            No reservations found
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            You haven't reserved any surplus meals yet. Head over to the Discover tab to find available food from nearby hotels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservations.map((res) => {
            const isCompleted = res.status === "collected" || res.status === "delivered";
            const isCancelled = res.status === "cancelled";
            const isVolunteer = res.distribution_method === "volunteer_delivery";

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-stone-400 font-mono">
                      #{res.id.slice(0, 8)}
                    </span>
                    {getStatusBadge(res.status)}
                  </div>

                  <h3 className="font-bold text-base text-stone-900 leading-snug">
                    {res.listing_title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="font-medium text-stone-700">
                      {res.business_name}
                    </span>
                  </div>

                  {res.business_address && (
                    <p className="text-[11px] text-stone-500 ml-5 mt-0.5">
                      {res.business_address}
                    </p>
                  )}

                  {/* Portions & Method Details */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-semibold">
                        Reserved Portions
                      </p>
                      <p className="font-bold text-stone-800">
                        {res.quantity} portions ({res.total_price === 0 ? "₹0 Free" : `₹${res.total_price}`})
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-semibold">
                        Method
                      </p>
                      <p className="font-bold text-stone-800 capitalize flex items-center gap-1">
                        {isVolunteer ? (
                          <>
                            <Truck className="w-3.5 h-3.5 text-sky-700" />
                            Volunteer Drop
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                            Direct Pickup
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* OTP Card for Active Orders */}
                  {!isCompleted && !isCancelled && (
                    <div className="p-3.5 bg-emerald-950 text-white rounded-xl shadow-xs space-y-1 my-3">
                      <div className="flex items-center justify-between text-xs text-emerald-200">
                        <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                          <Key className="w-3.5 h-3.5 text-emerald-400" />
                          {isVolunteer ? "Delivery Confirmation OTP" : "Counter Collection OTP"}
                        </span>
                        <span className="text-[10px] bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded font-mono">
                          6-DIGIT CODE
                        </span>
                      </div>
                      <div className="text-center py-2">
                        <span className="font-mono font-extrabold text-3xl tracking-widest text-emerald-300">
                          {isVolunteer ? res.delivery_otp_plain || "754210" : res.pickup_otp_plain}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-200/80 text-center leading-tight">
                        {isVolunteer
                          ? "Share this OTP with the volunteer at your doorstep to verify handover."
                          : "Show this OTP to the hotel kitchen staff at collection counter."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-400">
                    Booked at{" "}
                    {new Date(res.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => handleCancel(res.id)}
                        disabled={cancellingId === res.id}
                        className="px-2.5 py-1 text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors border border-red-200"
                      >
                        {cancellingId === res.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}

                    <button
                      onClick={() => onOpenComplaintModal(res.id)}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-medium transition-colors border border-stone-200 flex items-center gap-1"
                      title="Report food safety, packaging, or handover issues"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Report Issue</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
