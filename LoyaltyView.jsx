/**
 * LoyaltyView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows every patient as a card with their current loyalty-point balance.
 * +10 / +25 / +50 buttons award points directly via context.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { Award } from "lucide-react";
import { useClinic }      from "../context/ClinicContext";
import { useTranslation } from "../hooks/useTranslation";
import { GlassPanel }     from "../components/ui/ui";

const POINT_OPTIONS = [10, 25, 50];

export default function LoyaltyView() {
  const { patients, setPatients } = useClinic();
  const { t } = useTranslation();

  const awardPoints = (patientId, pts) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, loyaltyPoints: (p.loyaltyPoints || 0) + pts }
          : p
      )
    );
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-300" />
        {t("loyaltyTitle")}
      </h2>
      <p className="text-sm text-slate-400 mb-5">{t("loyaltySubtitle")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => (
          <GlassPanel key={p.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{p.phone}</p>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-400">{t("loyaltyPointsLabel")}</span>
              <span className="text-lg font-bold text-amber-300 tabular-nums">{p.loyaltyPoints || 0}</span>
            </div>

            <div className="flex gap-1.5">
              {POINT_OPTIONS.map((pts) => (
                <button
                  key={pts}
                  onClick={() => awardPoints(p.id, pts)}
                  className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-amber-200 text-[11px] font-semibold hover:scale-[1.03] transition-all duration-200"
                >
                  +{pts}
                </button>
              ))}
            </div>
          </GlassPanel>
        ))}
        {patients.length === 0 && (
          <GlassPanel className="p-8 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">—</GlassPanel>
        )}
      </div>
    </div>
  );
}
