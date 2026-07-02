/**
 * SurgicalNotesModule.jsx — category: 'surgical'
 * Pre-op checklist, operative note, anesthesia log, post-op recovery.
 */
import React, { useState } from "react";
import { Scissors, ClipboardCheck, Syringe, Activity } from "lucide-react";

const FIELD = "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40";
const TEXTAREA = FIELD + " min-h-[90px] resize-y";

const SECTIONS = [
  { key: "preop",  label: "Pre-Operative",  Icon: ClipboardCheck, color: "text-sky-300" },
  { key: "anesthesia", label: "Anesthesia Log", Icon: Syringe, color: "text-amber-300" },
  { key: "operative", label: "Operative Note", Icon: Scissors, color: "text-rose-300" },
  { key: "postop", label: "Post-Operative",  Icon: Activity, color: "text-emerald-300" },
];

export default function SurgicalNotesModule({ patientId }) {
  const [active, setActive] = useState("preop");
  const [notes, setNotes] = useState({ preop: "", anesthesia: "", operative: "", postop: "" });

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col gap-4">
      <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
        <Scissors className="w-5 h-5 text-teal-300" /> Surgical Record
      </h3>

      {/* Tab bar — large touch targets for iPad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {SECTIONS.map(({ key, label, Icon, color }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border transition-all ${
              active === key
                ? "bg-teal-500/15 border-teal-400/40"
                : "bg-white/5 border-white/10"
            }`}
          >
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-[11px] font-semibold text-slate-200">{label}</span>
          </button>
        ))}
      </div>

      {/* Active section content */}
      <div className="flex flex-col gap-3">
        {active === "preop" && (
          <>
            <label className="text-xs font-semibold text-slate-300">Pre-Op Checklist & Consent</label>
            <textarea className={TEXTAREA} placeholder="Consent signed, NPO status, allergies confirmed, site marked…"
              value={notes.preop} onChange={(e) => setNotes({ ...notes, preop: e.target.value })} />
          </>
        )}
        {active === "anesthesia" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Type</label>
                <select className={FIELD}>
                  <option className="bg-slate-800">General</option>
                  <option className="bg-slate-800">Local</option>
                  <option className="bg-slate-800">Regional</option>
                  <option className="bg-slate-800">Sedation</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">ASA Class</label>
                <select className={FIELD}>
                  {["I","II","III","IV","V"].map(c => <option key={c} className="bg-slate-800">{c}</option>)}
                </select>
              </div>
            </div>
            <textarea className={TEXTAREA} placeholder="Induction agent, dosage, monitoring vitals throughout…"
              value={notes.anesthesia} onChange={(e) => setNotes({ ...notes, anesthesia: e.target.value })} />
          </>
        )}
        {active === "operative" && (
          <>
            <label className="text-xs font-semibold text-slate-300">Operative Note</label>
            <textarea className={TEXTAREA} placeholder="Procedure performed, findings, technique, complications, estimated blood loss…"
              value={notes.operative} onChange={(e) => setNotes({ ...notes, operative: e.target.value })} />
          </>
        )}
        {active === "postop" && (
          <>
            <label className="text-xs font-semibold text-slate-300">Post-Op Recovery & Instructions</label>
            <textarea className={TEXTAREA} placeholder="Recovery room vitals, pain management plan, discharge criteria, follow-up date…"
              value={notes.postop} onChange={(e) => setNotes({ ...notes, postop: e.target.value })} />
          </>
        )}
      </div>
    </div>
  );
}
