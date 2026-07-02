/**
 * BookingsView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Lists all pending online booking requests.
 * "Review & Charge" opens CheckoutModal (Step 5 — modals).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { Plus, Phone, Clock, Trash2 } from "lucide-react";
import { useClinic }      from "../context/ClinicContext";
import { useTranslation } from "../hooks/useTranslation";
import { fmtIQD }         from "../utils/formatters";
import { GlassPanel }     from "../components/ui/ui";

export default function BookingsView() {
  const {
    bookings, setSelectedBooking, setPaidSuccess,
    setSelectedGateway, setShowBookingForm,
    setBookings,
  } = useClinic();
  const { t } = useTranslation();

  const handleReview = (b) => {
    setSelectedGateway(null);
    setPaidSuccess(false);
    setSelectedBooking(b);
  };

  const handleDelete = (id) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="text-lg font-bold text-white">{t("bookingsTitle")}</h2>
        <button
          onClick={() => setShowBookingForm(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold shadow-md hover:scale-[1.03] transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />{t("addBookingTitle")}
        </button>
      </div>
      <p className="text-sm text-slate-400 mb-5">{t("bookingsSubtitle")}</p>

      <div className="flex flex-col gap-3">
        {bookings.filter((b) => b.status === "pending").map((b) => (
          <GlassPanel key={b.id} className="p-4 flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
              {b.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="text-sm font-medium text-white">{b.name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {b.phone}
              </p>
            </div>
            <div className="text-xs">
              <p className="text-slate-500">{t("bookingService")}</p>
              <p className="text-slate-200">{b.service}</p>
            </div>
            <div className="text-xs">
              <p className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />{t("bookingRequested")}
              </p>
              <p className="text-slate-200">{b.requested}</p>
            </div>
            <div className="text-sm font-bold text-white tabular-nums">{fmtIQD(b.amount)}</div>
            <button
              onClick={() => handleReview(b)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold shadow-lg hover:scale-[1.03] transition-all duration-200"
            >
              {t("reviewCharge")}
            </button>
            <button
              onClick={() => handleDelete(b.id)}
              title={t("deleteBookingBtn")}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </GlassPanel>
        ))}
        {bookings.filter((b) => b.status === "pending").length === 0 && (
          <GlassPanel className="p-8 text-center text-sm text-slate-500">—</GlassPanel>
        )}
      </div>
    </div>
  );
}
