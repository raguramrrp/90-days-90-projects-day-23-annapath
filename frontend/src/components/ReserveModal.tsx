import React, { useState } from "react";
import {
  X, MapPin, Clock, ShieldCheck, Check, AlertCircle, ShoppingBag, Truck
} from "lucide-react";
import { FoodListing, Reservation } from "../types";
import { api } from "../api/client";

interface ReserveModalProps {
  listing: FoodListing;
  onClose: () => void;
  onSuccess: (reservation: Reservation) => void;
}

export const ReserveModal: React.FC<ReserveModalProps> = ({
  listing,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<"direct_pickup" | "volunteer_delivery">(
    listing.pickup_enabled ? "direct_pickup" : "volunteer_delivery"
  );
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState(listing.business?.city || "Bengaluru");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxPortions = Math.min(
    listing.quantity_available,
    listing.max_portions_per_recipient || 5
  );

  const totalPrice = listing.price_type === "nominal" ? quantity * listing.price_per_unit : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (method === "volunteer_delivery" && !addressLine.trim()) {
      setError("Please provide your delivery address for volunteer delivery.");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        listing_id: listing.id,
        quantity,
        distribution_method: method,
      };

      if (method === "volunteer_delivery") {
        payload.delivery_address = {
          address_line: addressLine.trim(),
          city: city.trim(),
          access_instructions: instructions.trim() || undefined,
        };
      }

      const res = await api.createReservation(payload);
      onSuccess(res);
    } catch (err: any) {
      setError(err.message || "Failed to place reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Reserve Surplus Food
          </span>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            {listing.title}
          </h2>
          <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            {listing.business?.business_name} • {listing.business?.city}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity Selector */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-700">
                Number of Portions:
              </label>
              <span className="text-[11px] text-stone-500">
                Max {maxPortions} portions per recipient
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-lg bg-white border border-stone-300 font-bold text-lg hover:bg-stone-100 flex items-center justify-center"
              >
                -
              </button>
              <span className="font-extrabold text-xl w-12 text-center text-stone-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxPortions, quantity + 1))}
                className="w-9 h-9 rounded-lg bg-white border border-stone-300 font-bold text-lg hover:bg-stone-100 flex items-center justify-center"
              >
                +
              </button>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-stone-500 uppercase tracking-wide">
                  Total Amount
                </p>
                <p className="font-extrabold text-lg text-emerald-800">
                  {totalPrice === 0 ? "₹0 (Free)" : `₹${totalPrice}`}
                </p>
              </div>
            </div>
          </div>

          {/* Distribution Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Select Redistribution Method:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!listing.pickup_enabled}
                onClick={() => setMethod("direct_pickup")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  method === "direct_pickup"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-medium shadow-xs"
                    : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                } ${!listing.pickup_enabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold">Direct Pickup</span>
                </div>
                <p className="text-[10px] text-stone-500 leading-tight">
                  Collect from hotel counter with OTP
                </p>
              </button>

              <button
                type="button"
                disabled={!listing.delivery_enabled}
                onClick={() => setMethod("volunteer_delivery")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  method === "volunteer_delivery"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-medium shadow-xs"
                    : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                } ${!listing.delivery_enabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold">Volunteer Delivery</span>
                </div>
                <p className="text-[10px] text-stone-500 leading-tight">
                  Volunteer delivery to community point or address
                </p>
              </button>
            </div>
          </div>

          {/* Delivery Address if Volunteer Selected */}
          {method === "volunteer_delivery" && (
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Delivery / Community Handover Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Community center desk, shelter office, or local address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Handover & Contact Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meet volunteer at entrance or contact on arrival"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Collection Deadline Notice */}
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5 p-2 bg-amber-50/70 text-amber-900 border border-amber-200/60 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              Safe Collection Deadline:{" "}
              <strong>
                {new Date(listing.collection_deadline).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>{" "}
              (Today)
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Reserving Portions...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm Reservation ({totalPrice === 0 ? "Free" : `₹${totalPrice}`})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
