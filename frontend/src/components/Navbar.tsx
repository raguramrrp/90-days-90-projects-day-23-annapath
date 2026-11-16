import React, { useState } from "react";
import {
  UtensilsCrossed, Bell, User as UserIcon, LogOut, CheckCircle2,
  Shield, Compass, Clock, MapPin
} from "lucide-react";
import { User, InAppNotification } from "../types";

interface NavbarProps {
  user: User | null;
  notifications: InAppNotification[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onOpenSafety: () => void;
  onMarkNotificationRead: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  notifications,
  activeTab,
  onTabChange,
  onLogout,
  onOpenSafety,
  onMarkNotificationRead,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const getTabsForRole = () => {
    if (!user) return [{ id: "discover", label: "Discover Food" }];

    switch (user.role) {
      case "hotel_owner":
      case "hotel_staff":
        return [
          { id: "listings", label: "Surplus Listings" },
          { id: "verify_desk", label: "Counter OTP Desk" },
          { id: "analytics", label: "Impact & Waste Report" },
          { id: "staff", label: "Staff & Outlets" },
        ];
      case "volunteer":
        return [
          { id: "tasks", label: "Available Deliveries" },
          { id: "active_run", label: "Active Run" },
          { id: "vol_impact", label: "Volunteer Impact" },
        ];
      case "admin":
        return [
          { id: "admin_overview", label: "Platform Overview" },
          { id: "admin_businesses", label: "Food Providers" },
          { id: "admin_volunteers", label: "Volunteers" },
          { id: "admin_complaints", label: "Complaints & Safety" },
          { id: "admin_audit", label: "Audit Logs" },
        ];
      case "recipient":
      default:
        return [
          { id: "discover", label: "Discover Surplus" },
          { id: "reservations", label: "My Reservations" },
          { id: "impact", label: "Platform Impact" },
        ];
    }
  };

  const tabs = getTabsForRole();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange(tabs[0].id)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-white shadow-md shadow-emerald-900/10">
              <UtensilsCrossed className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  ANNAPATH
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                  India
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                Good food deserves another destination.
              </p>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-900 font-semibold shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Safety Guidelines Trigger */}
            <button
              onClick={onOpenSafety}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-emerald-800 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
              title="FSSAI Hygiene & Handling Protocol"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>FSSAI Safety</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                title="In-app alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                    <span className="font-semibold text-xs text-stone-900 uppercase tracking-wide">
                      Platform Notifications
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {unreadCount} unread
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-stone-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`px-4 py-2.5 hover:bg-stone-50 transition-colors cursor-pointer text-left ${
                            !n.read_at ? "bg-emerald-50/40" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-semibold text-stone-800">
                              {n.title}
                            </p>
                            {!n.read_at && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[9px] text-stone-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-stone-900 leading-tight">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-stone-500 capitalize">
                    {user.role.replace("_", " ")}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 font-semibold text-xs">
                  {user.full_name.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex overflow-x-auto py-2 border-t border-stone-100 gap-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-800 text-white"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
