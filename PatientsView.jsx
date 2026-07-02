/**
 * PatientsView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Three-column kanban board: Waiting → With Doctor → Done
 * Clicking a patient card opens the inline profile panel (PatientProfile).
 * All data and mutations come from ClinicContext — zero props.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from "react";
import {
  Activity, Plus, ChevronRight, MessageCircle,
  Receipt, Pill, HeartPulse, ScanLine, FileText, X, Pencil, Trash2,
} from "lucide-react";

import { useClinic }      from "../context/ClinicContext";
import { useTranslation } from "../hooks/useTranslation";
import { fmtIQD }         from "../utils/formatters";
import { buildWhatsAppLink } from "../utils/webhooks";
import { GlassPanel, StatusDot, Lockable, ProgressBar } from "../components/ui/ui";
import { SURVEY_LINK_PLACEHOLDER } from "../constants/seedData";

/* ── Tag chip section inside profile ────────────────────────────────────── */
function TagSection({ title, icon: Icon, tags, color, onAdd, onRemove }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  const handleAdd = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue("");
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-teal-300" />
        {title}
      </h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.length === 0 && <p className="text-xs text-slate-500">{t("noneRecorded")}</p>}
        {tags.map((tag, i) => (
          <span key={i} className={`anim-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border ${color}`}>
            {tag}
            <button onClick={() => onRemove(i)} className="hover:text-rose-300 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={t("addTagPlaceholder")}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={!value.trim()}
          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
            value.trim()
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:scale-[1.03]"
              : "bg-white/5 text-slate-500 cursor-not-allowed"
          }`}
        >
          {t("addTagBtn")}
        </button>
      </div>
    </div>
  );
}

/* ── Single patient card in the kanban column ────────────────────────────── */
function PatientCard({ patient, onSelect, onAdvance }) {
  const { t } = useTranslation();
  const canAdvance = patient.status !== "done";

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const msg = `${t("whatsAppSurveyMessage")} ${SURVEY_LINK_PLACEHOLDER}`;
    window.open(buildWhatsAppLink(patient.phone, msg), "_blank");
  };

  return (
    <div className="w-full flex items-center gap-2 rounded-xl bg-white/5 border border-white/5 hover:border-teal-400/30 hover:bg-white/10 transition-all duration-200 group">
      <button onClick={() => onSelect(patient)} className="flex-1 text-start p-3.5 flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {patient.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{patient.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{patient.reason}</p>
        </div>
        <StatusDot status={patient.status} />
      </button>
      {patient.status === "done" && patient.phone && (
        <button onClick={handleWhatsApp} title={t("sendWhatsAppSurvey")}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors shrink-0">
          <MessageCircle className="w-4 h-4" />
        </button>
      )}
      {canAdvance && (
        <button onClick={(e) => { e.stopPropagation(); onAdvance(patient); }} title={t("moveToNextStage")}
          className="p-2 me-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 transition-colors shrink-0">
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/* ── Patient profile slide-over panel ───────────────────────────────────── */
function PatientProfile({ patient, onClose }) {
  const {
    role, setShowPatientForm, setSelectedPatient,
    setPendingDeletePatientId,
    addClinicalNote, addPatientTag, removePatientTag,
  } = useClinic();
  const { t } = useTranslation();

  const isSecretary = role === "secretary";
  const remaining   = patient.totalCost - patient.paid;
  const pct         = patient.totalCost > 0 ? Math.round((patient.paid / patient.totalCost) * 100) : 0;

  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText]   = useState("");
  const [noteBy, setNoteBy]       = useState("");

  const handleAddNote = () => {
    if (!noteTitle.trim() && !noteText.trim()) return;
    addClinicalNote(patient.id, {
      date:  new Date().toISOString().slice(0, 10),
      title: noteTitle.trim() || "Clinical Note",
      note:  noteText.trim(),
      by:    noteBy.trim(),
    });
    setNoteTitle(""); setNoteText(""); setNoteBy("");
  };

  const handleEdit = () => {
    setSelectedPatient(patient);
    setShowPatientForm(patient.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-0 anim-modal">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between sticky top-0 bg-slate-800/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center font-bold text-white shrink-0">
              {patient.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <p className="font-bold text-white">{patient.name}</p>
              <p className="text-xs text-slate-400">
                {t("patientAge")}: {patient.age} {t("years")}
                {patient.phone ? ` · ${patient.phone}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isSecretary && (
              <>
                <button onClick={handleEdit} title={t("editPatientBtn")}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-teal-300 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => { setPendingDeletePatientId(patient.id); onClose(); }} title={t("deletePatientBtn")}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">{t("patientReason")}</p>
            <p className="text-sm text-white">{patient.reason}</p>
          </div>

          {/* Financials */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-300" />{t("financials")}
            </h4>
            <Lockable locked={isSecretary}>
              <GlassPanel className="p-4 bg-slate-900/50">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{t("totalCost")}</span>
                  <span className="text-white font-semibold">{fmtIQD(patient.totalCost)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{t("amountPaid")}</span>
                  <span className="text-emerald-400 font-semibold">{fmtIQD(patient.paid)}</span>
                </div>
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-slate-400">{t("remainingDebt")}</span>
                  <span className={`font-semibold ${remaining > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {fmtIQD(remaining)}
                  </span>
                </div>
                <ProgressBar pct={pct} colorClass="from-teal-400 to-emerald-500" />
              </GlassPanel>
            </Lockable>
          </div>

          {/* Medical tags */}
          <TagSection title={t("medicationsTitle")}       icon={Pill}       tags={patient.medications        || []} color="bg-sky-500/10 border-sky-400/30 text-sky-200"     onAdd={(v) => addPatientTag(patient.id, "medications", v)}       onRemove={(i) => removePatientTag(patient.id, "medications", i)} />
          <TagSection title={t("chronicConditionsTitle")} icon={HeartPulse} tags={patient.chronicConditions  || []} color="bg-rose-500/10 border-rose-400/30 text-rose-200"   onAdd={(v) => addPatientTag(patient.id, "chronicConditions", v)} onRemove={(i) => removePatientTag(patient.id, "chronicConditions", i)} />
          <TagSection title={t("diagnosticToolsTitle")}   icon={ScanLine}   tags={patient.diagnosticTools    || []} color="bg-violet-500/10 border-violet-400/30 text-violet-200" onAdd={(v) => addPatientTag(patient.id, "diagnosticTools", v)} onRemove={(i) => removePatientTag(patient.id, "diagnosticTools", i)} />

          {/* Clinical timeline */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-300" />{t("patientTimeline")}
            </h4>
            <div className="flex flex-col gap-0">
              {patient.timeline.length === 0 && <p className="text-xs text-slate-500 pb-3">{t("noNotesYet")}</p>}
              {patient.timeline.map((ev, i) => (
                <div key={i} className="flex gap-3 pb-5 relative">
                  {i !== patient.timeline.length - 1 && (
                    <span className="absolute top-3 start-[5px] w-px h-full bg-gradient-to-b from-teal-400/50 to-transparent" />
                  )}
                  <span className="relative mt-1.5 w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">{ev.date}</p>
                    <p className="text-sm font-medium text-white">{ev.title}</p>
                    <p className="text-xs text-slate-400">{ev.note}</p>
                    {ev.by && <p className="text-[11px] text-teal-300/80 mt-0.5">{t("performedByLabel")}: {ev.by}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Add clinical note */}
            <GlassPanel className="p-4 bg-slate-900/50 mt-2">
              <p className="text-xs font-semibold text-slate-300 mb-2.5">{t("addClinicalNoteTitle")}</p>
              <div className="flex flex-col gap-2">
                <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder={t("noteTitleLabel")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 transition-all" />
                <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={t("noteTextLabel")} rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 transition-all resize-none" />
                <input value={noteBy} onChange={(e) => setNoteBy(e.target.value)} placeholder={t("performedByLabel")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 transition-all" />
                <button onClick={handleAddNote} disabled={!noteTitle.trim() && !noteText.trim()}
                  className={`self-end flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    noteTitle.trim() || noteText.trim()
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:scale-[1.03]"
                      : "bg-white/5 text-slate-500 cursor-not-allowed"
                  }`}>
                  <Plus className="w-3.5 h-3.5" />{t("addNoteBtn")}
                </button>
              </div>
            </GlassPanel>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ── Main view ───────────────────────────────────────────────────────────── */
export default function PatientsView() {
  const { patients, searchQuery, setShowPatientForm, advancePatientStage } = useClinic();
  const { t } = useTranslation();
  const [profilePatient, setProfilePatient] = useState(null);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return q ? patients.filter((p) => p.name.toLowerCase().includes(q) || p.reason?.toLowerCase().includes(q)) : patients;
  }, [patients, searchQuery]);

  const grouped = useMemo(() => ({
    waiting:    filtered.filter((p) => p.status === "waiting"),
    withDoctor: filtered.filter((p) => p.status === "withDoctor"),
    done:       filtered.filter((p) => p.status === "done"),
  }), [filtered]);

  const COLUMNS = [
    { key: "waiting",    labelKey: "statusWaiting",    dot: "bg-amber-400" },
    { key: "withDoctor", labelKey: "statusWithDoctor", dot: "bg-sky-400"   },
    { key: "done",       labelKey: "statusDone",       dot: "bg-emerald-400" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-300" />{t("waitingRoomTitle")}
        </h2>
        <button onClick={() => setShowPatientForm("add")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold shadow-md hover:scale-[1.03] transition-all duration-200">
          <Plus className="w-3.5 h-3.5" />{t("addPatientBtn")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {COLUMNS.map((col) => (
          <GlassPanel key={col.key} className="p-4">
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <h3 className="text-sm font-semibold text-white">{t(col.labelKey)}</h3>
              <span className="ms-auto text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                {grouped[col.key].length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {grouped[col.key].map((p) => (
                <PatientCard key={p.id} patient={p} onSelect={setProfilePatient} onAdvance={advancePatientStage} />
              ))}
              {grouped[col.key].length === 0 && <p className="text-xs text-slate-500 text-center py-6">—</p>}
            </div>
          </GlassPanel>
        ))}
      </div>

      {profilePatient && (
        <PatientProfile patient={profilePatient} onClose={() => setProfilePatient(null)} />
      )}
    </div>
  );
}
