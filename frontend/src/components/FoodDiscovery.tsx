import React, { useState } from "react";
import {
  Search, Filter, MapPin, Clock, ShieldCheck, Map as MapIcon,
  List as ListIcon, Sparkles, AlertCircle, ShoppingBag, Truck
} from "lucide-react";
import { FoodListing } from "../types";
import { FoodMap } from "./FoodMap";

interface FoodDiscoveryProps {
  listings: FoodListing[];
  loading: boolean;
  onSelectListing: (listing: FoodListing) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
}

const CATEGORIES = [
  { id: "", label: "All Categories" },
  { id: "meals", label: "🍱 Full Meals" },
  { id: "breakfast", label: "🥞 Breakfast & Tiffins" },
  { id: "bakery", label: "🥖 Bakery & Breads" },
  { id: "curries_gravy", label: "🍲 Curries & Gravy" },
  { id: "snacks", label: "☕ Snacks & Tea" },
  { id: "desserts", label: "🍮 Desserts" },
];

export const FoodDiscovery: React.FC<FoodDiscoveryProps> = ({
  listings,
  loading,
  onSelectListing,
  onSearchChange,
  onFilterChange,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [foodType, setFoodType] = useState<string>("");
  const [priceType, setPriceType] = useState<string>("");
  const [deliveryOnly, setDeliveryOnly] = useState(false);

  const handleSearch = (val: string) => {
    setSearch(val);
    onSearchChange(val);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    onFilterChange({
      category: catId || undefined,
      food_type: foodType || undefined,
      price_type: priceType || undefined,
      delivery_only: deliveryOnly || undefined,
    });
  };

  const handleToggleVeg = () => {
    const next = foodType === "vegetarian" ? "" : "vegetarian";
    setFoodType(next);
    onFilterChange({
      category: selectedCategory || undefined,
      food_type: next || undefined,
      price_type: priceType || undefined,
      delivery_only: deliveryOnly || undefined,
    });
  };

  const handleToggleFree = () => {
    const next = priceType === "free" ? "" : "free";
    setPriceType(next);
    onFilterChange({
      category: selectedCategory || undefined,
      food_type: foodType || undefined,
      price_type: next || undefined,
      delivery_only: deliveryOnly || undefined,
    });
  };

  const handleToggleDelivery = () => {
    const next = !deliveryOnly;
    setDeliveryOnly(next);
    onFilterChange({
      category: selectedCategory || undefined,
      food_type: foodType || undefined,
      price_type: priceType || undefined,
      delivery_only: next || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Zero Waste • Food Redistribution Platform</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
            Surplus food from top hotels, ready for redistribution.
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm mt-2 font-normal leading-relaxed">
            Direct from verified kitchens in Bengaluru, Chennai, and Mumbai. Free (₹0) and nominal meals prepared under verified FSSAI hygiene standards.
          </p>
        </div>

        {/* Decorative shape */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-emerald-700/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Discovery Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by hotel, thali, biryani, bread..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleToggleFree}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                priceType === "free"
                  ? "bg-emerald-800 text-white border-emerald-900 shadow-xs"
                  : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
              }`}
            >
              ₹0 Free Only
            </button>

            <button
              onClick={handleToggleVeg}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                foodType === "vegetarian"
                  ? "bg-green-700 text-white border-green-800 shadow-xs"
                  : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Vegetarian
            </button>

            <button
              onClick={handleToggleDelivery}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                deliveryOnly
                  ? "bg-sky-800 text-white border-sky-900 shadow-xs"
                  : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Volunteer Delivery
            </button>

            {/* View Mode Toggle */}
            <div className="ml-auto flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  viewMode === "list"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  viewMode === "map"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                title="Map View"
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex overflow-x-auto gap-2 pt-1 pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-stone-900 text-white font-semibold"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Map View vs Grid View */}
      {viewMode === "map" ? (
        <FoodMap listings={listings} onSelectListing={onSelectListing} />
      ) : (
        <div>
          {loading ? (
            <div className="py-16 text-center text-stone-500 text-sm">
              <div className="animate-spin w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading freshly published surplus food listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="font-bold text-stone-800 text-base">
                No surplus food matching your criteria
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                Try resetting your filters or check back shortly as hotels and restaurants publish fresh surplus batches throughout the day.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((item) => {
                const isFree = item.price_type === "free";
                const isVeg = item.food_type === "vegetarian" || item.food_type === "vegan";
                const deadline = new Date(item.collection_deadline);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
                  >
                    {/* Image and Badges */}
                    <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                      <img
                        src={
                          item.image_url ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Price Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black shadow-md ${
                            isFree
                              ? "bg-emerald-800 text-white"
                              : "bg-stone-900 text-white"
                          }`}
                        >
                          {isFree ? "₹0 FREE" : `₹${item.price_per_unit} / portion`}
                        </span>
                      </div>

                      {/* Veg / Non-Veg Indicator */}
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isVeg ? "bg-green-600" : "bg-red-600"
                          }`}
                        ></span>
                        <span className="text-stone-700">
                          {isVeg ? "Veg" : "Non-Veg"}
                        </span>
                      </div>

                      {/* Portions Remaining Badge */}
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                        <span>{item.quantity_available} portions left</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-stone-500 text-[11px] mb-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="font-semibold text-stone-700 truncate">
                            {item.business?.business_name}
                          </span>
                          <span>•</span>
                          <span>{item.business?.city}</span>
                        </div>

                        <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-1 group-hover:text-emerald-900 transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Meta Information & CTA */}
                      <div className="mt-4 pt-3 border-t border-stone-100 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-stone-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Collect by{" "}
                              <strong>
                                {deadline.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </strong>
                            </span>
                          </span>

                          <span className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>FSSAI Verified</span>
                          </span>
                        </div>

                        <button
                          onClick={() => onSelectListing(item)}
                          className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Reserve Portions</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
