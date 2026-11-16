import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { FoodListing } from "../types";

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface FoodMapProps {
  listings: FoodListing[];
  onSelectListing: (listing: FoodListing) => void;
}

export const FoodMap: React.FC<FoodMapProps> = ({ listings, onSelectListing }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to Bengaluru center
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    const bounds: [number, number][] = [];

    listings.forEach((item) => {
      const biz = item.business;
      if (!biz || !biz.latitude || !biz.longitude) return;

      const lat = biz.latitude;
      const lon = biz.longitude;
      bounds.push([lat, lon]);

      // Custom HTML Marker Pin
      const isFree = item.price_type === "free";
      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="background-color: ${isFree ? '#166534' : '#0369a1'}; color: white; padding: 4px 8px; border-radius: 9999px; font-weight: 700; font-size: 11px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); border: 2px solid white; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
            <span>${isFree ? '₹0 FREE' : `₹${item.price_per_unit}`}</span>
            <span style="background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 6px; font-size: 10px;">${item.quantity_available} left</span>
          </div>
        `,
        iconSize: [100, 30],
        iconAnchor: [50, 15],
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #1c1917; margin-bottom: 2px;">
            ${item.title}
          </div>
          <div style="font-size: 11px; color: #57534e; margin-bottom: 6px;">
            📍 ${biz.business_name} • ${biz.city}
          </div>
          <div style="display: flex; gap: 6px; font-size: 11px; margin-bottom: 8px;">
            <span style="background: #f0fdf4; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
              ${item.quantity_available} portions
            </span>
            <span style="background: #f5f5f4; color: #44403c; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
              ${isFree ? 'Free Meal' : `₹${item.price_per_unit}/portion`}
            </span>
          </div>
          <div style="font-size: 10px; color: #78716c; margin-bottom: 8px;">
            ⏰ Deadline: ${new Date(item.collection_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            id="reserve-btn-${item.id}"
            style="width: 100%; background: #1b4332; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;"
          >
            Reserve Food Now
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`reserve-btn-${item.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectListing(item);
          };
        }
      });

      markers.addLayer(marker);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [listings]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm text-[11px] font-medium text-stone-600 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span> ₹0 Free Food
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-700"></span> Nominal Price
        </span>
      </div>
    </div>
  );
};
