import React from "react";
import { ShieldCheck, User as UserIcon, Building2, Truck, Users } from "lucide-react";
import { UserRole } from "../types";

interface RoleSwitcherProps {
  currentRole: UserRole;
  currentEmail: string;
  onSelectRole: (role: UserRole, email: string, password: string) => void;
}

export const REGISTERED_ACCOUNTS = [
  {
    role: "recipient" as UserRole,
    name: "Ravi Shankar",
    roleLabel: "Recipient",
    email: "recipient@annapath.org",
    password: "recipientpassword123",
    icon: UserIcon,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    desc: "Discover & reserve surplus meals",
  },
  {
    role: "hotel_owner" as UserRole,
    name: "Pooja Hegde",
    roleLabel: "Hotel Owner",
    email: "pooja.hegde@annapath.org",
    password: "ownerpassword123",
    icon: Building2,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    desc: "Publish surplus food & view analytics",
  },
  {
    role: "hotel_staff" as UserRole,
    name: "Kiran Kumar",
    roleLabel: "Hotel Staff",
    email: "kiran.kumar@annapath.org",
    password: "staffpassword123",
    icon: Building2,
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
    desc: "Counter OTP verification & package handover",
  },
  {
    role: "volunteer" as UserRole,
    name: "Arun Swaminathan",
    roleLabel: "Volunteer",
    email: "volunteer@annapath.org",
    password: "volunteerpassword123",
    icon: Truck,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    desc: "Accept nearby deliveries & verify delivery OTP",
  },
  {
    role: "admin" as UserRole,
    name: "Platform Administrator",
    roleLabel: "Admin",
    email: "admin@annapath.org",
    password: "adminpassword123",
    icon: ShieldCheck,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    desc: "Verify providers, resolve complaints & audit",
  },
];

// Backward-compatible alias
export const DEMO_USERS = REGISTERED_ACCOUNTS;

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentEmail,
  onSelectRole,
}) => {
  return (
    <div className="bg-stone-900 text-stone-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 shadow-inner">
      <div className="flex items-center gap-2 font-medium">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-stone-400 font-semibold tracking-wide uppercase text-[10px]">
          Switch Account:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {REGISTERED_ACCOUNTS.map((u) => {
          const isSelected = currentEmail === u.email;
          const Icon = u.icon;
          return (
            <button
              key={u.role}
              onClick={() => onSelectRole(u.role, u.email, u.password)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-emerald-700 text-white border-emerald-500 shadow-sm"
                  : "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white"
              }`}
              title={u.desc}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{u.roleLabel}</span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
