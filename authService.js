/**
 * authService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all Supabase Auth interactions for Medicsimo Medical SaaS.
 *
 * Auth model (Phase 3):
 * ┌──────────────────────────────────────────────────────────────┐
 * │  Tenant login  →  email/password via Supabase Auth           │
 * │  JWT claims    →  { clinic_id, role } injected via trigger   │
 * │  RLS           →  jwt_clinic_id() extracts clinic_id         │
 * │  Doctor gate   →  passcode checked against bcrypt hash in DB │
 * └──────────────────────────────────────────────────────────────┘
 *
 * The mock passcode system from Phase 2 is preserved as a fallback
 * for offline use — if Supabase is unreachable, the local security
 * object from ClinicContext is used instead.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "./supabase";

/* ─── Workspace (tenant) resolution ──────────────────────────────────────── */

/**
 * Fetch clinic row by workspace_id slug.
 * Returns null if not found or on error.
 *
 * @param {string} workspaceId  e.g. "al-noor-erbil"
 * @returns {Promise<object|null>}
 */
export async function resolveWorkspace(workspaceId) {
  const { data, error } = await supabase
    .from("clinics")
    .select("id, workspace_id, name, subscription_status, subscription_expires_at, doctor_passcode_hash, security_question")
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Sign in a clinic user with email + password.
 * Supabase Auth attaches the clinic_id JWT claim via a DB trigger.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ session, error }>}
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { session: data?.session ?? null, error };
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Get the current active session (null if not logged in).
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 *
 * @param {function} callback  (event, session) => void
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

/* ─── Clinic provisioning (Superadmin only) ──────────────────────────────── */

/**
 * Create a new clinic tenant workspace.
 * Only callable by a superadmin — protected by RLS is_superadmin().
 *
 * @param {{ workspace_id, name, owner_email, doctor_passcode_hash }} params
 * @returns {Promise<{ data, error }>}
 */
export async function provisionClinic(params) {
  const { data, error } = await supabase
    .from("clinics")
    .insert({
      workspace_id:         params.workspace_id,
      name:                 params.name,
      owner_email:          params.owner_email,
      doctor_passcode_hash: params.doctor_passcode_hash,
      subscription_status:  "trial",
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Toggle a clinic's subscription status.
 * Only callable by superadmin.
 *
 * @param {string} clinicId
 * @param {"active"|"suspended"|"trial"|"cancelled"} status
 */
export async function updateSubscriptionStatus(clinicId, status) {
  const { error } = await supabase
    .from("clinics")
    .update({ subscription_status: status })
    .eq("id", clinicId);
  return { error };
}
