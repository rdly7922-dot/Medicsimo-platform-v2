/**
 * bookingService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase data access layer for the bookings table.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "../lib/supabase";

function mapBooking(row) {
  return {
    id:        row.id,
    clinicId:  row.clinic_id,
    name:      row.patient_name,
    phone:     row.phone,
    service:   row.service,
    requested: row.requested_at,
    amount:    row.amount,
    status:    row.status,
    gateway:   row.payment_gateway ?? null,
    paidAt:    row.paid_at ?? null,
  };
}

/* ── READ ────────────────────────────────────────────────────────────────── */

export async function fetchBookings(clinicId) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  return { data: error ? [] : data.map(mapBooking), error };
}

/* ── CREATE ──────────────────────────────────────────────────────────────── */

export async function createBooking(clinicId, booking) {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      clinic_id:    clinicId,
      patient_name: booking.name,
      phone:        booking.phone,
      service:      booking.service,
      requested_at: booking.requested,
      amount:       booking.amount,
      status:       "pending",
    })
    .select()
    .single();

  return { data: data ? mapBooking(data) : null, error };
}

/* ── CONFIRM PAYMENT ─────────────────────────────────────────────────────── */

export async function confirmBookingPayment(bookingId, gateway) {
  const { data, error } = await supabase
    .from("bookings")
    .update({
      status:           "confirmed",
      payment_gateway:  gateway,
      paid_at:          new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select()
    .single();

  return { data: data ? mapBooking(data) : null, error };
}

/* ── DELETE ──────────────────────────────────────────────────────────────── */

export async function deleteBooking(bookingId) {
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);
  return { error };
}
