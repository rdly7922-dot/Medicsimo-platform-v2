/**
 * SuperadminDashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Main shell for the platform owner dashboard.
 * Tabs: Clinics | Payments | Audit Log | Provision
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import {
  ShieldCheck, Building2, CreditCard,
  ClipboardList, Plus, LogOut,
} from "lucide-react";
import { supabase }           from "../../lib/supabase";
import ClinicsPanel           from "../components/ClinicsPanel";
import PaymentsPanel          from "../components/PaymentsPanel";
import AuditLogPanel          from "../components/AuditLogPanel";
import ProvisionClinicPanel   from "../components/ProvisionClinicPanel";

const TABS = [
  { key: "clinics",    label: "Clinic Workspaces", Icon: Building2      },
  { key: "payments",   label: "Payment Ledger",    Icon: CreditCard      },
  { key: "audit",      label: "Audit Log",         Icon: ClipboardList   },
  { key: "provision",  label: "New Clinic",        Icon: Plus            },
];

export default function SuperadminDashboard({ session }) {
  const [tab, setTab] = useState("clinics");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Medicsimo SaaS — Platform Owner</p>
            <p className="text-xs text-slate-400">{session?.user?.email}</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="ms-auto flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Supabase Connected
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-xs transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-white/10 bg-slate-950/40 px-6">
        <div className="flex gap-1 -mb-px">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                tab === key
                  ? "border-violet-400 text-white"
                  : "border-transparent text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="p-6">
        {tab === "clinics"   && <ClinicsPanel />}
        {tab === "payments"  && <PaymentsPanel />}
        {tab === "audit"     && <AuditLogPanel />}
        {tab === "provision" && <ProvisionClinicPanel onDone={() => setTab("clinics")} />}
      </main>
    </div>
  );
}
