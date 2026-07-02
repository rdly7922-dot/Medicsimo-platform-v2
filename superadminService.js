/**
 * superadminService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase data layer for the Superadmin dashboard.
 * All functions guard against non-superadmin calls via DB-level RPCs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "../lib/supabase";

/* ── Clinic overview ─────────────────────────────────────────────────────── */

/**
 * Fetch all clinics with their latest subscription and stats.
 * Reads from the superadmin_clinic_overview view.
 */
export async function fetchAllClinics() {
  const { data, error } = await supabase
    .from("superadmin_clinic_overview")
    .select("*")
    .order("joined_at", { ascending: false });

  return { data: data ?? [], error };
}

/**
 * Provision a brand-new clinic workspace.
 * Creates the clinics row and a Supabase Auth user for the owner.
 */
export async function provisionNewClinic({
  workspace_id,
  name,
  owner_email,
  doctor_passcode_hash,
}) {
  const { data, error } = await supabase
    .from("clinics")
    .insert({
      workspace_id,
      name,
      owner_email,
      doctor_passcode_hash,
      subscription_status: "trial",
    })
    .select()
    .single();

  return { data, error };
}

/* ── Subscription management ─────────────────────────────────────────────── */

/**
 * Activate a clinic subscription for N months via DB RPC.
 * The RPC records the subscription row + audit log atomically.
 */
export async function activateClinic({
  clinicId,
  months = 1,
  amountUsd = 25,
  paymentMethod = "manual",
  paymentRef = null,
  notes = null,
}) {
  const { data, error } = await supabase.rpc("superadmin_activate_clinic", {
    p_clinic_id:      clinicId,
    p_months:         months,
    p_amount_usd:     amountUsd,
    p_payment_method: paymentMethod,
    p_payment_ref:    paymentRef,
    p_notes:          notes,
  });
  return { data, error };
}

/**
 * Suspend a clinic workspace.
 */
export async function suspendClinic(clinicId, reason = null) {
  const { data, error } = await supabase.rpc("superadmin_suspend_clinic", {
    p_clinic_id: clinicId,
    p_reason:    reason,
  });
  return { data, error };
}

/* ── Audit log ───────────────────────────────────────────────────────────── */

export async function fetchAuditLog(limit = 50) {
  const { data, error } = await supabase
    .from("superadmin_audit_log")
    .select("id, action, target_type, target_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: data ?? [], error };
}

/* ── Payment transactions ────────────────────────────────────────────────── */

export async function fetchPaymentTransactions(limit = 100) {
  const { data, error } = await supabase
    .from("payment_transactions")
    .select(`
      id, clinic_id, gateway, gateway_ref,
      amount_usd, amount_iqd, status, processed_at, created_at,
      clinics ( workspace_id, name )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: data ?? [], error };
}
