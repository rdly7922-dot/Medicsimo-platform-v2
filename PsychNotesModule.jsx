/**
 * PsychNotesModule.jsx — category: 'mental_health'
 * Private therapy notes. Highly restricted — separate RLS-guarded table
 * recommended (patient_notes.is_confidential = true) rather than the
 * general clinical notes table, so secretary-level roles cannot read it.
 */
import React, { useState } from "react";
import { Lock, BrainCog, Smile, ShieldAlert } from "lucide-react";

const FIELD = "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/40";

const MOOD_SCALE = ["😞", "😕", "😐", "🙂", "😄"];

export default function PsychNotesModule({ patientId, isDoctor = true }) {
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState("");
  const [riskFlag, setRiskFlag] = useState(false);

  // Non-doctor roles never see private therapy content
  if (!isDoctor) {
    return (
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <Lock className="w-8 h-8 text-slate-500" />
        <p className="text-sm text-slate-400">
          Mental health records are restricted to the attending clinician.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-violet-400/20 rounded-2xl p-4 md:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
          <BrainCog className="w-5 h-5 text-violet-300" /> Confidential Therapy Notes
        </h3>
        <span className="flex items-center gap-1 text-[10px] font-bold text-violet-300 bg-violet-500/15 border border-violet-400/30 px-2.5 py-1 rounded-full">
          <Lock className="w-3 h-3" /> DOCTOR-ONLY
        </span>
      </div>

      {/* Mood check-in */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
          <Smile className="w-3.5 h-3.5 text-amber-300" /> Session Mood Check-In
        </div>
        <div className="flex gap-2 justify-between">
          {MOOD_SCALE.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setMood(i)}
              className={`flex-1 py-3 rounded-xl text-2xl border transition-all ${
                mood === i ? "bg-violet-500/20 border-violet-400/50 scale-105" : "bg-white/5 border-white/10"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Private notes */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Session Notes (Encrypted)</label>
        <textarea
          className={`${FIELD} min-h-[130px] resize-y`}
          placeholder="Presenting concerns, therapeutic approach, homework assigned, next session focus…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Risk flag */}
      <button
        onClick={() => setRiskFlag((r) => !r)}
        className={`flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
          riskFlag
            ? "bg-rose-500/15 border-rose-400/40 text-rose-300"
            : "bg-white/5 border-white/10 text-slate-400"
        }`}
      >
        <ShieldAlert className="w-4 h-4" />
        {riskFlag ? "Safety Risk Flagged — Follow-up Required" : "Flag Safety Concern"}
      </button>
    </div>
  );
}
