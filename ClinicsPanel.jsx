/**
 * ClinicsPanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Lists every clinic workspace with their subscription status.
 * Superadmin can activate (N months) or suspend any clinic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2, CheckCircle2, XCircle, Clock,
  RefreshCw, Loader2, ChevronDown,
} from "lucide-react";
import {
  fetchAllClinics,
  activateClinic,
  suspendClinic,
} from "../../services/superadminService";

const STATUS_STYLES = {
  active:    "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  trial:     "bg-amber-500/15  text-amber-300  border-amber-400/30",
  suspended: "bg-rose-500/15   text-rose-300   border-rose-400/30",
  cancelled: "bg-slate-500/15  text-slate-300  border-slate-400/30",
};

const STATUS_ICONS = {
  active:    CheckCircle2,
  trial:     Clock,
  suspended: XCircle,
  cancelled: XCircle,
};

const MONTHS_OPTIONS = [1, 3, 6, 12];
const GATEWAYS       = ["manual", "zain_cash", "fib", "asia_hawala", "qi_card"];

function ActivateModal({ clinic, onClose, onDone }) {
  const [months,  setMonths]  = useState(1);
  const [amount,  setAmount]  = useState(25);
  const [gateway, setGateway] = useState("manual");
  const [ref,     setRef]     = useState("");
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleActivate = async () => {
    setLoading(true);
    setError("");
    const { error: err } = await activateClinic({
      clinicId:      clinic.clinic_id,
      months,
      amountUsd:     amount,
      paymentMethod: gateway,
      paymentRef:    ref.trim() || null,
      notes:         notes.trim() || null,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onDone();
  };

  const field = "w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-white/10 rounded-2xl shadow-2xl p-6">
        <h3 className="font-bold text-white mb-1">Activate Subscription</h3>
        <p className="text-xs text-slate-400 mb-5">
          {clinic.clinic_name} · <span className="font-mono text-slate-500">{clinic.workspace_id}</span>
        </p>

        <div className="flex flex-col gap-4">
          {/* Duration */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Duration (months)</label>
            <div className="flex gap-2">
              {MONTHS_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    months === m
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md"
                      : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {m}mo
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Amount (USD)</label>
            <input
              type="number" min="0" value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className={field}
            />
          </div>

          {/* Gateway */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Payment Method</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className={`${field} appearance-none cursor-pointer`}
            >
              {GATEWAYS.map((g) => (
                <option key={g} value={g} className="bg-slate-800">{g.replace("_", " ").toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Payment Reference (optional)</label>
            <input
              value={ref} onChange={(e) => setRef(e.target.value)}
              placeholder="Gateway transaction ID"
              className={field}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={field} />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleActivate}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Activate {months}mo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClinicsPanel() {
  const [clinics,       setClinics]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activatingFor, setActivatingFor] = useState(null);
  const [suspending,    setSuspending]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchAllClinics();
    setClinics(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSuspend = async (clinic) => {
    setSuspending(clinic.clinic_id);
    await suspendClinic(clinic.clinic_id, "Suspended by platform owner");
    await load();
    setSuspending(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-300" />
            Clinic Workspaces
          </h2>
          <p className="text-sm text-slate-400">{clinics.length} total tenants</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {clinics.length === 0 && (
          <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm">
            No clinics provisioned yet. Use the "New Clinic" tab to add one.
          </div>
        )}
        {clinics.map((c) => {
          const StatusIcon = STATUS_ICONS[c.subscription_status] ?? Clock;
          return (
            <div
              key={c.clinic_id}
              className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 flex items-start gap-4 flex-wrap"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                {c.workspace_id?.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-[160px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{c.clinic_name}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[c.subscription_status]}`}>
                    <StatusIcon className="w-3 h-3 inline me-1" />
                    {c.subscription_status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{c.workspace_id}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.owner_email}</p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs flex-wrap">
                <div className="text-center">
                  <p className="text-slate-500">Patients</p>
                  <p className="font-bold text-white tabular-nums">{c.patient_count ?? 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">This Month</p>
                  <p className="font-bold text-emerald-300 tabular-nums">${Number(c.revenue_this_month_usd ?? 0).toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Expires</p>
                  <p className={`font-bold tabular-nums ${c.subscription_expires_at ? "text-white" : "text-slate-500"}`}>
                    {c.subscription_expires_at
                      ? new Date(c.subscription_expires_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setActivatingFor(c)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold shadow-md hover:scale-[1.03] transition-all"
                >
                  Activate
                </button>
                {c.subscription_status !== "suspended" && (
                  <button
                    onClick={() => handleSuspend(c)}
                    disabled={suspending === c.clinic_id}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {suspending === c.clinic_id && <Loader2 className="w-3 h-3 animate-spin" />}
                    Suspend
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activate modal */}
      {activatingFor && (
        <ActivateModal
          clinic={activatingFor}
          onClose={() => setActivatingFor(null)}
          onDone={() => { setActivatingFor(null); load(); }}
        />
      )}
    </div>
  );
}
