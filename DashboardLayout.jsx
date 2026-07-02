/**
 * DashboardLayout.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The top-level clinic UI shell once a tenant workspace is authenticated.
 *
 * Responsibility:
 *   1. Apply global CSS animations and RTL direction.
 *   2. Render <Sidebar> + <Header> + the active <View>.
 *   3. Mount modals that need to float above everything
 *      (PasscodeModal, SettingsModal) — view-specific modals stay in their views.
 *
 * All routing is driven by context `view` string — no react-router needed
 * for this single-page SaaS dashboard.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { lazy, Suspense } from "react";
import { useClinic }      from "../../context/ClinicContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useTranslation as useTrans } from "../../hooks/useTranslation";

import Sidebar from "./Sidebar";
import Header  from "./Header";

// ── Lazy-load every view ─────────────────────────────────────────────────────
const OverviewView         = lazy(() => import("../../views/OverviewView"));
const PatientsView         = lazy(() => import("../../views/PatientsView"));
const BookingsView         = lazy(() => import("../../views/BookingsView"));
const LoyaltyView          = lazy(() => import("../../views/LoyaltyView"));
const AIIntelligenceView   = lazy(() => import("../../views/AIIntelligenceView"));
const ExecutiveReportView  = lazy(() => import("../../views/ExecutiveReportView"));
const InventoryView        = lazy(() => import("../../views/InventoryView"));
const PlatformSettingsView = lazy(() => import("../../views/PlatformSettingsView"));

// ── Lazy-load all modals ─────────────────────────────────────────────────────
const PasscodeModal = lazy(() => import("../modals/PasscodeModal"));
const {
  SettingsModal, CheckoutModal, PatientFormModal, BookingFormModal,
  ExpenseFormModal, InventoryFormModal, FeedbackModal, DeleteConfirmModal,
} = await import("../modals/AppModals").catch(() => ({}));

// Non-async re-import pattern for lazy (workaround for named exports + lazy)
const LazySettingsModal   = lazy(() => import("../modals/AppModals").then((m) => ({ default: m.SettingsModal   })));
const LazyCheckoutModal   = lazy(() => import("../modals/AppModals").then((m) => ({ default: m.CheckoutModal   })));
const LazyPatientForm     = lazy(() => import("../modals/AppModals").then((m) => ({ default: m.PatientFormModal })));
const LazyBookingForm     = lazy(() => import("../modals/AppModals").then((m) => ({ default: m.BookingFormModal })));
const LazyExpenseForm     = lazy(() => import("../modals/AppModals").then((m) => ({ default: m.ExpenseFormModal })));
const LazyInventoryForm   = lazy(() => import("../modals/AppModals").then((m) => ({ default: m.InventoryFormModal })));
const LazyFeedbackModal   = lazy(() => import("../modals/AppModals").then((m) => ({ default: m.FeedbackModal   })));
const LazyDeleteConfirm   = lazy(() => import("../modals/AppModals").then((m) => ({ default: m.DeleteConfirmModal })));

/** Lightweight spinner shown while a lazy chunk loads */
function ViewLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-teal-400/30 border-t-teal-400 animate-spin" />
    </div>
  );
}

/** SelfHealing Error Boundary — catches render crashes, offers soft/hard reload */
class SelfHealingBoundary extends React.Component {
  state = { hasError: false, msg: "" };
  static getDerivedStateFromError(e) { return { hasError: true, msg: e?.message || "Unknown error" }; }
  componentDidCatch(e, info) { console.error("[SelfHealingBoundary]", e, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm backdrop-blur-md bg-slate-800/60 border border-white/10 rounded-2xl p-7 text-center">
          <p className="text-white font-bold mb-2">Something went wrong</p>
          <p className="text-[11px] text-slate-500 font-mono break-all mb-6">{this.state.msg}</p>
          <button onClick={() => window.location.reload()} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold mb-2">
            Reload App
          </button>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm">
            Reset Local Data &amp; Reload
          </button>
        </div>
      </div>
    );
  }
}

