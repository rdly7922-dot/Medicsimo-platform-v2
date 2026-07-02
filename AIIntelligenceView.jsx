/**
 * AIIntelligenceView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Intelligence & Automation page.
 * Sections: patient satisfaction survey stats, internal feedback list,
 * complaints & suggestions box with AI-priority scoring.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, Star } from "lucide-react";
import { useClinic }      from "../context/ClinicContext";
import { useTranslation } from "../hooks/useTranslation";
import { GlassPanel, StarRow } from "../components/ui/ui";
import { SURVEY_STATS, NEGATIVE_REVIEW } from "../constants/seedData";
import { loadStored, saveStored, tenantKey } from "../utils/storage";

/* ── AI priority scorer (keyword heuristic matching original logic) ───────── */
function scorePriority(text) {
  const t = text.toLowerCase();
  if (!t.trim()) return 0;
  if (/urgent|emergency|critical|death|مات|وفاة|أزمة|طارئ|فوري/.test(t)) return 5;
  if (/serious|dangerous|severe|خطير|سيء جداً|بشدة/.test(t)) return 4;
  if (/pain|important|problem|ألم|مشكلة|مهم/.test(t)) return 3;
  if (/suggest|improve|better|اقتراح|تحسين|أفضل/.test(t)) return 2;
  return 1;
}

const PRIORITY_COLORS = {
  0: "bg-slate-700 text-slate-400",
  1: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30",
  2: "bg-sky-500/20 text-sky-300 border border-sky-400/30",
  3: "bg-amber-500/20 text-amber-300 border border-amber-400/30",
  4: "bg-orange-500/20 text-orange-300 border border-orange-400/30",
  5: "bg-rose-500/20 text-rose-300 border border-rose-400/30",
};

