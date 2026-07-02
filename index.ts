/**
 * supabase/functions/zain-cash-webhook/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase Edge Function — Zain Cash payment webhook receiver.
 *
 * Zain Cash sends a POST to this URL after every transaction:
 *   https://<project>.supabase.co/functions/v1/zain-cash-webhook
 *
 * Flow:
 *   1. Verify HMAC-SHA256 signature (X-ZainCash-Signature header)
 *   2. Parse payload → extract clinic_id, amount, reference
 *   3. Call record_gateway_payment() RPC to log the transaction
 *   4. If amount matches subscription price → call superadmin_activate_clinic()
 *   5. Return 200 immediately (Zain Cash retries on non-200)
 *
 * Environment variables required (set in Supabase Dashboard → Edge Functions):
 *   ZAIN_CASH_WEBHOOK_SECRET   — provided by Zain Cash merchant portal
 *   SUPABASE_URL               — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY  — auto-injected by Supabase
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { serve }               from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient }        from "https://esm.sh/@supabase/supabase-js@2";
import { verifyHmacSignature, errorResponse, successResponse }
  from "../gateway-shared/verify.js";

// Zain Cash subscription price in USD
const SUBSCRIPTION_PRICE_USD = 25.00;

serve(async (req: Request) => {
  // ── 1. Only accept POST ──────────────────────────────────────────────────
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const rawBody = await req.text();

  // ── 2. Verify signature ──────────────────────────────────────────────────
  const secret    = Deno.env.get("ZAIN_CASH_WEBHOOK_SECRET") ?? "";
  const receivedSig = req.headers.get("X-ZainCash-Signature") ?? "";

  const valid = await verifyHmacSignature(rawBody, receivedSig, secret);
  if (!valid) {
    console.error("[zain-cash] Invalid signature — rejected");
    return errorResponse("Invalid signature", 401);
  }

  // ── 3. Parse payload ─────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const {
    status,        // "success" | "failed"
    transaction_id,
    amount,        // amount in IQD
    metadata,      // { clinic_id: "<uuid>" } — must be sent when initiating payment
  } = payload as {
    status: string;
    transaction_id: string;
    amount: number;
    metadata?: { clinic_id?: string };
  };

  const clinicId = metadata?.clinic_id;

  if (!clinicId) {
    console.error("[zain-cash] Missing clinic_id in metadata");
    return errorResponse("Missing clinic_id in metadata");
  }

  // ── 4. Record transaction via service-role client ─────────────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Convert IQD to approximate USD (1 USD ≈ 1310 IQD — update as needed)
  const amountUsd = Math.round((Number(amount) / 1310) * 100) / 100;

  const { error: txError } = await supabase.rpc("record_gateway_payment", {
    p_clinic_id:   clinicId,
    p_gateway:     "zain_cash",
    p_gateway_ref: String(transaction_id ?? ""),
    p_amount_usd:  amountUsd,
    p_amount_iqd:  Number(amount),
    p_raw_payload: payload,
  });

  if (txError) {
    console.error("[zain-cash] record_gateway_payment error:", txError.message);
    // Still return 200 to prevent Zain Cash retries — log the error internally
  }

  // ── 5. Auto-activate if payment succeeded and amount is correct ──────────
  if (status === "success" && amountUsd >= SUBSCRIPTION_PRICE_USD) {
    const { error: activateError } = await supabase.rpc("superadmin_activate_clinic", {
      p_clinic_id:      clinicId,
      p_months:         1,
      p_amount_usd:     amountUsd,
      p_payment_method: "zain_cash",
      p_payment_ref:    String(transaction_id ?? ""),
      p_notes:          "Auto-activated via Zain Cash webhook",
    });

    if (activateError) {
      console.error("[zain-cash] activate error:", activateError.message);
    } else {
      console.log(`[zain-cash] Clinic ${clinicId} activated for 1 month`);
    }
  }

  return successResponse({ received: true, clinic_id: clinicId });
});