export default function DashboardLayout() {
  const {
    view,
    showPasscodeModal, showSettingsModal,
    selectedBooking,
    showPatientForm, showBookingForm,
    showAddExpense, editingExpense,
    showInventoryForm,
    pendingFeedbackPatientId,
    pendingDeletePatientId,  setPendingDeletePatientId,  deletePatient,
    pendingDeleteExpenseId,  setPendingDeleteExpenseId,  deleteExpense,
    pendingDeleteItemId,     setPendingDeleteItemId,     deleteInventoryItem,
  } = useClinic();
  const { isRtl, t } = useTranslation();

  return (
    <SelfHealingBoundary>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-slate-100 font-sans"
      >
        {/* Global CSS animations — injected once */}
        <style>{`
          @keyframes backdropFadeIn { from{opacity:0} to{opacity:1} }
          @keyframes modalSpringIn  {
            0%  {opacity:0;transform:scale(0.92) translateY(12px)}
            60% {opacity:1;transform:scale(1.015) translateY(-2px)}
            100%{opacity:1;transform:scale(1) translateY(0)}
          }
          @keyframes chipPop { 0%{opacity:0;transform:scale(0.85)} 100%{opacity:1;transform:scale(1)} }
          .anim-backdrop{animation:backdropFadeIn 0.18s ease-out}
          .anim-modal   {animation:modalSpringIn  0.32s cubic-bezier(0.34,1.56,0.64,1)}
          .anim-chip    {animation:chipPop        0.22s cubic-bezier(0.34,1.56,0.64,1)}
        `}</style>

        <div className="flex flex-col md:flex-row min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 w-full">
            <Header />
            <main className="flex-1 w-full p-4 md:p-6 overflow-y-auto">
              <Suspense fallback={<ViewLoader />}>
                {view === "overview"         && <OverviewView />}
                {view === "patients"         && <PatientsView />}
                {view === "bookings"         && <BookingsView />}
                {view === "loyalty"          && <LoyaltyView />}
                {view === "ai"               && <AIIntelligenceView />}
                {view === "executive"        && <ExecutiveReportView />}
                {view === "inventory"        && <InventoryView />}
                {view === "platformSettings" && <PlatformSettingsView />}
              </Suspense>
            </main>
          </div>
        </div>

        {/* ── All floating modals ── */}
        <Suspense fallback={null}>
          {showPasscodeModal                    && <PasscodeModal />}
          {showSettingsModal                    && <LazySettingsModal />}
          {selectedBooking                      && <LazyCheckoutModal />}
          {showPatientForm                      && <LazyPatientForm />}
          {showBookingForm                      && <LazyBookingForm />}
          {(showAddExpense || editingExpense)    && <LazyExpenseForm />}
          {showInventoryForm                    && <LazyInventoryForm />}
          {pendingFeedbackPatientId             && <LazyFeedbackModal />}

          {/* Delete confirmations */}
          {pendingDeletePatientId && (
            <LazyDeleteConfirm
              title={t("deleteConfirmTitle")}
              message={t("deleteConfirmMsg")}
              onCancel={() => setPendingDeletePatientId(null)}
              onConfirm={() => deletePatient(pendingDeletePatientId)}
            />
          )}
          {pendingDeleteExpenseId && (
            <LazyDeleteConfirm
              title={t("deleteExpenseConfirmTitle")}
              message={t("deleteExpenseConfirmMsg")}
              onCancel={() => setPendingDeleteExpenseId(null)}
              onConfirm={() => deleteExpense(pendingDeleteExpenseId)}
            />
          )}
          {pendingDeleteItemId && (
            <LazyDeleteConfirm
              title={t("deleteItemConfirmTitle")}
              message={t("deleteItemConfirmMsg")}
              onCancel={() => setPendingDeleteItemId(null)}
              onConfirm={() => deleteInventoryItem(pendingDeleteItemId)}
            />
          )}
        </Suspense>
      </div>
    </SelfHealingBoundary>
  );
}
