/**
 * PaymentsPanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Lists all payment transactions across every clinic tenant.
 * Superadmin read-only view — mutations happen via ClinicsPanel activate flow.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from "react";
import { CreditCard, RefreshCw, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { fetchPaymentTransactions } from "../../services/superadminService";

const STATUS_STYLES = {
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  pending:   "bg-amber-500/15  text-amber-300  border-amber-400/30",
  failed:    "bg-rose-500/15   text-rose-300   border-rose-400/30",
  refunded:  "bg-slate-500/15  text-slate-300  border-slate-400/30",
};

const STATUS_ICONS = {
  completed: CheckCircle2,
  pending:   Clock,
  failed:    XCircle,
  refunded:  XCircle,
};

const GATEWAY_LABELS = {
  zain_cash:   "Zain Cash",
  fib:         "FIB",
  asia_hawala: "AsiaHawala",
  qi_card:     "Qi Card",
  manual:      "Manual",
};

export default function PaymentsPanel() {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchPaymentTransactions(100);
    setTransactions(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Aggregate KPIs
  const totalRevenue = transactions
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + Number(t.amount_usd ?? 0), 0);

  const thisMonth = transactions
    .filter((t) => {
      if (t.status !== "completed") return false;
      const d = new Date(t.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + Number(t.amount_usd ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-violet-300" />
            Payment Ledger
          </h2>
          <p className="text-sm text-slate-400">{transactions.length} transactions</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Platform Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "text-emerald-300" },
          { label: "This Month",             value: `$${thisMonth.toFixed(2)}`,    color: "text-teal-300"    },
          { label: "Total Transactions",     value: String(transactions.length),   color: "text-white"       },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-slate-800/60 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-2">{kpi.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No payment transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="text-start px-5 py-3 font-semibold">Clinic</th>
                  <th className="text-start px-4 py-3 font-semibold">Gateway</th>
                  <th className="text-start px-4 py-3 font-semibold">Reference</th>
                  <th className="text-end   px-4 py-3 font-semibold">Amount</th>
                  <th className="text-start px-4 py-3 font-semibold">Status</th>
                  <th className="text-start px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const StatusIcon = STATUS_ICONS[tx.status] ?? Clock;
                  return (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{tx.clinics?.name ?? "—"}</p>
                        <p className="text-xs text-slate-500 font-mono">{tx.clinics?.workspace_id ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {GATEWAY_LABELS[tx.gateway] ?? tx.gateway}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        {tx.gateway_ref ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-end font-bold text-white tabular-nums">
                        ${Number(tx.amount_usd ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[tx.status]}`}>
                          <StatusIcon className="w-3 h-3" />
                          {tx.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs tabular-nums">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
