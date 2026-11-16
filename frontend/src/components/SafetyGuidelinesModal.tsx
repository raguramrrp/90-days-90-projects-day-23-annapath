import React from "react";
import { ShieldCheck, X, AlertTriangle, Thermometer, CheckCircle2, Clock } from "lucide-react";

interface SafetyGuidelinesModalProps {
  onClose: () => void;
}

export const SafetyGuidelinesModal: React.FC<SafetyGuidelinesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
              FSSAI Food Safety & Trust Framework
            </h2>
            <p className="text-[11px] text-stone-500">
              Hygiene and Redistribution Standards
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-stone-600 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-950">
            <p className="font-bold mb-1">
              Food safety is a core requirement, not a disclaimer.
            </p>
            <p className="text-[11px] text-emerald-900/90">
              PLATEWISE / ANNAPATH operates under the Food Safety and Standards Authority of India (FSSAI) guidelines for surplus food redistribution (Food Safety and Standards (Recovery & Distribution of Surplus Food) Regulations).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5 mb-1 text-sm">
              <Thermometer className="w-4 h-4 text-red-600" />
              1. Temperature & Storage Conditions
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-stone-600 text-[11px]">
              <li>
                <strong>Hot Holding:</strong> Cooked items (thalis, gravies, rice, biryanis) must be stored at or above <strong>60°C (140°F)</strong> continuously prior to collection.
              </li>
              <li>
                <strong>Chilled Storage:</strong> Perishables and dairy must be maintained at or below <strong>5°C (41°F)</strong>.
              </li>
              <li>
                <strong>Ambient Items:</strong> Dry bakery products and sealed snacks must be kept in clean, moisture-controlled storage.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5 mb-1 text-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              2. Strict Safe Collection Deadlines
            </h4>
            <p className="text-[11px]">
              Every batch has an explicit collection deadline. Once expired, portions are immediately delisted from the discovery feed and cannot be booked. Never consume food that has been held past its safe window.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5 mb-1 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              3. Allergen Declarations & Dietary Classification
            </h4>
            <p className="text-[11px]">
              Providers must specify if products contain common allergens such as gluten, dairy (milk/ghee), nuts, or soy. Food items are categorized into Vegetarian, Non-Vegetarian, or Vegan with clear color indicators.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5 mb-1 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              4. Packaging & Handover Verification
            </h4>
            <p className="text-[11px]">
              All items must be handed over in food-grade, leak-proof, tamper-evident containers. Handover is cryptographically verified through unique 6-digit OTPs between hotel staff, recipients, and volunteers.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            I Understand the Safety Protocols
          </button>
        </div>
      </div>
    </div>
  );
};
