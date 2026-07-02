/**
 * PlatformSettingsView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Platform-level settings:
 *   • WhatsApp / n8n webhook URL
 *   • Tenant workspace subscription management (activate / deactivate)
 *   • Chief Doctor passcode section shortcut
 *   • Offline sync status indicator
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import {
  Settings, Link, ShieldCheck, CloudOff, Check, KeyRound,
} from "lucide-react";
import { useClinic }      from "../context/ClinicContext";
import { useTranslation } from "../hooks/useTranslation";
import { GlassPanel }     from "../components/ui/ui";

export default function PlatformSettingsView() {
  const {
    webhookUrl, setWebhookUrl,
    tenantId, tenantRegistry, toggleTenantActive,
    setShowPasscodeModal, setShowSettingsModal,
    setSettingsError, setSettingsSaved,
  } = useClinic();
  const { t } = useTranslation();

  const [localUrl, setLocalUrl] = useState(webhookUrl);
  const [urlSaved, setUrlSaved] = useState(false);

  const saveUrl = () => {
    setWebhookUrl(localUrl.trim());
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2500);
  };

  const openPasscode = () => {
    setShowPasscodeModal(true);
  };

  const openSettings = () => {
    setSettingsError("");
    setSettingsSaved(false);
    setShowSettingsModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-300" />{t("navSettings")}
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">{t("platformSettingsSubtitle")}</p>
      </div>

      {/* Webhook URL */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Link className="w-4 h-4 text-teal-300" />
          <h3 className="font-semibold text-white text-sm">{t("webhookSectionTitle")}</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">{t("webhookSectionDesc")}</p>
        <div className="flex gap-2">
          <input
            value={localUrl}
            onChange={(e) => { setLocalUrl(e.target.value); setUrlSaved(false); }}
            placeholder="https://your-n8n-server.com/webhook/..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 transition-all"
          />
          <button
            onClick={saveUrl}
            className="px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold shadow-md hover:scale-[1.03] transition-all duration-200 shrink-0 flex items-center gap-1.5"
          >
            {urlSaved ? <Check className="w-4 h-4" /> : t("saveBtn")}
          </button>
        </div>
      </GlassPanel>

      {/* Workspace subscriptions */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-teal-300" />
          <h3 className="font-semibold text-white text-sm">{t("subscriptionSectionTitle")}</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">{t("subscriptionSectionDesc")}</p>

        <div className="flex flex-col gap-2">
          {tenantRegistry.length === 0 && (
            <p className="text-xs text-slate-500">—</p>
          )}
          {tenantRegistry.map((tenant) => {
            const isCurrent = tenant.id === tenantId;
            return (
              <div key={tenant.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {tenant.id.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm text-white flex-1 truncate">
                  {tenant.id}
                  {isCurrent && (
                    <span className="ms-2 text-[10px] bg-teal-500/20 text-teal-300 border border-teal-400/30 px-1.5 py-0.5 rounded-full">
                      {t("currentWorkspaceLabel")}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {tenant.createdAt || ""}
                </span>
                <button
                  onClick={() => toggleTenantActive(tenant.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                    tenant.active !== false
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-400/30"
                      : "bg-rose-500/15 text-rose-300 border border-rose-400/30 hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-400/30"
                  }`}
                >
                  {tenant.active !== false ? t("activeLabel") : t("inactiveLabel")}
                </button>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* Passcode section */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-teal-300" />
          <h3 className="font-semibold text-white text-sm">{t("passcodeSectionTitle")}</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">{t("passcodeSectionDesc")}</p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={openPasscode}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold shadow-md hover:scale-[1.03] transition-all duration-200"
          >
            <KeyRound className="w-3.5 h-3.5" />{t("doctorPasscodeTitle")}
          </button>
          <button
            onClick={openSettings}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/10 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />{t("settingsBtn")}
          </button>
        </div>
      </GlassPanel>

      {/* Offline sync indicator */}
      <GlassPanel className="p-4 flex items-center gap-3">
        <CloudOff className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-white">{t("offlineCacheLabel")}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{t("offlineCacheDesc")}</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      </GlassPanel>
    </div>
  );
}
