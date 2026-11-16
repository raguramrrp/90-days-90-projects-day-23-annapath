import React, { useState } from "react";
import {
  Truck, MapPin, CheckCircle2, Clock, Key, AlertCircle,
  Navigation, ShieldCheck, Check, ArrowRight
} from "lucide-react";
import { DeliveryTask } from "../types";
import { api } from "../api/client";

interface VolunteerDashboardProps {
  tasks: DeliveryTask[];
  onRefresh: () => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
  tasks,
  onRefresh,
}) => {
  const [deliveryOtpInput, setDeliveryOtpInput] = useState("");
  const [acting, setActing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active accepted task
  const activeTask = tasks.find(
    (t) => t.delivery_status === "accepted" || t.delivery_status === "en_route"
  );

  // Available tasks to accept
  const availableTasks = tasks.filter((t) => t.delivery_status === "available");

  const handleAccept = async (taskId: string) => {
    try {
      setActing(true);
      setActionMessage(null);
      await api.acceptTask(taskId);
      setActionMessage({ type: "success", text: "Task accepted! Head to the hotel for pickup." });
      onRefresh();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to accept task." });
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async (taskId: string) => {
    try {
      setActing(true);
      await api.declineTask(taskId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to decline task.");
    } finally {
      setActing(false);
    }
  };

  const handleReachedHotel = async (taskId: string) => {
    try {
      setActing(true);
      await api.reachedHotel(taskId);
      setActionMessage({ type: "success", text: "Kitchen notified of your arrival. Awaiting package handover." });
      onRefresh();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Action failed." });
    } finally {
      setActing(false);
    }
  };

  const handlePickedUp = async (taskId: string) => {
    try {
      setActing(true);
      await api.confirmVolunteerPickup(taskId);
      setActionMessage({ type: "success", text: "Packages collected! In transit to recipient doorstep." });
      onRefresh();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Action failed." });
    } finally {
      setActing(false);
    }
  };

  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;
    if (!deliveryOtpInput || deliveryOtpInput.trim().length !== 6) {
      setActionMessage({ type: "error", text: "Please enter the 6-digit delivery OTP given by recipient." });
      return;
    }

    try {
      setActing(true);
      setActionMessage(null);
      await api.verifyDeliveryOTP(activeTask.reservation_id, deliveryOtpInput.trim());
      setActionMessage({
        type: "success",
        text: "Delivery completed and verified! Thank you for redistributing food to the community.",
      });
      setDeliveryOtpInput("");
      onRefresh();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Invalid delivery OTP code." });
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Volunteer Profile Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
              Community Volunteer
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-emerald-800 font-semibold">Active & Available</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Volunteer Delivery Workspace
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Service Zone: Central Bengaluru (12 km radius) • Vehicle: Two-Wheeler
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200 text-center">
            <p className="text-[10px] text-stone-400 uppercase font-semibold">Completed Runs</p>
            <p className="text-lg font-bold text-stone-900">14 deliveries</p>
          </div>
          <div className="bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200 text-center">
            <p className="text-[10px] text-stone-400 uppercase font-semibold">Portions Delivered</p>
            <p className="text-lg font-bold text-emerald-800">48 meals</p>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* ACTIVE RUN WORKFLOW CARD (If any task is accepted) */}
      {activeTask && (
        <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-lg border border-emerald-900 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-800 text-emerald-200">
                <Truck className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Active Delivery Mission
                </span>
                <h3 className="font-bold text-base text-white">
                  {activeTask.food_title} ({activeTask.quantity} packages)
                </h3>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-800 text-emerald-200 capitalize">
              Status: {activeTask.delivery_status.replace("_", " ")}
            </span>
          </div>

          {/* Stepper: Step 1 Hotel Pickup -> Step 2 Transit -> Step 3 Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Pickup from Hotel */}
            <div className="bg-emerald-900/50 p-4 rounded-xl border border-emerald-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  Hotel Pickup Counter
                </span>
                <span className="text-[10px] text-emerald-400">
                  {activeTask.pickup_status === "picked_up" ? "✓ Packages In Hand" : "Pending Pickup"}
                </span>
              </div>

              <p className="text-sm font-semibold text-white">
                {activeTask.pickup_business_name}
              </p>
              <p className="text-xs text-emerald-200/80">
                📍 {activeTask.pickup_address}
              </p>

              <div className="pt-2 flex gap-2">
                {activeTask.pickup_status !== "reached_hotel" && activeTask.pickup_status !== "picked_up" && (
                  <button
                    onClick={() => handleReachedHotel(activeTask.id)}
                    disabled={acting}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex-1"
                  >
                    I Have Reached Hotel
                  </button>
                )}

                {activeTask.pickup_status !== "picked_up" && (
                  <button
                    onClick={() => handlePickedUp(activeTask.id)}
                    disabled={acting}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-lg text-xs font-bold transition-all shadow-xs flex-1"
                  >
                    Confirm Package Handover
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Doorstep Drop & Delivery OTP */}
            <div className="bg-emerald-900/50 p-4 rounded-xl border border-emerald-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  Recipient Doorstep Drop
                </span>
                <span className="text-[10px] text-emerald-400">
                  Rec: {activeTask.recipient_name}
                </span>
              </div>

              <p className="text-xs text-emerald-200/90">
                🏠 {activeTask.delivery_address}
              </p>
              {activeTask.access_instructions && (
                <p className="text-[11px] text-emerald-300/80 italic">
                  Note: "{activeTask.access_instructions}"
                </p>
              )}

              {/* Delivery OTP verification form */}
              <form onSubmit={handleCompleteDelivery} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit Recipient OTP"
                  value={deliveryOtpInput}
                  onChange={(e) => setDeliveryOtpInput(e.target.value)}
                  className="text-center font-mono font-bold text-stone-900 bg-white px-3 py-2 rounded-lg text-xs w-44 focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  type="submit"
                  disabled={acting}
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-lg text-xs font-black transition-all flex-1"
                >
                  Verify & Complete Drop
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AVAILABLE DELIVERY TASKS FEED */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-stone-900">
            Available Nearby Delivery Runs
          </h3>
          <span className="text-xs text-stone-500">
            {availableTasks.length} missions waiting for assistance
          </span>
        </div>

        {availableTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <Truck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h4 className="font-bold text-stone-800 text-sm">
              No delivery runs currently waiting
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              All surplus orders are either direct pickups or already have volunteers assigned. New tasks will appear here as recipients book volunteer delivery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      Surplus Meal Drop
                    </span>
                    <span className="text-xs font-bold text-stone-700">
                      {t.quantity} portions
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-stone-900">
                    {t.food_title}
                  </h4>

                  {/* Route Overview */}
                  <div className="my-3 space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                      <div>
                        <p className="text-[10px] text-stone-400 font-semibold uppercase">
                          Pickup Location
                        </p>
                        <p className="font-bold text-stone-800">
                          {t.pickup_business_name}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {t.pickup_address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1 border-t border-stone-200/60">
                      <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                      <div>
                        <p className="text-[10px] text-stone-400 font-semibold uppercase">
                          Dropoff Location
                        </p>
                        <p className="font-bold text-stone-800">
                          {t.recipient_name}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {t.delivery_address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(t.id)}
                    disabled={acting || Boolean(activeTask)}
                    className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Delivery Mission</span>
                  </button>

                  <button
                    onClick={() => handleDecline(t.id)}
                    disabled={acting}
                    className="px-3 py-2.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl text-xs font-medium transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
