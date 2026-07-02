/**
 * InventoryView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Clinic consumables inventory with quantity, minimum alert level,
 * expiry date, and stock-status badges.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo } from "react";
import { Warehouse, Plus, Pencil, Trash2 } from "lucide-react";
import { useClinic }      from "../context/ClinicContext";
import { useTranslation } from "../hooks/useTranslation";
import { GlassPanel }     from "../components/ui/ui";

function stockStatus(item) {
  const today = new Date().toISOString().slice(0, 10);
  if (item.expiry && item.expiry < today) return "expired";
  if (item.quantity <= item.minLevel)     return "low";
  return "safe";
}

const STATUS_STYLES = {
  safe:    "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  low:     "bg-amber-500/15  text-amber-300  border-amber-400/30",
  expired: "bg-rose-500/15   text-rose-300   border-rose-400/30",
};

export default function InventoryView() {
  const {
    inventory,
    setShowInventoryForm,
    setPendingDeleteItemId,
  } = useClinic();
  const { t } = useTranslation();

  const sorted = useMemo(() => [...inventory].sort((a, b) => {
    const order = { expired: 0, low: 1, safe: 2 };
    return order[stockStatus(a)] - order[stockStatus(b)];
  }), [inventory]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-teal-300" />{t("navInventory")}
        </h2>
        <button
          onClick={() => setShowInventoryForm("add")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold shadow-md hover:scale-[1.03] transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />{t("addItemBtn")}
        </button>
      </div>
      <p className="text-sm text-slate-400 mb-5">{t("inventorySubtitle")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((item) => {
          const status = stockStatus(item);
          return (
            <GlassPanel key={item.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white leading-snug flex-1">{item.name}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${STATUS_STYLES[status]}`}>
                  {t(status === "safe" ? "stockSafe" : status === "low" ? "stockLow" : "stockExpired")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-[10px] text-slate-500 mb-0.5">{t("quantityLabel")}</p>
                  <p className={`text-sm font-bold tabular-nums ${status === "low" || status === "expired" ? "text-rose-300" : "text-white"}`}>
                    {item.quantity}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-[10px] text-slate-500 mb-0.5">{t("minLevelLabel")}</p>
                  <p className="text-sm font-bold text-slate-300 tabular-nums">{item.minLevel}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-[10px] text-slate-500 mb-0.5">{t("expiryLabel")}</p>
                  <p className={`text-[11px] font-medium tabular-nums ${status === "expired" ? "text-rose-300" : "text-slate-300"}`}>
                    {item.expiry || "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowInventoryForm(item.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-teal-300 hover:bg-white/10 transition-colors"
                >
                  <Pencil className="w-3 h-3" />{t("editBtn")}
                </button>
                <button
                  onClick={() => setPendingDeleteItemId(item.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />{t("deleteBtn")}
                </button>
              </div>
            </GlassPanel>
          );
        })}
        {inventory.length === 0 && (
          <GlassPanel className="p-8 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">—</GlassPanel>
        )}
      </div>
    </div>
  );
}
