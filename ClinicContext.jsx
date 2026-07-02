/**
 * ClinicContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the entire Medicsimo Medical SaaS application.
 *
 * Replaces the ~60 useState calls that lived inside MedicalDashboardApp.
 * Every view, modal, and hook consumes this context instead of receiving
 * props — eliminating prop-drilling permanently.
 *
 * Architecture notes
 * ──────────────────
 * • State is split into logical domains (tenant, auth, ui, data, modals).
 * • Persistence is handled here via loadStored / saveStored (localStorage
 *   today, Supabase in Phase 3 — only this file changes, not the consumers).
 * • All CRUD handlers (upsertPatient, addExpense …) live here so views stay
 *   purely presentational.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import {
  INITIAL_PATIENTS,
  INITIAL_EXPENSES,
  INITIAL_BOOKINGS,
  INITIAL_INVENTORY,
  ACTIVE_TENANT_KEY,
} from "./seedData";

import { loadStored, saveStored, sanitizeTenantId, tenantKey } from "./storage";
import { notifyWebhook } from "./webhooks";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Context creation                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

const ClinicContext = createContext(null);

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used inside <ClinicProvider>");
  return ctx;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Provider                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export function ClinicProvider({ children }) {
  /* ── 1. TENANT ─────────────────────────────────────────────────────────── */
  const [tenantId, setTenantId]           = useState(null);
  const [tenantResolved, setTenantResolved] = useState(false);
  const [tenantRegistry, setTenantRegistry] = useState([]);
  const [tenantBlockedMsg, setTenantBlockedMsg] = useState(false);

  /* ── 2. AUTH / ROLE ────────────────────────────────────────────────────── */
  const [role, setRole]                   = useState("secretary"); // "doctor" | "secretary"
  const [doctorUnlocked, setDoctorUnlocked] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);
  const [recoveryError, setRecoveryError] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [security, setSecurity]           = useState({
    passcode: "2026",
    question: "ما هو اسم عيادتك الأولى؟",
    answer:   "دجلة",
  });
  const [securityLoaded, setSecurityLoaded] = useState(false);

  /* ── 3. UI SHELL ───────────────────────────────────────────────────────── */
  const [lang, setLang]   = useState("ar");
  const [view, setView]   = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  /* ── 4. DATA — patients ────────────────────────────────────────────────── */
  const [patients, setPatients]           = useState(INITIAL_PATIENTS);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [pendingFeedbackPatientId, setPendingFeedbackPatientId] = useState(null);

  /* ── 5. DATA — expenses ────────────────────────────────────────────────── */
  const [expenses, setExpenses]           = useState(INITIAL_EXPENSES);
  const [expensesLoaded, setExpensesLoaded] = useState(false);

  /* ── 6. DATA — bookings ────────────────────────────────────────────────── */
  const [bookings, setBookings]           = useState(INITIAL_BOOKINGS);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [paidSuccess, setPaidSuccess]     = useState(false);

  /* ── 7. DATA — inventory ───────────────────────────────────────────────── */
  const [inventory, setInventory]         = useState(INITIAL_INVENTORY);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);

  /* ── 8. DATA — reviews (patient feedback) ─────────────────────────────── */
  const [reviews, setReviews]             = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  /* ── 9. WEBHOOK / n8n ──────────────────────────────────────────────────── */
  const [webhookUrl, setWebhookUrl]       = useState("");
  const [webhookLoaded, setWebhookLoaded] = useState(false);

  /* ── 10. MODAL VISIBILITY FLAGS ────────────────────────────────────────── */
  const [showAICore, setShowAICore]           = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false); // false | "add" | editingPatientId
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showAddExpense, setShowAddExpense]   = useState(false);
  const [editingExpense, setEditingExpense]   = useState(null);
  const [showInventoryForm, setShowInventoryForm] = useState(false); // false | "add" | editingItemId

  /* ── 11. PENDING-DELETE CONFIRMATIONS ──────────────────────────────────── */
  const [pendingDeletePatientId, setPendingDeletePatientId] = useState(null);
  const [pendingDeleteExpenseId, setPendingDeleteExpenseId] = useState(null);
  const [pendingDeleteItemId, setPendingDeleteItemId]       = useState(null);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  Derived helpers                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  // Scoped localStorage key — two clinics on the same browser never collide
  const tk = useCallback((name) => tenantKey(tenantId, name), [tenantId]);

  const isSecretary = role === "secretary";

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PERSISTENCE — tenant resolution                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    (async () => {
      const stored = await loadStored(ACTIVE_TENANT_KEY, null);
      if (stored) setTenantId(stored);
      setTenantResolved(true);
    })();
  }, []);

  // Global tenant registry (cross-clinic, not scoped)
  useEffect(() => {
    (async () => {
      const stored = await loadStored("global:tenant_registry", []);
      setTenantRegistry(Array.isArray(stored) ? stored : []);
    })();
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    setTenantRegistry((prev) => {
      if (prev.some((t) => t.id === tenantId)) return prev;
      const next = [
        ...prev,
        { id: tenantId, active: true, createdAt: new Date().toISOString().slice(0, 10) },
      ];
      saveStored("global:tenant_registry", next);
      return next;
    });
  }, [tenantId]);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PERSISTENCE — all tenant-scoped data                                   */
  /* ─────────────────────────────────────────────────────────────────────── */

  // Security settings
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const stored = await loadStored(tk("security"), null);
      if (stored?.passcode) setSecurity(stored);
      setSecurityLoaded(true);
    })();
  }, [tenantId, tk]);

  useEffect(() => {
    if (!securityLoaded || !tenantId) return;
    saveStored(tk("security"), security);
  }, [security, securityLoaded, tenantId, tk]);

  // Patients
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const stored = await loadStored(tk("patients"), null);
      if (stored && Array.isArray(stored)) setPatients(stored);
      setPatientsLoaded(true);
    })();
  }, [tenantId, tk]);

  useEffect(() => {
    if (!patientsLoaded || !tenantId) return;
    saveStored(tk("patients"), patients);
  }, [patients, patientsLoaded, tenantId, tk]);

  // Expenses
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const stored = await loadStored(tk("expenses"), null);
      if (stored && Array.isArray(stored)) setExpenses(stored);
      setExpensesLoaded(true);
    })();
  }, [tenantId, tk]);

  useEffect(() => {
    if (!expensesLoaded || !tenantId) return;
    saveStored(tk("expenses"), expenses);
  }, [expenses, expensesLoaded, tenantId, tk]);

  // Bookings
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const stored = await loadStored(tk("bookings"), null);
      if (stored && Array.isArray(stored)) setBookings(stored);
      setBookingsLoaded(true);
    })();
  }, [tenantId, tk]);

  useEffect(() => {
    if (!bookingsLoaded || !tenantId) return;
    saveStored(tk("bookings"), bookings);
  }, [bookings, bookingsLoaded, tenantId, tk]);

  // Inventory
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const stored = await loadStored(tk("inventory"), null);
      if (stored && Array.isArray(stored)) setInventory(stored);
      setInventoryLoaded(true);
    })();
  }, [tenantId, tk]);

  useEffect(() => {
    if (!inventoryLoaded || !tenantId) return;
    saveStored(tk("inventory"), inventory);
  }, [inventory, inventoryLoaded, tenantId, tk]);

  // Reviews
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const stored = await loadStored(tk("reviews"), null);
      if (stored && Array.isArray(stored)) setReviews(stored);
      setReviewsLoaded(true);
    })();
  }, [tenantId, tk]);

  useEffect(() => {
    if (!reviewsLoaded || !tenantId) return;
    saveStored(tk("reviews"), reviews);
  }, [reviews, reviewsLoaded, tenantId, tk]);

  // Webhook URL
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const stored = await loadStored(tk("webhookUrl"), "");
      setWebhookUrl(stored || "");
      setWebhookLoaded(true);
    })();
  }, [tenantId, tk]);

  useEffect(() => {
    if (!webhookLoaded || !tenantId) return;
    saveStored(tk("webhookUrl"), webhookUrl);
  }, [webhookUrl, webhookLoaded, tenantId, tk]);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  TENANT ACTIONS                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  const joinTenant = useCallback((rawId) => {
    const clean = sanitizeTenantId(rawId);
    if (!clean) return;
    const existing = tenantRegistry.find((r) => r.id === clean);
    if (existing && existing.active === false) {
      setTenantBlockedMsg(true);
      return;
    }
    setTenantBlockedMsg(false);
    saveStored(ACTIVE_TENANT_KEY, clean);
    setTenantId(clean);
  }, [tenantRegistry]);

  const switchTenant = useCallback(() => {
    setTenantId(null);
    saveStored(ACTIVE_TENANT_KEY, null);
  }, []);

  const toggleTenantActive = useCallback((id) => {
    setTenantRegistry((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t));
      saveStored("global:tenant_registry", next);
      return next;
    });
  }, []);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  AUTH ACTIONS                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  const requestDoctorRole = useCallback(() => {
    if (doctorUnlocked) {
      setRole("doctor");
    } else {
      setPasscodeError(false);
      setRecoveryError(false);
      setShowPasscodeModal(true);
    }
  }, [doctorUnlocked]);

  const switchToSecretary = useCallback(() => {
    setRole("secretary");
    setDoctorUnlocked(false);
  }, []);

  const submitPasscode = useCallback((code) => {
    if (code === security.passcode) {
      setDoctorUnlocked(true);
      setRole("doctor");
      setShowPasscodeModal(false);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  }, [security.passcode]);

  const submitRecovery = useCallback((answer, newCode) => {
    const correct = answer.trim().toLowerCase() === security.answer.trim().toLowerCase();
    if (correct && newCode.trim()) {
      setSecurity((prev) => ({ ...prev, passcode: newCode.trim() }));
      setDoctorUnlocked(true);
      setRole("doctor");
      setShowPasscodeModal(false);
      setRecoveryError(false);
    } else {
      setRecoveryError(true);
    }
  }, [security.answer]);

  const saveSecuritySettings = useCallback(
    ({ currentInput, newCode, confirmCode, newQuestion, newAnswer }) => {
      if (currentInput !== security.passcode) {
        setSettingsError("wrongCurrentPasscode");
        setSettingsSaved(false);
        return;
      }
      if (newCode && newCode !== confirmCode) {
        setSettingsError("passcodeMismatch");
        setSettingsSaved(false);
        return;
      }
      setSecurity((prev) => ({
        passcode: newCode?.trim() || prev.passcode,
        question: newQuestion?.trim() || prev.question,
        answer:   newAnswer?.trim()  || prev.answer,
      }));
      setSettingsError("");
      setSettingsSaved(true);
    },
    [security.passcode]
  );

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  PATIENT CRUD                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  const triggerDoneAutomation = useCallback((patient) => {
    notifyWebhook(webhookUrl, {
      event:     "visit_completed",
      name:      patient.name,
      phone:     patient.phone,
      doctor:    "Dr. Ali",
      timestamp: new Date().toISOString(),
    });
  }, [webhookUrl]);

  const upsertPatient = useCallback((data, editingId) => {
    const { prevStatus, initialNotes, ...patientData } = data;
    if (editingId) {
      setPatients((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...patientData } : p))
      );
      setSelectedPatient((prev) =>
        prev?.id === editingId ? { ...prev, ...patientData } : prev
      );
      if (patientData.status === "done" && prevStatus !== "done") {
        setPendingFeedbackPatientId(editingId);
        triggerDoneAutomation({ ...patientData });
      }
    } else {
      const newPatient = {
        id:               Date.now(),
        timeline:         [{ date: new Date().toISOString().slice(0, 10), title: "Patient Registered", note: initialNotes || patientData.reason || "", by: "" }],
        medications:      [],
        chronicConditions:[],
        diagnosticTools:  [],
        loyaltyPoints:    0,
        ...patientData,
      };
      setPatients((prev) => [newPatient, ...prev]);
      if (newPatient.status === "done") {
        setPendingFeedbackPatientId(newPatient.id);
        triggerDoneAutomation(newPatient);
      }
    }
    setShowPatientForm(false);
  }, [triggerDoneAutomation]);

  const advancePatientStage = useCallback((patient) => {
    const order     = ["waiting", "withDoctor", "done"];
    const nextIndex = order.indexOf(patient.status) + 1;
    if (nextIndex >= order.length) return;
    const nextStatus = order[nextIndex];
    setPatients((prev) =>
      prev.map((p) => (p.id === patient.id ? { ...p, status: nextStatus } : p))
    );
    if (nextStatus === "done") {
      setPendingFeedbackPatientId(patient.id);
      triggerDoneAutomation(patient);
    }
  }, [triggerDoneAutomation]);

  const deletePatient = useCallback((id) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setPendingDeletePatientId(null);
    setSelectedPatient((prev) => (prev?.id === id ? null : prev));
  }, []);

  const addClinicalNote = useCallback((patientId, note) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, timeline: [...p.timeline, note] } : p
      )
    );
    setSelectedPatient((prev) =>
      prev?.id === patientId ? { ...prev, timeline: [...prev.timeline, note] } : prev
    );
  }, []);

  const addPatientTag = useCallback((patientId, field, value) => {
    if (!value.trim()) return;
    const updater = (p) =>
      p.id === patientId ? { ...p, [field]: [...(p[field] || []), value.trim()] } : p;
    setPatients((prev) => prev.map(updater));
    setSelectedPatient((prev) => (prev?.id === patientId ? updater(prev) : prev));
  }, []);

  const removePatientTag = useCallback((patientId, field, index) => {
    const updater = (p) =>
      p.id === patientId
        ? { ...p, [field]: (p[field] || []).filter((_, i) => i !== index) }
        : p;
    setPatients((prev) => prev.map(updater));
    setSelectedPatient((prev) => (prev?.id === patientId ? updater(prev) : prev));
  }, []);

  const updatePatientFinancials = useCallback((patientId, field, value) => {
    const updater = (p) =>
      p.id === patientId ? { ...p, [field]: Number(value) } : p;
    setPatients((prev) => prev.map(updater));
    setSelectedPatient((prev) => (prev?.id === patientId ? updater(prev) : prev));
  }, []);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  EXPENSE CRUD                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  const addExpense = useCallback((category, amount, customName) => {
    setExpenses((prev) => [
      ...prev,
      {
        id:       Date.now(),
        category,
        amount,
        date:     new Date().toISOString().slice(0, 10),
        ...(customName ? { customName } : {}),
      },
    ]);
    setShowAddExpense(false);
  }, []);

  const editExpense = useCallback((id, category, amount, customName) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, category, amount, customName: customName || undefined }
          : e
      )
    );
    setEditingExpense(null);
  }, []);

  const deleteExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setPendingDeleteExpenseId(null);
  }, []);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  INVENTORY CRUD                                                          */
  /* ─────────────────────────────────────────────────────────────────────── */

  const upsertInventoryItem = useCallback((data, editingId) => {
    if (editingId) {
      setInventory((prev) =>
        prev.map((i) => (i.id === editingId ? { ...i, ...data } : i))
      );
    } else {
      setInventory((prev) => [{ id: Date.now(), ...data }, ...prev]);
    }
    setShowInventoryForm(false);
  }, []);

  const deleteInventoryItem = useCallback((id) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    setPendingDeleteItemId(null);
  }, []);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  BOOKING ACTIONS                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  const confirmBookingPayment = useCallback((bookingId, gateway) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: "confirmed", gateway, paidAt: new Date().toISOString() }
          : b
      )
    );
    setPaidSuccess(true);
  }, []);

  const addBooking = useCallback((data) => {
    setBookings((prev) => [{ id: Date.now(), status: "pending", ...data }, ...prev]);
    setShowBookingForm(false);
  }, []);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  FEEDBACK / REVIEWS                                                      */
  /* ─────────────────────────────────────────────────────────────────────── */

  const submitFeedback = useCallback((patientId, ratings, comment) => {
    const patient = patients.find((p) => p.id === patientId);
    setReviews((prev) => [
      {
        id:          Date.now(),
        patientId,
        patientName: patient?.name || "",
        date:        new Date().toISOString().slice(0, 10),
        ratings,
        comment:     comment.trim(),
      },
      ...prev,
    ]);
    setPendingFeedbackPatientId(null);
  }, [patients]);

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  MEMOISED DERIVED VALUES                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  const waitingPatients = useMemo(
    () => patients.filter((p) => p.status === "waiting"),
    [patients]
  );

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === "pending"),
    [bookings]
  );

  const lowStockItems = useMemo(
    () => inventory.filter((i) => i.quantity <= i.minLevel),
    [inventory]
  );

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  CONTEXT VALUE                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  const value = {
    /* ── tenant ── */
    tenantId, tenantResolved, tenantRegistry, tenantBlockedMsg,
    joinTenant, switchTenant, toggleTenantActive,

    /* ── auth / role ── */
    role, doctorUnlocked, isSecretary,
    showPasscodeModal, setShowPasscodeModal,
    passcodeError, recoveryError,
    showSettingsModal, setShowSettingsModal,
    settingsError, settingsSaved,
    security,
    requestDoctorRole, switchToSecretary,
    submitPasscode, submitRecovery, saveSecuritySettings,

    /* ── ui ── */
    lang, setLang,
    view, setView,
    searchQuery, setSearchQuery,

    /* ── patients ── */
    patients, selectedPatient, setSelectedPatient,
    pendingFeedbackPatientId, setPendingFeedbackPatientId,
    pendingDeletePatientId, setPendingDeletePatientId,
    showPatientForm, setShowPatientForm,
    upsertPatient, advancePatientStage, deletePatient,
    addClinicalNote, addPatientTag, removePatientTag, updatePatientFinancials,

    /* ── expenses ── */
    expenses, totalExpenses,
    showAddExpense, setShowAddExpense,
    editingExpense, setEditingExpense,
    pendingDeleteExpenseId, setPendingDeleteExpenseId,
    addExpense, editExpense, deleteExpense,

    /* ── bookings ── */
    bookings, selectedBooking, setSelectedBooking,
    selectedGateway, setSelectedGateway,
    paidSuccess, setPaidSuccess,
    showBookingForm, setShowBookingForm,
    pendingBookings,
    confirmBookingPayment, addBooking,

    /* ── inventory ── */
    inventory, lowStockItems,
    showInventoryForm, setShowInventoryForm,
    pendingDeleteItemId, setPendingDeleteItemId,
    upsertInventoryItem, deleteInventoryItem,

    /* ── reviews ── */
    reviews, submitFeedback,

    /* ── webhook ── */
    webhookUrl, setWebhookUrl,

    /* ── ai modal ── */
    showAICore, setShowAICore,

    /* ── derived ── */
    waitingPatients,
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
}
