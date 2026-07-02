/**
 * webhooks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fire-and-forget n8n / WhatsApp webhook dispatcher.
 * Never throws — the UI must continue even if the automation backend is down.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Sends a JSON payload to the configured n8n webhook URL.
 *
 * @param {string} url     - The n8n webhook endpoint (may be empty / falsy)
 * @param {object} payload - Event data to POST
 */
export async function notifyWebhook(url, payload) {
  if (!url?.trim()) return;
  try {
    await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
  } catch {
    // Network failures must never block the secretary's workflow.
  }
}

/**
 * Builds a WhatsApp deep-link for manual patient notification.
 *
 * @param {string} phone   - International format, digits only (e.g. "9647501234567")
 * @param {string} message - Pre-filled message text
 * @returns {string}       - wa.me URL
 */
export function buildWhatsAppLink(phone, message) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  const encoded = encodeURIComponent(message ?? "");
  return `https://wa.me/${digits}?text=${encoded}`;
}
