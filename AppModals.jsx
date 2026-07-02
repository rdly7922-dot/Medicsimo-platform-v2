/**
 * AppModals.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * All view-level modals in one file, each individually exported.
 * DashboardLayout mounts only the ones that are currently "open" via context.
 *
 * Modals: SettingsModal, CheckoutModal, PatientFormModal, BookingFormModal,
 *         InventoryFormModal, FeedbackModal, DeleteConfirmModal
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import {
  X, CheckCircle2, Smartphone, Landmark, Globe, CreditCard,
  Star, ClipboardCheck, Trash2,
} from "lucide-react";
import { useClinic }      from "../../context/ClinicContext";
import { useTranslation } from "../../hooks/useTranslation";
import { fmtIQD }         from "../../utils/formatters";
import { GlassPanel }     from "../ui/ui";
import { CATEGORY_KEYS, GATEWAY_KEYS } from "../../constants/seedData";

const FIELD = "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 transition-all";

const GATEWAY_ICONS = {
  Smartphone, Landmark, Globe, CreditCard,
};

/* ══════════════════════════════════════════════════════════════════════════
 *  SETTINGS MODAL
 * ══════════════════════════════════════════════════════════════════════════ */
export function SettingsModal() {
  const { setShowSettingsModal, saveSecuritySettings, settingsError, settingsSaved, security } = useClinic();
  const { t } = useTranslation();
  const [currentInput, setCurrentInput] = useState("");
  const [newCode, setNewCode]           = useState("");
  const [confirmCode, setConfirmCode]   = useState("");
  const [newQuestion, setNewQuestion]   = useState(security.question);
  const [newAnswer, setNewAnswer]       = useState("");

  const canSave = currentInput.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6 anim-modal">
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-bold text-white">{t("settingsTitle")}</h3>
          <button onClick={() => setShowSettingsModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { label: t("currentPasscodeLabel"), val: currentInput, set: setCurrentInput, type: "password" },
            { label: t("newPasscodeLabel"),     val: newCode,      set: setNewCode,      type: "password" },
            { label: t("confirmPasscodeLabel"), val: confirmCode,  set: setConfirmCode,  type: "password" },
            { label: t("securityQuestionLabel"),val: newQuestion,  set: setNewQuestion,  type: "text"     },
            { label: t("securityAnswerLabel"),  val: newAnswer,    set: setNewAnswer,    type: "text"     },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">{f.label}</label>
              <input type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} className={FIELD} />
            </div>
          ))}
          {settingsError && <p className="text-xs text-rose-400">{t(settingsError)}</p>}
          {settingsSaved && !settingsError && <p className="text-xs text-emerald-400">{t("settingsSavedMsg")}</p>}
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowSettingsModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">
              {t("cancelBtn")}
            </button>
            <button onClick={() => saveSecuritySettings({ currentInput, newCode, confirmCode, newQuestion, newAnswer })} disabled={!canSave}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${canSave ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:scale-[1.02]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}>
              {t("saveSettingsBtn")}
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  CHECKOUT MODAL
 * ══════════════════════════════════════════════════════════════════════════ */
