/**
 * Header.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Top navbar of the clinic dashboard.
 *
 * Contains:
 *   • Global search input (filters passed down to views via context)
 *   • Role toggle  (Secretary ↔ Chief Doctor, passcode-gated)
 *   • Language switcher (ar / en / bad / sor)
 *   • Security settings button
 *   • Avatar initials badge
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { Search, Lock, Settings, UserCog } from "lucide-react";
import { useClinic } from "./ClinicContext";
import { useTranslation } from "./useTranslation";
import { LANGS } from "./i18n";

export default function Header() {
  const {
    role, doctorUnlocked,
    requestDoctorRole, switchToSecretary,
    lang, setLang,
    searchQuery, setSearchQuery,
    setShowSettingsModal, setSettingsError, setSettingsSaved,
  } = useClinic();

  const { t } = useTranslation();

  const openSettings = () => {
    setSettingsError("");
    setSettingsSaved(false);
    setShowSettingsModal(true);
  };

  return (
    <header className="border-b border-white/10 bg-slate-950/30 backdrop-blur-md px-4 md:px-6 py-3 md:py-4 flex items-center gap-4 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 start-3" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 ps-9 pe-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400/40 transition-all"
        />
      </div>

      {/* Right cluster */}
      <div className="ms-auto flex items-center gap-3 flex-wrap justify-end">
        {/* Greeting — desktop only */}
        <div className="hidden lg:flex flex-col items-end">
          <p className="text-sm font-medium text-white">{t("greeting")}</p>
        </div>

        {/* Role toggle */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
          <UserCog className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium hidden md:inline whitespace-nowrap">
            {t("roleSimLabel")}
          </span>
          <div className="flex items-center bg-black/20 rounded-lg p-0.5 gap-0.5">
            {/* Doctor button */}
            <button
              onClick={requestDoctorRole}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                role === "doctor"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {!doctorUnlocked && <Lock className="w-3 h-3" />}
              {t("roleDoctor")}
            </button>

            {/* Secretary button */}
            <button
              onClick={switchToSecretary}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                role === "secretary"
                  ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("roleSecretary")}
            </button>
          </div>
        </div>

        {/* Security settings */}
        <button
          onClick={openSettings}
          title={t("settingsBtn")}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-teal-300 hover:bg-white/10 transition-colors shrink-0"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Language switcher */}
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

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shrink-0">
          DS
        </div>
      </div>
    </header>
  );
}
