/**
 * TenantGate.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The workspace login screen shown before any clinic data is accessible.
 * Reads lang / setLang / joinTenant / tenantBlockedMsg from ClinicContext.
 * No props needed — fully context-driven.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import { Stethoscope, ChevronRight } from "lucide-react";
import { useClinic } from "../../context/ClinicContext";
import { useTranslation } from "../../hooks/useTranslation";
import { LANGS } from "../../utils/i18n";

export default function TenantGate() {
  const { joinTenant, tenantBlockedMsg, setLang, lang } = useClinic();
  const { t, isRtl } = useTranslation();
  const [value, setValue] = useState("");

  const handleJoin = () => {
    if (!value.trim()) return;
    joinTenant(value);
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-slate-100 font-sans flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* Language switcher */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-0.5">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                  lang === l.code
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="backdrop-blur-md bg-slate-800/60 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-7">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 shadow-lg shadow-teal-500/30">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
          </div>

          <h1 className="text-lg font-bold text-white text-center mb-2 leading-snug">
            {t("tenantGateTitle")}
          </h1>
          <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
            {t("tenantGateDesc")}
          </p>

          {/* Blocked warning */}
          {tenantBlockedMsg && (
            <p className="text-xs text-rose-400 text-center mb-4 bg-rose-500/10 border border-rose-400/30 rounded-xl py-2 px-3">
              {t("tenantBlockedMessage")}
            </p>
          )}

          {/* Workspace input */}
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder={t("tenantIdPlaceholder")}
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400/40 transition-all mb-4 text-center"
          />

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={!value.trim()}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              value.trim()
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30 hover:scale-[1.02]"
                : "bg-white/5 text-slate-500 cursor-not-allowed"
            }`}
          >
            {t("tenantJoinBtn")}
            <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-slate-500 text-center mt-4">
            {t("tenantGateHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
