/**
 * supabase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase client singleton.
 *
 * Import this everywhere you need DB / Auth access:
 *   import { supabase } from '../lib/supabase';
 *
 * Environment variables (Vite):
 *   VITE_SUPABASE_URL      = https://yuxdpvbffqzkwidenjah.supabase.co
 *   VITE_SUPABASE_ANON_KEY = <your anon key from Supabase dashboard>
 *
 * Phase 3 note:
 *   The anon key is safe to ship in the browser — Supabase RLS policies
 *   ensure no tenant can read another tenant's data regardless of the key.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[Medicsimo] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
    "Falling back to localStorage-only mode."
  );
}

export const supabase = createClient(
  SUPABASE_URL  ?? "https://yuxdpvbffqzkwidenjah.supabase.co",
  SUPABASE_ANON_KEY ?? "",
  {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: true,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-client-info": "medicsimo-medical-saas/1.0",
      },
    },
  }
);

/**
 * Injects clinic_id into the Supabase JWT so RLS policies can read it.
 * Call this once after a clinic logs in, before any DB operation.
 *
 * @param {string} clinicId  — UUID from clinics.id
 */
export async function setClinicContext(clinicId) {
  // Supabase edge function or custom JWT claim injection point.
  // In Phase 3 we use a Postgres session variable via RPC:
  await supabase.rpc("set_claim", { claim: "clinic_id", value: clinicId });
}
