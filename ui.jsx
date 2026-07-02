/**
 * ui.jsx — Shared atomic UI components
 * ─────────────────────────────────────────────────────────────────────────────
 * GlassPanel  — the dark-glass card surface used everywhere
 * StatCard    — overview KPI tile with gradient icon + sub-label
 * StatusDot   — animated pulsing dot for patient status
 * ProgressBar — thin horizontal fill bar
 * Lockable    — blurs children and shows a lock overlay for secretary role
 * StarRow     — read-only star rating display (used in reviews)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { Lock, ArrowUpRight } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

/* ── GlassPanel ─────────────────────────────────────────────────────────── */
export function GlassPanel({ children, className = "", style }) {
  return (
    <div
      className={
        "backdrop-blur-md bg-slate-800/60 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 " +
        className
      }
      style={style}
    >
      {children}
    </div>
  );
}

/* ── StatCard ────────────────────────────────────────────────────────────── */
export function StatCard({ icon: Icon, label, value, accent, sub, SubIcon = ArrowUpRight }) {
  return (
    <GlassPanel className="p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-2 tabular-nums">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accent} shadow-lg shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {sub && (
        <div className="flex items-center gap-1 mt-3 text-xs text-emerald-400">
          <SubIcon className="w-3.5 h-3.5" />
          <span>{sub}</span>
        </div>
      )}
    </GlassPanel>
  );
}

/* ── StatusDot ───────────────────────────────────────────────────────────── */
const STATUS_COLORS = {
  waiting:    "bg-amber-400",
  withDoctor: "bg-sky-400",
  done:       "bg-emerald-400",
};

export function StatusDot({ status }) {
  const color = STATUS_COLORS[status] ?? "bg-slate-400";
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {status !== "done" && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

/* ── ProgressBar ─────────────────────────────────────────────────────────── */
export function ProgressBar({ pct, colorClass }) {
  return (
    <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

/* ── Lockable ────────────────────────────────────────────────────────────── */
export function Lockable({ locked, className = "", children }) {
  const { t } = useTranslation();
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      <div className={locked ? "blur-md select-none pointer-events-none" : ""}>{children}</div>
      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-slate-950/55 border border-white/10 rounded-2xl">
          <div className="flex flex-col items-center text-center px-6 max-w-[240px]">
            <div className="p-3 rounded-full bg-rose-500/15 border border-rose-400/30 mb-3">
              <Lock className="w-5 h-5 text-rose-300" />
            </div>
            <p className="text-xs font-semibold text-slate-200 leading-relaxed">{t("lockedMessage")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── StarRow ─────────────────────────────────────────────────────────────── */
export function StarRow({ value, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${value} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.round(value) ? "text-amber-400" : "text-slate-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
