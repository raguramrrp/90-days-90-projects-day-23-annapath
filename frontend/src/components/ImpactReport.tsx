import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import { Leaf, Award, TrendingUp, Users, Building2, ShieldCheck } from "lucide-react";
import { PlatformAnalytics } from "../types";

interface ImpactReportProps {
  analytics: PlatformAnalytics | null;
}

export const ImpactReport: React.FC<ImpactReportProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="py-12 text-center text-stone-400 text-xs">
        Loading impact and sustainability data...
      </div>
    );
  }

  // City chart data
  const cityData = analytics.city_breakdown.map((c) => ({
    name: c.city,
    meals: c.portions_redistributed,
    providers: c.active_providers,
  }));

  // Category chart data
  const categoryData = Object.entries(analytics.category_breakdown).map(([k, v]) => ({
    category: k.replace("_", " ").toUpperCase(),
    portions: v,
  }));

  return (
    <div className="space-y-6">
      {/* Impact Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
              Sustainability & Community Impact
            </span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Redistribution Impact Dashboard
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Transparently measuring actual meals delivered, landfill avoidance, and greenhouse gas mitigation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
          <Leaf className="w-4 h-4 text-emerald-600" />
          <span>Strictly Verified Handovers Only</span>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-2xl shadow-md">
          <p className="text-[11px] font-medium text-emerald-300 uppercase tracking-wider">
            Meals Successfully Delivered
          </p>
          <p className="text-3xl font-extrabold mt-1">
            {analytics.total_portions_redistributed}
          </p>
          <p className="text-[10px] text-emerald-200/80 mt-1">
            {analytics.overall_redistribution_efficiency_pct}% overall platform recovery rate
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Food Waste Avoided
          </p>
          <p className="text-3xl font-extrabold text-stone-900 mt-1">
            {analytics.total_kg_food_saved} <span className="text-sm font-normal text-stone-500">kg</span>
          </p>
          <p className="text-[10px] text-stone-500 mt-1">
            Equivalent to ~{Math.round(analytics.total_kg_food_saved / 10)} large waste bins diverted
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            CO2e Emissions Prevented
          </p>
          <p className="text-3xl font-extrabold text-teal-800 mt-1">
            {analytics.total_co2e_emissions_avoided_kg} <span className="text-sm font-normal text-stone-500">kg</span>
          </p>
          <p className="text-[10px] text-stone-500 mt-1">
            Based on 2.5 kg CO2e / kg food waste (FAO/UNEP)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Participating Network
          </p>
          <p className="text-3xl font-extrabold text-stone-900 mt-1">
            {analytics.total_providers_verified + analytics.total_volunteers_verified}
          </p>
          <p className="text-[10px] text-stone-500 mt-1">
            {analytics.total_providers_verified} hotels • {analytics.total_volunteers_verified} active volunteers
          </p>
        </div>
      </div>

      {/* Visual Chart: City-wise Redistribution */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-900">
              Redistributed Meal Portions by City
            </h3>
            <p className="text-xs text-stone-500">
              Comparing meal volumes diverted across metro hubs
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} />
              <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e7e5e4',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="meals" fill="#1b4332" radius={[6, 6, 0, 0]} name="Meals Saved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Free vs Nominal Breakdown Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <h4 className="font-bold text-sm text-stone-900 mb-2">
            Pricing Distribution
          </h4>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-600">₹0 Free Community Meals</span>
                <span className="font-bold text-emerald-800">
                  {analytics.free_redistribution_count} portions
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-700 h-full rounded-full"
                  style={{
                    width: `${Math.round(
                      (analytics.free_redistribution_count /
                        (analytics.total_portions_redistributed || 1)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-600">Nominal Provider Price (₹10 - ₹30)</span>
                <span className="font-bold text-stone-800">
                  {analytics.paid_redistribution_count} portions
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-700 h-full rounded-full"
                  style={{
                    width: `${Math.round(
                      (analytics.paid_redistribution_count /
                        (analytics.total_portions_redistributed || 1)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 text-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-stone-900 mb-1">
              Food Safety & Zero False Claims Rule
            </h4>
            <p className="text-stone-600 leading-relaxed text-[11px]">
              PLATEWISE / ANNAPATH calculates environmental impact solely from confirmed, OTP-verified food pickups and deliveries. Uncollected reservations and expired listings are strictly excluded from all saved portion calculations.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-200/80 flex items-center gap-1.5 text-stone-500 text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Audited against UNEP Food Waste Index Report benchmarks.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
