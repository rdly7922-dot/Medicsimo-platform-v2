/**
 * PasscodeModal.jsx — Chief Doctor passcode gate + recovery flow
 */
import React, { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { useClinic }      from "../../context/ClinicContext";
import { useTranslation } from "../../hooks/useTranslation";
import { GlassPanel }     from "../ui/ui";

export default function PasscodeModal() {
  const { setShowPasscodeModal, submitPasscode, submitRecovery,
          passcodeError, recoveryError, security } = useClinic();
  const { t } = useTranslation();

  const [mode, setMode]     = useState("login");
  const [code, setCode]     = useState("");
  const [answer, setAnswer] = useState("");
  const [newCode, setNewCode] = useState("");

  const fieldClass = "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 transition-all";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-sm p-6 anim-modal">
        {mode === "login" ? (
          <div className="flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-teal-500/15 border border-teal-400/30 mb-3">
              <KeyRound className="w-5 h-5 text-teal-300" />
            </div>
            <h3 className="font-bold text-white mb-1.5">{t("doctorPasscodeTitle")}</h3>
            <p className="text-sm text-slate-400 mb-5">{t("doctorPasscodeDesc")}</p>
            <input
              type="password" inputMode="numeric"
              value={code} onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPasscode(code)}
              placeholder={t("passcodePlaceholder")}
              className={`${fieldClass} text-center tracking-[0.4em] mb-3`}
            />
            {passcodeError && <p className="text-xs text-rose-400 mb-3">{t("incorrectPasscode")}</p>}
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowPasscodeModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">
                {t("cancelBtn")}
              </button>
              <button onClick={() => submitPasscode(code)} disabled={!code.trim()}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${code.trim() ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:scale-[1.02]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}>
                {t("unlockBtn")}
              </button>
            </div>
            <button onClick={() => setMode("recover")} className="mt-4 text-xs text-teal-300 hover:text-teal-200 underline">
              {t("forgotPasscodeLink")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{t("recoveryTitle")}</h3>
              <button onClick={() => setMode("login")} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400">{t("recoveryDesc")}</p>
            <p className="text-xs font-semibold text-teal-300 bg-teal-500/10 border border-teal-400/20 rounded-lg px-3 py-2">
              {security.question}
            </p>
            <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={t("recoveryAnswerPlaceholder")} className={fieldClass} />
            <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder={t("newPasscodeAfterRecoveryLabel")} className={fieldClass} />
            {recoveryError && <p className="text-xs text-rose-400">{t("recoveryWrongAnswer")}</p>}
            <button onClick={() => submitRecovery(answer, newCode)} disabled={!answer.trim() || !newCode.trim()}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${answer.trim() && newCode.trim() ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:scale-[1.02]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}>
              {t("recoverySubmitBtn")}
            </button>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
