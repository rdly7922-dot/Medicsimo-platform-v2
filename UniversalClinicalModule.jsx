/**
 * UniversalClinicalModule.jsx — categories: 'internal_medicine', 'general_medical'
 * SOAP notes, vitals, chronic condition tracking, prescriptions.
 * The default fallback module — covers cardiology, GP, endocrinology, etc.
 */
import React, { useState } from "react";
import { Stethoscope, Activity, Pill, Heart } from "lucide-react";

const FIELD = "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40";

const VITALS = [
  { key: "bp",    label: "Blood Pressure", unit: "mmHg",  placeholder: "120/80" },
  { key: "hr",    label: "Heart Rate",     unit: "bpm",   placeholder: "72" },
  { key: "temp",  label: "Temperature",    unit: "°C",    placeholder: "36.6" },
  { key: "spo2",  label: "SpO₂",           unit: "%",     placeholder: "98" },
  { key: "weight",label: "Weight",         unit: "kg",    placeholder: "70" },
  { key: "glucose",label: "Glucose",       unit: "mg/dL", placeholder: "95" },
];

export default function UniversalClinicalModule({ patientId }) {
  const [vitals, setVitals] = useState({});
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col gap-5">
      <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
        <Stethoscope className="w-5 h-5 text-teal-300" /> Clinical Record
      </h3>

      {/* Vitals grid — 2 cols mobile, 3 cols tablet */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
          <Heart className="w-3.5 h-3.5 text-rose-300" /> Vitals
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {VITALS.map((v) => (
            <div key={v.key}>
              <label className="text-[10px] text-slate-500 mb-1 block">{v.label} ({v.unit})</label>
              <input
                className={FIELD}
                placeholder={v.placeholder}
                value={vitals[v.key] ?? ""}
                onChange={(e) => setVitals({ ...vitals, [v.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SOAP note */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
          <Activity className="w-3.5 h-3.5 text-sky-300" /> SOAP Note
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { key: "subjective", label: "Subjective" },
            { key: "objective",  label: "Objective" },
            { key: "assessment", label: "Assessment" },
            { key: "plan",       label: "Plan" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-[10px] text-slate-500 mb-1 block">{label}</label>
              <textarea
                className={`${FIELD} min-h-[70px] resize-y`}
                value={soap[key]}
                onChange={(e) => setSoap({ ...soap, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Prescription quick-add */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
          <Pill className="w-3.5 h-3.5 text-violet-300" /> Prescription
        </div>
        <div className="flex gap-2 flex-wrap">
          <input className={`${FIELD} flex-1 min-w-[140px]`} placeholder="Medication name" />
          <input className={`${FIELD} w-24`} placeholder="Dosage" />
          <input className={`${FIELD} w-24`} placeholder="Frequency" />
          <button className="px-4 py-2.5 rounded-xl bg-teal-500/15 border border-teal-400/30 text-teal-300 text-sm font-semibold shrink-0">
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
