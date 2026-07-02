/**
 * MaternalPediatricModule.jsx — category: 'maternal_pediatric'
 * Growth charts, pregnancy timeline, vaccination log.
 */
import React, { useState } from "react";
import { Baby, CalendarClock, Syringe as VaccineIcon, TrendingUp } from "lucide-react";

const FIELD = "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40";

const VACCINES = ["BCG", "Hepatitis B", "DTaP", "Polio", "MMR", "Varicella", "Hib", "PCV"];

export default function MaternalPediatricModule({ patientId, patientType = "pediatric" }) {
  const [mode, setMode] = useState(patientType); // 'pediatric' | 'maternal'
  const [vaccineStatus, setVaccineStatus] = useState({});

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
          <Baby className="w-5 h-5 text-teal-300" /> Maternal & Pediatric Record
        </h3>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {["pediatric", "maternal"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                mode === m ? "bg-teal-500/20 text-teal-300" : "text-slate-400"
              }`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "pediatric" ? (
        <>
          {/* Growth chart entries */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" /> Growth Tracking
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div><label className="text-[10px] text-slate-500 mb-1 block">Height (cm)</label><input className={FIELD} placeholder="—" /></div>
              <div><label className="text-[10px] text-slate-500 mb-1 block">Weight (kg)</label><input className={FIELD} placeholder="—" /></div>
              <div><label className="text-[10px] text-slate-500 mb-1 block">Head Circ. (cm)</label><input className={FIELD} placeholder="—" /></div>
            </div>
          </div>

          {/* Vaccination log */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
              <VaccineIcon className="w-3.5 h-3.5 text-amber-300" /> Vaccination Log
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {VACCINES.map((v) => (
                <button
                  key={v}
                  onClick={() => setVaccineStatus((s) => ({ ...s, [v]: !s[v] }))}
                  className={`py-3 rounded-xl text-xs font-semibold border transition-all ${
                    vaccineStatus[v]
                      ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                      : "bg-white/5 border-white/10 text-slate-400"
                  }`}
                >
                  {v} {vaccineStatus[v] ? "✓" : ""}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Pregnancy timeline */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
              <CalendarClock className="w-3.5 h-3.5 text-violet-300" /> Pregnancy Timeline
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div><label className="text-[10px] text-slate-500 mb-1 block">LMP Date</label><input type="date" className={FIELD} /></div>
              <div><label className="text-[10px] text-slate-500 mb-1 block">Gestational Age</label><input className={FIELD} placeholder="weeks" /></div>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-400 to-teal-400" style={{ width: "45%" }} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">Trimester 2 · Estimated due date shown once LMP is set</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Prenatal Notes</label>
            <textarea className={`${FIELD} min-h-[80px] resize-y`}
              placeholder="Fundal height, fetal heart rate, ultrasound findings…" />
          </div>
        </>
      )}
    </div>
  );
}
