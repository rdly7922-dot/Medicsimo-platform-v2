/**
 * NoShowRiskBadge.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * AI No-Show Risk badge component.
 * Accepts a `risk_score` (0–100) and renders a colour-coded pill.
 *
 * Score thresholds:
 *   High   ≥ 70  → crimson red
 *   Medium ≥ 40  → amber / yellow
 *   Low    < 40  → emerald green
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { Brain, AlertTriangle, Minus, CheckCircle2 } from "lucide-react";

function getRiskLevel(score) {
  if (score == null || score === undefined) return "unknown";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const RISK_CONFIG = {
  high: {
    label:     "High Risk",
    bg:        "bg-rose-500/15",
    border:    "border-rose-500/40",
    text:      "text-rose-400",
    dot:       "bg-rose-500",
    Icon:      AlertTriangle,
    glow:      "shadow-rose-500/20",
  },
  medium: {
    label:     "Medium Risk",
    bg:        "bg-amber-500/15",
    border:    "border-amber-500/40",
    text:      "text-amber-400",
    dot:       "bg-amber-400",
    Icon:      Minus,
    glow:      "shadow-amber-500/20",
  },
  low: {
    label:     "Low Risk",
    bg:        "bg-emerald-500/15",
    border:    "border-emerald-500/40",
    text:      "text-emerald-400",
    dot:       "bg-emerald-400",
    Icon:      CheckCircle2,
    glow:      "shadow-emerald-500/10",
  },
  unknown: {
    label:     "No Data",
    bg:        "bg-slate-500/10",
    border:    "border-slate-500/20",
    text:      "text-slate-500",
    dot:       "bg-slate-500",
    Icon:      Minus,
    glow:      "",
  },
};

/**
 * @param {{ risk_score: number, showScore?: boolean, size?: 'sm'|'md' }} props
 */
export default function NoShowRiskBadge({ risk_score, showScore = false, size = "sm" }) {
  const level  = getRiskLevel(risk_score);
  const config = RISK_CONFIG[level];
  const { Icon } = config;

  const isSm = size === "sm";

  return (
    <span
      title={`AI No-Show Risk: ${config.label}${risk_score != null ? ` (${risk_score}%)` : ""}`}
      className={`
        inline-flex items-center gap-1.5 font-semibold rounded-full border
        shadow-md ${config.glow} ${config.bg} ${config.border} ${config.text}
        ${isSm ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}
      `}
    >
      {/* Pulsing dot for high risk */}
      {level === "high" ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-60`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
      ) : (
        <Icon className={isSm ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
      )}

      <span className="whitespace-nowrap">
        {isSm ? config.label : `No-Show: ${config.label}`}
        {showScore && risk_score != null ? ` · ${risk_score}%` : ""}
      </span>

      {/* AI indicator chip */}
      <span className={`
        rounded-full px-1 py-px font-bold tracking-wide
        bg-white/10 text-[8px] uppercase
        ${isSm ? "hidden" : "inline"}
      `}>
        AI
      </span>
    </span>
  );
}