/* ── Survey stats card ───────────────────────────────────────────────────── */
function SurveysCard() {
  const { tenantId, lang } = useClinic();
  const { t } = useTranslation();
  const [autoSend, setAutoSend] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    loadStored(tenantKey(tenantId, "autoSend"), true).then((v) => setAutoSend(v));
  }, [tenantId]);

  const toggle = () => {
    const next = !autoSend;
    setAutoSend(next);
    if (tenantId) saveStored(tenantKey(tenantId, "autoSend"), next);
  };

  const tiles = [
    { label: t("ratingGeneral"),  value: SURVEY_STATS.general },
    { label: t("ratingDoctor"),   value: SURVEY_STATS.doctor  },
    { label: t("ratingWaitTime"), value: SURVEY_STATS.wait    },
  ];

  return (
    <GlassPanel className="p-6">
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h3 className="font-semibold text-white text-sm">{t("surveysTitle")}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{t("surveysSubtitle")}</p>
        </div>
        <button onClick={toggle} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
          <span className="text-[11px] text-slate-300 font-medium whitespace-nowrap">{t("autoSendToggleLabel")}</span>
          <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${autoSend ? "bg-gradient-to-r from-teal-500 to-cyan-500" : "bg-slate-600"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${autoSend ? "translate-x-4" : "translate-x-0.5"}`} />
          </span>
          <span className={`text-[11px] font-semibold whitespace-nowrap ${autoSend ? "text-emerald-400" : "text-slate-500"}`}>
            {autoSend ? t("autoSendOn") : t("autoSendOff")}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {tiles.map((tile, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-slate-400 mb-2">{tile.label}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-white tabular-nums">{tile.value.toFixed(1)}</span>
              <StarRow value={tile.value} />
            </div>
          </div>
        ))}
      </div>

      <GlassPanel className="p-4 bg-rose-500/5 border-rose-400/20">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-xs font-semibold text-rose-300">{t("negativeFlagTitle")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-900/40 border border-white/5">
            <p className="text-[11px] text-slate-500 mb-1">{NEGATIVE_REVIEW.patientName}</p>
            <p className="text-sm text-slate-200">{NEGATIVE_REVIEW.comment[lang] || NEGATIVE_REVIEW.comment.en}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-400/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className="text-[11px] font-semibold text-emerald-300">{t("aiSolutionLabel")}</p>
            </div>
            <p className="text-sm text-slate-200">{NEGATIVE_REVIEW.solution[lang] || NEGATIVE_REVIEW.solution.en}</p>
          </div>
        </div>
      </GlassPanel>
    </GlassPanel>
  );
}

/* ── Internal feedback list ──────────────────────────────────────────────── */
function InternalFeedbackList() {
  const { reviews } = useClinic();
  const { t } = useTranslation();

  const avg = (key) =>
    reviews.length ? reviews.reduce((s, r) => s + (r.ratings?.[key] || 0), 0) / reviews.length : 0;

  const metrics = [
    { key: "waitTime",   label: t("ratingWaitTime")    },
    { key: "doctorCare", label: t("ratingDoctor")      },
    { key: "cleanliness",label: t("feedbackCleanliness")},
    { key: "overall",    label: t("ratingGeneral")     },
  ];

  return (
    <GlassPanel className="p-6">
      <h3 className="font-semibold text-white text-sm">{t("internalFeedbackTitle")}</h3>
      <p className="text-xs text-slate-400 mt-0.5 mb-5">{t("internalFeedbackSubtitle")}</p>

      {reviews.length === 0 ? (
        <p className="text-xs text-slate-500">{t("noFeedbackYet")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {metrics.map((m) => (
              <div key={m.key} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 mb-1 truncate">{m.label}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white tabular-nums">{avg(m.key).toFixed(1)}</span>
                  <StarRow value={avg(m.key)} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
            {reviews.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
                <StarRow value={r.ratings?.overall || 0} />
                <span className="text-xs text-slate-300 truncate flex-1">{r.patientName}</span>
                <span className="text-[10px] text-slate-500 shrink-0">{r.date}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </GlassPanel>
  );
}

/* ── Complaints box ──────────────────────────────────────────────────────── */
function ComplaintsBox() {
  const { tenantId } = useClinic();
  const { t } = useTranslation();
  const [text, setText]           = useState("");
  const [submitted, setSubmitted] = useState([]);
  const [loaded, setLoaded]       = useState(false);
  const [justDone, setJustDone]   = useState(false);

  const level = scorePriority(text);

  useEffect(() => {
    if (!tenantId) return;
    loadStored(tenantKey(tenantId, "complaints"), []).then((v) => {
      setSubmitted(Array.isArray(v) ? v : []);
      setLoaded(true);
    });
  }, [tenantId]);

  useEffect(() => {
    if (!loaded || !tenantId) return;
    saveStored(tenantKey(tenantId, "complaints"), submitted);
  }, [submitted, loaded, tenantId]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    setSubmitted((prev) => [{ id: Date.now(), text, level }, ...prev].slice(0, 5));
    setText("");
    setJustDone(true);
  };

  const PRIORITY_LABELS = {
    1: t("priority1"), 2: t("priority2"), 3: t("priority3"),
    4: t("priority4"), 5: t("priority5"),
  };

  return (
    <GlassPanel className="p-6">
      <h3 className="font-semibold text-white text-sm">{t("complaintsTitle")}</h3>
      <p className="text-xs text-slate-400 mt-0.5 mb-4">{t("complaintsSubtitle")}</p>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setJustDone(false); }}
        placeholder={t("complaintsPlaceholder")}
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 transition-all resize-none mb-3"
      />

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">{t("priorityLabel")}:</span>
          {level > 0 ? (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${PRIORITY_COLORS[level]}`}>
              {level} — {PRIORITY_LABELS[level]}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">{t("complaintsEmptyHint")}</span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            text.trim()
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:scale-[1.03]"
              : "bg-white/5 text-slate-500 cursor-not-allowed"
          }`}
        >
          {t("complaintsSubmit")}
        </button>
      </div>

      {justDone && <p className="text-xs text-emerald-400 mb-2">{t("complaintsSubmittedMsg")}</p>}

      {submitted.length > 0 && (
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
          {submitted.map((s) => (
            <div key={s.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${PRIORITY_COLORS[s.level] || PRIORITY_COLORS[0]}`}>
                {s.level}
              </span>
              <p className="text-xs text-slate-300 truncate flex-1">{s.text}</p>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

/* ── Main view ───────────────────────────────────────────────────────────── */
export default function AIIntelligenceView() {
  return (
    <div className="flex flex-col gap-6">
      <SurveysCard />
      <InternalFeedbackList />
      <ComplaintsBox />
    </div>
  );
}
