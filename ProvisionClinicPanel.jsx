/**
 * ProvisionClinicPanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Form to onboard a brand-new clinic tenant workspace.
 *
 * ARCHITECTURE CHANGE (Step 3 — Zero-Touch Provisioning):
 *   This component no longer talks to Supabase directly. Instead it POSTs
 *   the provisioning request to an n8n webhook, which owns the actual
 *   workflow: creating the clinic row, hashing the passcode, sending the
 *   owner a welcome WhatsApp/email, and writing the audit log entry.
 *
 *   Frontend  →  n8n webhook  →  Supabase (service role) + notifications
 *
 *   This keeps privileged provisioning logic out of the browser bundle
 *   entirely — no service-role key, no direct insert, no bypassable client
 *   logic. n8n is the single source of truth for "how a clinic gets born."
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import {
  Plus, CheckCircle2, Copy, Loader2, RefreshCw,
  Building2, MapPin, Phone, Stethoscope, AlertCircle,
} from "lucide-react";

/** Generate a URL-safe subdomain slug from the clinic name */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 32);
}

const FIELD =
  "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all";

const LABEL = "text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5";

/* ── Specialty options ───────────────────────────────────────────────────── */
const SPECIALTIES = [
  { value: "dental",            label: "Dental" },
  { value: "general_practice",  label: "General Practice" },
  { value: "pediatrics",        label: "Pediatrics" },
  { value: "dermatology",       label: "Dermatology" },
  { value: "ob_gyn",            label: "OB-GYN" },
];

/* ── n8n webhook endpoint (configure in .env) ───────────────────────────── */
const N8N_WEBHOOK_URL    = import.meta.env.VITE_N8N_WEBHOOK_URL;
const N8N_WEBHOOK_SECRET = import.meta.env.VITE_N8N_WEBHOOK_SECRET;
// NOTE: This value is bundled into the public JS by Vite — it is a
// deterrent against direct/scraped-URL hits, NOT a cryptographic secret.
// Real access control is the is_superadmin() gate this form sits behind.

export default function ProvisionClinicPanel({ onDone }) {
  const [clinicName,      setClinicName]      = useState("");
  const [subdomain,       setSubdomain]       = useState("");
  const [city,            setCity]            = useState("");
  const [doctorPhone,     setDoctorPhone]     = useState("");
  const [clinicSpecialty, setClinicSpecialty] = useState(SPECIALTIES[0].value);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [created, setCreated] = useState(null); // holds the subdomain on success
  const [copied,  setCopied]  = useState(false);

  const handleNameChange = (val) => {
    setClinicName(val);
    setSubdomain(slugify(val));
  };

  const canSubmit =
    clinicName.trim() &&
    subdomain.trim() &&
    city.trim() &&
    doctorPhone.trim() &&
    clinicSpecialty;

  /* ── Zero-touch provisioning handler ──────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!N8N_WEBHOOK_URL) {
      setError(
        "VITE_N8N_WEBHOOK_URL is not configured. Add it to your .env file before provisioning clinics."
      );
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      clinic_name:      clinicName.trim(),
      subdomain:        subdomain.trim(),
      city:              city.trim(),
      doctor_phone:      doctorPhone.trim(),
      clinic_specialty:  clinicSpecialty,
    };

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(N8N_WEBHOOK_SECRET
            ? { "X-Medicsimo-Webhook-Secret": N8N_WEBHOOK_SECRET }
            : {}),
        },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text || `n8n webhook responded with status ${res.status}`
        );
      }

      setCreated(subdomain.trim());
    } catch (err) {
      setError(
        err?.message?.includes("fetch")
          ? "Could not reach the n8n webhook. Check VITE_N8N_WEBHOOK_URL and your network connection."
          : err?.message || "Provisioning failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(created ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setClinicName(""); setSubdomain(""); setCity("");
    setDoctorPhone(""); setClinicSpecialty(SPECIALTIES[0].value);
    setError(""); setCreated(null);
  };

  /* ── Success screen ─────────────────────────────────────────────────────── */
  if (created) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-white text-lg mb-1">
            Provisioning Request Sent
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            n8n is now creating the clinic workspace, hashing credentials, and
            notifying the owner. This usually completes within a minute.
          </p>

          {/* Subdomain pill */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
            <span className="flex-1 font-mono text-teal-300 font-semibold text-sm text-start">
              {created}.medicsimo.app
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 text-xs font-semibold hover:bg-teal-500/25 transition-all"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onDone}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg hover:scale-[1.02] transition-all"
            >
              View All Clinics
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Provision form ─────────────────────────────────────────────────────── */
  return (
    <div className="max-w-md mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-violet-300" />
          Provision New Clinic
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Zero-touch provisioning — handled entirely by your n8n workflow.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
      >
        {/* Clinic name */}
        <div>
          <label className={LABEL}>
            <Building2 className="w-3.5 h-3.5 text-violet-300" />
            Clinic Name <span className="text-rose-400">*</span>
          </label>
          <input
            value={clinicName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Al-Noor Medical Center — Erbil"
            required
            className={FIELD}
          />
        </div>

        {/* Subdomain */}
        <div>
          <label className={LABEL}>
            Subdomain <span className="text-rose-400">*</span>
            <span className="text-slate-500 font-normal ms-1">
              (auto-generated · editable)
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              value={subdomain}
              onChange={(e) => setSubdomain(slugify(e.target.value))}
              placeholder="al-noor-erbil"
              required
              className={`${FIELD} font-mono`}
            />
            <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">.medicsimo.app</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Only letters, numbers, and hyphens. This becomes the clinic's login URL.
          </p>
        </div>

        {/* City */}
        <div>
          <label className={LABEL}>
            <MapPin className="w-3.5 h-3.5 text-violet-300" />
            City <span className="text-rose-400">*</span>
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Duhok"
            required
            className={FIELD}
          />
        </div>

        {/* Doctor phone */}
        <div>
          <label className={LABEL}>
            <Phone className="w-3.5 h-3.5 text-violet-300" />
            Doctor Phone Number <span className="text-rose-400">*</span>
          </label>
          <input
            type="tel"
            value={doctorPhone}
            onChange={(e) => setDoctorPhone(e.target.value)}
            placeholder="+964 750 123 4567"
            required
            className={FIELD}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            n8n sends the welcome message and credentials to this number.
          </p>
        </div>

        {/* Clinic specialty */}
        <div>
          <label className={LABEL}>
            <Stethoscope className="w-3.5 h-3.5 text-violet-300" />
            Clinic Specialty <span className="text-rose-400">*</span>
          </label>
          <select
            value={clinicSpecialty}
            onChange={(e) => setClinicSpecialty(e.target.value)}
            required
            className={`${FIELD} appearance-none cursor-pointer`}
          >
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value} className="bg-slate-800">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-400/20 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-1 ${
            canSubmit && !loading
              ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:scale-[1.02]"
              : "bg-white/5 text-slate-500 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending to n8n…</>
          ) : (
            <><Plus className="w-4 h-4" /> Provision Clinic</>
          )}
        </button>

        <p className="text-[11px] text-slate-600 text-center -mt-1">
          This request is sent to your n8n webhook — no data is written to
          Supabase directly from this form.
        </p>
      </form>
    </div>
  );
}