export function CheckoutModal() {
  const { selectedBooking, setSelectedBooking, selectedGateway, setSelectedGateway,
          paidSuccess, setPaidSuccess, confirmBookingPayment } = useClinic();
  const { t } = useTranslation();

  if (!selectedBooking) return null;

  const onClose = () => { setSelectedBooking(null); setPaidSuccess(false); setSelectedGateway(null); };
  const onConfirm = () => confirmBookingPayment(selectedBooking.id, selectedGateway);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6 anim-modal">
        {!paidSuccess ? (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bold text-white">{t("checkoutTitle")}</h3>
                <p className="text-xs text-slate-400">{selectedBooking.name} — {selectedBooking.service}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <GlassPanel className="p-4 mb-5 bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs text-slate-400">{t("amountDue")}</span>
              <span className="text-xl font-bold text-white tabular-nums">{fmtIQD(selectedBooking.amount)}</span>
            </GlassPanel>
            <p className="text-xs font-semibold text-slate-300 mb-3">{t("selectGateway")}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {GATEWAY_KEYS.map((g) => {
                const Icon   = GATEWAY_ICONS[g.iconName] || CreditCard;
                const active = selectedGateway === g.key;
                return (
                  <button key={g.key} onClick={() => setSelectedGateway(g.key)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-200 ${active ? `border-white/30 bg-white/10 ring-2 ${g.ring}` : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${g.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[11px] text-center text-slate-200 leading-tight">{t(g.key)}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={onConfirm} disabled={!selectedGateway}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedGateway ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:scale-[1.02]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}>
              {t("confirmPayment")}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-white mb-1">{t("paymentSuccess")}</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">{t("paymentSuccessSub")}</p>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all">
              {t("close")}
            </button>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  PATIENT FORM MODAL (Add + Edit)
 * ══════════════════════════════════════════════════════════════════════════ */
export function PatientFormModal() {
  const { patients, showPatientForm, setShowPatientForm, upsertPatient } = useClinic();
  const { t } = useTranslation();

  const editingId      = showPatientForm && showPatientForm !== "add" ? showPatientForm : null;
  const editingPatient = editingId ? patients.find((p) => p.id === editingId) : null;
  const isEdit         = !!editingPatient;

  const [name, setName]           = useState(editingPatient?.name || "");
  const [phone, setPhone]         = useState(editingPatient?.phone || "");
  const [age, setAge]             = useState(editingPatient?.age ?? "");
  const [reason, setReason]       = useState(editingPatient?.reason || "");
  const [status, setStatus]       = useState(editingPatient?.status || "waiting");
  const [totalCost, setTotalCost] = useState(editingPatient?.totalCost ?? "");
  const [paid, setPaid]           = useState(editingPatient?.paid ?? "");
  const [chronicInput, setChronicInput] = useState((editingPatient?.chronicConditions || []).join(", "));
  const [toolsInput, setToolsInput]     = useState((editingPatient?.diagnosticTools || []).join(", "));
  const [medsInput, setMedsInput]       = useState((editingPatient?.medications || []).join(", "));
  const [initialNotes, setInitialNotes] = useState("");

  const canSave = name.trim() && phone.trim() && age !== "" && totalCost !== "" && paid !== "";
  const splitList = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const handleSave = () => {
    if (!canSave) return;
    upsertPatient({
      name: name.trim(), phone: phone.trim(), age: Number(age),
      reason: reason.trim(), status,
      totalCost: Number(totalCost), paid: Math.min(Number(paid), Number(totalCost)),
      chronicConditions: splitList(chronicInput),
      diagnosticTools:   splitList(toolsInput),
      medications:       splitList(medsInput),
      ...(!isEdit && initialNotes.trim() ? { initialNotes: initialNotes.trim() } : {}),
      prevStatus: editingPatient?.status,
    }, editingId);
  };

  const STATUSES = ["waiting", "withDoctor", "done"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-0 anim-modal">
        <div className="p-6 border-b border-white/10 flex items-start justify-between sticky top-0 bg-slate-800/80 backdrop-blur-md z-10">
          <h3 className="font-bold text-white">{isEdit ? t("editProfileTitle") : t("addPatientTitle")}</h3>
          <button onClick={() => setShowPatientForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("patientNameLabel")}</label><input value={name} onChange={(e) => setName(e.target.value)} className={FIELD} /></div>
            <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("patientPhoneLabel")}</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+964 7XX XXX XXXX" className={FIELD} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("patientAge")}</label><input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} className={FIELD} /></div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("patientStatusLabel")}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${FIELD} appearance-none cursor-pointer`}>
                {STATUSES.map((s) => <option key={s} value={s} className="bg-slate-800 text-white">{t(`status${s.charAt(0).toUpperCase()}${s.slice(1)}` )}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("patientReason")}</label><input value={reason} onChange={(e) => setReason(e.target.value)} className={FIELD} /></div>
          <div className="h-px bg-white/10" />
          {[
            { label: t("chronicConditionsTitle"), val: chronicInput, set: setChronicInput },
            { label: t("diagnosticToolsTitle"),   val: toolsInput,   set: setToolsInput   },
            { label: t("medicationsTitle"),        val: medsInput,    set: setMedsInput    },
          ].map((f) => (
            <div key={f.label}><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{f.label}</label><input value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={t("commaSeparatedHint")} className={FIELD} /></div>
          ))}
          {!isEdit && (
            <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("initialNotesLabel")}</label><textarea value={initialNotes} onChange={(e) => setInitialNotes(e.target.value)} rows={2} className={`${FIELD} resize-none`} /></div>
          )}
          <div className="h-px bg-white/10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("totalCost")}</label><input type="number" min="0" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} className={FIELD} /></div>
            <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("amountPaid")}</label><input type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} className={FIELD} /></div>
          </div>
          {totalCost !== "" && paid !== "" && (
            <div className="flex justify-between text-xs px-1">
              <span className="text-slate-400">{t("remainingDebt")}</span>
              <span className={`font-semibold ${Number(totalCost) - Number(paid) > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {fmtIQD(Math.max(Number(totalCost) - Number(paid), 0))}
              </span>
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowPatientForm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">{t("cancelBtn")}</button>
            <button onClick={handleSave} disabled={!canSave} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${canSave ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:scale-[1.02]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}>{t("savePatientBtn")}</button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  BOOKING FORM MODAL
 * ══════════════════════════════════════════════════════════════════════════ */
export function BookingFormModal() {
  const { setShowBookingForm, addBooking } = useClinic();
  const { t } = useTranslation();
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [service, setService]   = useState("");
  const [requested, setReq]     = useState("");
  const [amount, setAmount]     = useState("");
  const canSave = name.trim() && phone.trim() && service.trim() && requested.trim() && Number(amount) > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6 anim-modal">
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-bold text-white">{t("addBookingTitle")}</h3>
          <button onClick={() => setShowBookingForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { label: t("patientNameLabel"),  val: name,     set: setName,    type: "text"   },
            { label: t("patientPhoneLabel"), val: phone,    set: setPhone,   type: "tel", ph: "+964 7XX XXX XXXX" },
            { label: t("bookingService"),    val: service,  set: setService, type: "text"   },
            { label: t("bookingRequested"),  val: requested,set: setReq,     type: "text", ph: "2026-06-25 14:00" },
          ].map((f) => (
            <div key={f.label}><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{f.label}</label><input type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph || ""} className={FIELD} /></div>
          ))}
          <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("amountDue")}</label><input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${FIELD} tabular-nums`} /></div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowBookingForm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">{t("cancelBtn")}</button>
            <button onClick={() => addBooking({ name: name.trim(), phone: phone.trim(), service: service.trim(), requested: requested.trim(), amount: Number(amount) })} disabled={!canSave} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${canSave ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:scale-[1.02]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}>{t("savePatientBtn")}</button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  EXPENSE FORM MODAL (Add + Edit)
 * ══════════════════════════════════════════════════════════════════════════ */
export function ExpenseFormModal() {
  const { showAddExpense, setShowAddExpense, editingExpense, setEditingExpense, addExpense, editExpense } = useClinic();
  const { t } = useTranslation();
  const exp = editingExpense;
  const isEdit = !!exp;

  const [category, setCategory] = useState(exp?.category || CATEGORY_KEYS[0].key);
  const [amount, setAmount]     = useState(exp?.amount ?? "");
  const [customName, setCustomName] = useState(exp?.customName || "");

  const isOther = category === "other";
  const canSave = Number(amount) > 0 && (!isOther || customName.trim());

  const handleSave = () => {
    if (!canSave) return;
    const cn = isOther ? customName.trim() : undefined;
    if (isEdit) editExpense(exp.id, category, Number(amount), cn);
    else        addExpense(category, Number(amount), cn);
  };

  const onClose = () => { setShowAddExpense(false); setEditingExpense(null); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6 anim-modal">
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-bold text-white">{isEdit ? t("editExpenseModalTitle") : t("addExpenseModalTitle")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("categoryLabel")}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${FIELD} appearance-none cursor-pointer`}>
              {CATEGORY_KEYS.map((c) => <option key={c.key} value={c.key} className="bg-slate-800 text-white">{t(c.labelKey)}</option>)}
            </select>
          </div>
          {isOther && (
            <div className="anim-chip">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("otherDescLabel")}</label>
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={t("otherDescLabel")} className={FIELD} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("amountLabel")}</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${FIELD} tabular-nums`} />
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">{t("cancelBtn")}</button>
            <button onClick={handleSave} disabled={!canSave} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${canSave ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:scale-[1.02]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}>{t("saveBtn")}</button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  INVENTORY FORM MODAL
 * ══════════════════════════════════════════════════════════════════════════ */
export function InventoryFormModal() {
  const { inventory, showInventoryForm, setShowInventoryForm, upsertInventoryItem } = useClinic();
  const { t } = useTranslation();
  const editingId   = showInventoryForm && showInventoryForm !== "add" ? showInventoryForm : null;
  const editingItem = editingId ? inventory.find((i) => i.id === editingId) : null;
  const isEdit      = !!editingItem;

  const [name, setName]       = useState(editingItem?.name || "");
  const [qty, setQty]         = useState(editingItem?.quantity ?? "");
  const [min, setMin]         = useState(editingItem?.minLevel ?? "");
  const [expiry, setExpiry]   = useState(editingItem?.expiry || "");
  const canSave = name.trim() && qty !== "" && min !== "";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6 anim-modal">
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-bold text-white">{isEdit ? t("editItemTitle") : t("addItemTitle")}</h3>
          <button onClick={() => setShowInventoryForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("patientNameLabel")}</label><input value={name} onChange={(e) => setName(e.target.value)} className={FIELD} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("quantityLabel")}</label><input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className={FIELD} /></div>
            <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("minLevelLabel")}</label><input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} className={FIELD} /></div>
          </div>
          <div><label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("expiryLabel")}</label><input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={FIELD} /></div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowInventoryForm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">{t("cancelBtn")}</button>
            <button onClick={() => upsertInventoryItem({ name: name.trim(), quantity: Number(qty), minLevel: Number(min), expiry }, editingId)} disabled={!canSave} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${canSave ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:scale-[1.02]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}>{t("saveBtn")}</button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  FEEDBACK MODAL (post-visit survey)
 * ══════════════════════════════════════════════════════════════════════════ */
export function FeedbackModal() {
  const { patients, pendingFeedbackPatientId, setPendingFeedbackPatientId, submitFeedback } = useClinic();
  const { t } = useTranslation();
  const patient = patients.find((p) => p.id === pendingFeedbackPatientId);
  if (!patient) return null;

  const [ratings, setRatings] = useState({ waitTime: 0, doctorCare: 0, cleanliness: 0, overall: 0 });
  const [comment, setComment] = useState("");
  const canSubmit = Object.values(ratings).every((v) => v > 0);

  const setRating = (key, val) => setRatings((prev) => ({ ...prev, [key]: val }));

  const QUESTIONS = [
    { key: "waitTime",    label: t("ratingWaitTime")     },
    { key: "doctorCare",  label: t("ratingDoctor")       },
    { key: "cleanliness", label: t("feedbackCleanliness")},
    { key: "overall",     label: t("ratingGeneral")      },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6 anim-modal">
        <div className="flex items-center gap-2 mb-1.5">
          <ClipboardCheck className="w-4 h-4 text-teal-300" />
          <h3 className="font-bold text-white">{t("feedbackModalTitle")}</h3>
        </div>
        <p className="text-xs text-slate-400 mb-1">{patient.name}</p>
        <p className="text-sm text-slate-400 mb-5">{t("feedbackIntro")}</p>
        <div className="flex flex-col gap-4 mb-5">
          {QUESTIONS.map((q) => (
            <div key={q.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-200">{q.label}</span>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <button key={i} onClick={() => setRating(q.key, i)} className="transition-transform hover:scale-110">
                    <Star className={`w-6 h-6 ${i <= ratings[q.key] ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <label className="text-xs font-semibold text-slate-300 mb-1.5 block">{t("feedbackCommentLabel")}</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className={`${FIELD} resize-none mb-5`} />
        <div className="flex gap-3">
          <button onClick={() => setPendingFeedbackPatientId(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">{t("feedbackSkipBtn")}</button>
          <button onClick={() => submitFeedback(patient.id, ratings, comment)} disabled={!canSubmit} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${canSubmit ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:scale-[1.02]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}>{t("feedbackSubmitBtn")}</button>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  DELETE CONFIRM MODAL (generic)
 * ══════════════════════════════════════════════════════════════════════════ */
export function DeleteConfirmModal({ title, message, onCancel, onConfirm }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-backdrop">
      <GlassPanel className="w-full max-w-sm p-6 anim-modal">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-rose-500/15 border border-rose-400/30 mb-3">
            <Trash2 className="w-5 h-5 text-rose-300" />
          </div>
          <h3 className="font-bold text-white mb-1.5">{title || t("deleteConfirmTitle")}</h3>
          <p className="text-sm text-slate-400 mb-6">{message || t("deleteConfirmMsg")}</p>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">{t("cancelBtn")}</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-sm font-semibold shadow-lg shadow-rose-500/30 hover:scale-[1.02] transition-all">
              {t("confirmDeleteBtn")}
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
