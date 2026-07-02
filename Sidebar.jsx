/**
 * Sidebar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The persistent left-rail navigation for the clinic dashboard.
 *
 * Mobile: renders as a horizontal scrollable tab-bar pinned to the top.
 * Desktop (md+): renders as a 288px side panel.
 *
 * All active-state, locale, and tenant data come from ClinicContext.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Award,
  Brain,
  BarChart3,
  Warehouse,
  Settings,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useClinic } from "./ClinicContext";
import { useTranslation } from "./useTranslation";

export default function Sidebar() {
  const { view, setView, tenantId, switchTenant, lang } = useClinic();
  const { t } = useTranslation();

  // Kurdish scripts need slightly smaller text to avoid overflow
  const isKurdish = lang === "bad" || lang === "sor";

  const navItems = [
    { key: "overview",          icon: LayoutDashboard, labelKey: "navOverview"  },
    { key: "patients",          icon: Users,           labelKey: "navPatients"  },
    { key: "bookings",          icon: CalendarCheck,   labelKey: "navBookings"  },
    { key: "loyalty",           icon: Award,           labelKey: "navLoyalty"   },
    { key: "ai",                icon: Brain,           labelKey: "navAI"        },
    { key: "executive",         icon: BarChart3,       labelKey: "navExecutive" },
    { key: "inventory",         icon: Warehouse,       labelKey: "navInventory" },
    { key: "platformSettings",  icon: Settings,        labelKey: "navSettings"  },
  ];

  return (
    <aside className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-e border-white/10 bg-slate-950/40 backdrop-blur-md p-4 md:p-5 flex flex-col gap-4 md:gap-6">
      {/* Brand mark */}
      <div className="flex items-center gap-3 px-1">
        <div className="p-2 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 shadow-lg shadow-teal-500/20 shrink-0">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-snug break-words">{t("clinicName")}</p>
          <p className="text-[11px] text-slate-400">Multi-Tenant SaaS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-2 md:gap-1.5 -mx-1 px-1 pb-1 md:pb-0">
        {navItems.map(({ key, icon: Icon, labelKey }) => {
          const active = view === key;
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`w-full md:w-full shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-start whitespace-nowrap ${
                isKurdish ? "text-[12.5px]" : "text-sm"
              } ${
                active
                  ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-white border border-teal-400/30 shadow-inner"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-teal-300" : ""}`} />
              <span className="leading-snug">{t(labelKey)}</span>
              {active && (
                <ChevronRight className="w-3.5 h-3.5 ms-auto shrink-0 text-teal-300 hidden md:inline" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Tenant badge — desktop only */}
      <div className="hidden md:block mt-auto">
        <div className="backdrop-blur-md bg-slate-800/60 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-semibold text-white truncate">
              Tenant: {tenantId}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Iraq — Duhok Region</p>
          <button
            onClick={switchTenant}
            className="w-full text-[11px] text-teal-300 hover:text-teal-200 underline transition-colors text-start"
          >
            {t("switchWorkspaceBtn")}
          </button>
        </div>
      </div>
    </aside>
  );
}
