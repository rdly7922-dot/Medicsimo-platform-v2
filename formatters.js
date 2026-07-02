/**
 * formatters.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure formatting helpers — no side-effects, no imports, easy to test.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Formats an integer number of Iraqi Dinars as a human-readable string.
 *
 * @param   {number} n   - Amount in IQD
 * @returns {string}     - e.g. "1,250,000 IQD"
 */
export function fmtIQD(n) {
  return `${Number(n ?? 0).toLocaleString("en-US")} IQD`;
}

/**
 * Returns today's date as an ISO-8601 date string (YYYY-MM-DD).
 *
 * @returns {string}
 */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns a short locale-aware date string from an ISO date string.
 *
 * @param {string} isoDate  - "2025-06-19"
 * @param {string} locale   - BCP-47 tag, e.g. "ar-IQ", "en-US"
 * @returns {string}
 */
export function fmtDate(isoDate, locale = "ar-IQ") {
  try {
    return new Date(isoDate).toLocaleDateString(locale, {
      year:  "numeric",
      month: "short",
      day:   "numeric",
    });
  } catch {
    return isoDate;
  }
}
