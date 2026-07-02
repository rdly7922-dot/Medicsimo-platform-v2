/**
 * DentalChartModule.jsx — category: 'dental'
 * ─────────────────────────────────────────────────────────────────────────────
 * Interactive tooth chart (FDI numbering, 32 teeth) + root/status tracking.
 * Optimized for iPad: large tap targets (min 44px), no hover-only states.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState } from "react";
import { Circle, AlertCircle } from "lucide-react";

const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

const STATUS_COLORS = {
  healthy:   "bg-emerald-500/20 border-emerald-400 text-emerald-300",
  cavity:    "bg-rose-500/20 border-rose-400 text-rose-300",
  filled:    "bg-sky-500/20 border-sky-400 text-sky-300",
  extracted: "bg-slate-600/30 border-slate-500 text-slate-500 line-through",
  crown:     "bg-amber-500/20 border-amber-400 text-amber-300",
};

function Tooth({ num, status, onClick }) {
  return (
    <button
      onClick={() => onClick(num)}
      className={`w-9 h-9 md:w-10 md:h-10 rounded-lg border-2 flex items-center justify-center text-[10px] md:text-xs font-bold transition-all active:scale-95 ${STATUS_COLORS[status] ?? "bg-white/5 border-white/15 text-slate-400"}`}
    >
      {num}
    </button>
  );
}

export default function DentalChartModule({ patientId, initialChart = {} }) {
  const [chart, setChart] = useState(initialChart);
  const [selected, setSelected] = useState(null);

  const setStatus = (status) => {
    if (!selected) return;
    setChart((c) => ({ ...c, [selected]: status }));
  };

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Circle className="w-5 h-5 text-teal-300" />
        <h3 className="font-bold text-white text-base md:text-lg">Dental Chart — FDI Numbering</h3>
      </div>

      {/* Upper arch */}
      <div className="flex justify-center gap-1.5 md:gap-2 flex-wrap">
        {UPPER.map((n) => <Tooth key={n} num={n} status={chart[n]} onClick={setSelected} />)}
      </div>
      <div className="border-t border-dashed border-white/10" />
      {/* Lower arch */}
      <div className="flex justify-center gap-1.5 md:gap-2 flex-wrap">
        {LOWER.map((n) => <Tooth key={n} num={n} status={chart[n]} onClick={setSelected} />)}
      </div>

      {/* Status picker — appears when a tooth is selected */}
      {selected && (
        <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-white font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-300" />
            Tooth #{selected}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.keys(STATUS_COLORS).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`py-2.5 rounded-lg text-xs font-semibold border capitalize transition-all ${STATUS_COLORS[s]}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-500">
        Tap a tooth, then select its status. Root/canal maps and X-ray attachments
        can be added per-tooth in the full clinical record.
      </p>
    </div>
  );
}
