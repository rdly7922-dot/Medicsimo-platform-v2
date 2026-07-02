/**
 * storage.js — Phase 3 upgrade
 * ─────────────────────────────────────────────────────────────────────────────
 * Hybrid storage layer:
 *   • When Supabase is reachable  → reads/writes sync to Supabase AND
 *                                    caches in localStorage for offline use
 *   • When offline / no session   → falls back to localStorage only
 *
 * All existing call sites (ClinicContext.jsx useEffects) work unchanged
 * because the public API is identical to the Phase 2 version.
 *
 * The actual Supabase sync for structured data (patients, expenses, etc.)
 * is handled by React Query hooks in useClinicData.js.
 * This file handles lightweight key-value persistence: security settings,
 * webhook URL, tenant registry, and the active tenant pointer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Builds a scoped storage key for a tenant.
 * @param {string} tenantId
 * @param {string} name
 * @returns {string}  e.g. "clinic:al-noor-erbil:security"
 */
export function tenantKey(tenantId, name) {
  return `clinic:${tenantId}:${name}`;
}

/**
 * Strips everything except letters, digits, hyphens. Lowercases.
 * @param {string} rawId
 * @returns {string|null}
 */
export function sanitizeTenantId(rawId) {
  const clean = String(rawId ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .trim();
  return clean.length > 0 ? clean : null;
}

/**
 * Read a JSON value from localStorage.
 * Returns `defaultValue` when the key is absent or on parse error.
 *
 * @param {string} key
 * @param {*}      defaultValue
 * @returns {Promise<*>}
 */
export async function loadStored(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * Write a JSON value to localStorage.
 * Swallows quota/permission errors silently.
 *
 * @param {string} key
 * @param {*}      value
 * @returns {Promise<void>}
 */
export async function saveStored(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Storage full or private-browsing restriction — fail silently.
  }
}

/**
 * Remove a key from localStorage.
 *
 * @param {string} key
 * @returns {Promise<void>}
 */
export async function removeStored(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Fail silently.
  }
}
