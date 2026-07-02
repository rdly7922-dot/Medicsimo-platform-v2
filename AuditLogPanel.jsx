/**
 * AuditLogPanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Read-only display of every action taken by the platform owner.
 * Written to by Postgres RPCs — cannot be forged from the frontend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from "react";
import { ClipboardList, RefreshCw, Loader2 } from "lucide-react";
import { fetchAuditLog } from "../../services/superadminService";

const ACTION_COLORS = {
  activate_subscription: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  suspend_clinic:        "bg-rose-500/15   text-rose-300   border-rose-400/30",
  provision_clinic:      "bg-violet-500/15 text-violet-300 border-violet-400/30",
};

export default function AuditLogPanel() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchAuditLog(100);
    setLogs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-violet-300" />
            Audit Log
          </h2>
          <p className="text-sm text-slate-400">
            Immutable record of all platform owner actions
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {logs.length === 0 && (
          <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm">
            No audit entries yet.
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-slate-800/60 border border-white/10 rounded-xl px-5 py-3.5 flex items-start gap-4 flex-wrap"
          >
            {/* Action badge */}
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 ${ACTION_COLORS[log.action] ?? "bg-white/5 text-slate-300 border-white/10"}`}>
              {log.action.replace(/_/g, " ").toUpperCase()}
            </span>

            {/* Details */}
            <div className="flex-1 min-w-[140px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-300 font-mono">
                  {log.target_type} · {String(log.target_id).slice(0, 8)}…
                </span>
              </div>
              {log.payload && Object.keys(log.payload).length > 0 && (
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate max-w-xs">
                  {JSON.stringify(log.payload).slice(0, 120)}
                </p>
              )}
            </div>

            {/* Timestamp */}
            <span className="text-xs text-slate-500 tabular-nums shrink-0">
              {new Date(log.created_at).toLocaleString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
