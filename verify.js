/**
 * gateway-shared/verify.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared HMAC-SHA256 signature verification utility used by every
 * payment gateway Edge Function.
 *
 * Each gateway sends a signature in a different header:
 *   Zain Cash   → X-ZainCash-Signature
 *   FIB         → X-FIB-Signature
 *   AsiaHawala  → X-Asia-Signature
 *   Qi Card     → X-Qi-Signature
 *
 * The secret is stored in Supabase Vault / Edge Function env vars —
 * never hardcoded.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Verifies an HMAC-SHA256 webhook signature.
 *
 * @param {string} rawBody       — raw request body string
 * @param {string} receivedSig   — signature from the gateway header
 * @param {string} secret        — webhook secret from env
 * @returns {Promise<boolean>}
 */
export async function verifyHmacSignature(rawBody, receivedSig, secret) {
  if (!receivedSig || !secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody)
  );

  const computedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  return constantTimeEqual(computedHex, receivedSig.toLowerCase().replace(/^sha256=/, ""));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Shared error response helper.
 */
export function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Shared success response helper.
 */
export function successResponse(data = {}) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
