/**
 * feedbackService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase data access layer for patient_feedback and complaints tables.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "../lib/supabase";

/* ── PATIENT FEEDBACK ────────────────────────────────────────────────────── */

function mapFeedback(row) {
  return {
    id:          row.id,
    clinicId:    row.clinic_id,
    patientId:   row.patient_id   ?? null,
    patientName: row.patient_name ?? "",
    ratings: {
      general:     row.rating_general     ?? 0,
      doctor:      row.rating_doctor      ?? 0,
      waitTime:    row.rating_wait        ?? 0,
      cleanliness: row.rating_cleanliness ?? 0,
      // unified "overall" alias used by views
      overall:     row.rating_general     ?? 0,
      doctorCare:  row.rating_doctor      ?? 0,
    },
    comment:     row.comment    ?? "",
    date:        row.submitted_at?.slice(0, 10) ?? "",
  };
}

export async function fetchFeedback(clinicId) {
  const { data, error } = await supabase
    .from("patient_feedback")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("submitted_at", { ascending: false });

  return { data: error ? [] : data.map(mapFeedback), error };
}

export async function submitFeedback(clinicId, patientId, patientName, ratings, comment) {
  const { data, error } = await supabase
    .from("patient_feedback")
    .insert({
      clinic_id:          clinicId,
      patient_id:         patientId   ?? null,
      patient_name:       patientName ?? "",
      rating_general:     ratings.overall     ?? ratings.general     ?? 0,
      rating_doctor:      ratings.doctorCare  ?? ratings.doctor      ?? 0,
      rating_wait:        ratings.waitTime    ?? 0,
      rating_cleanliness: ratings.cleanliness ?? 0,
      comment:            comment ?? "",
    })
    .select()
    .single();

  return { data: data ? mapFeedback(data) : null, error };
}

/* ── COMPLAINTS ──────────────────────────────────────────────────────────── */

function mapComplaint(row) {
  return {
    id:       row.id,
    clinicId: row.clinic_id,
    text:     row.text,
    level:    row.priority,
    date:     row.submitted_at?.slice(0, 10) ?? "",
  };
}

export async function fetchComplaints(clinicId) {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("submitted_at", { ascending: false })
    .limit(20);

  return { data: error ? [] : data.map(mapComplaint), error };
}

export async function submitComplaint(clinicId, text, priority) {
  const { data, error } = await supabase
    .from("complaints")
    .insert({ clinic_id: clinicId, text, priority })
    .select()
    .single();

  return { data: data ? mapComplaint(data) : null, error };
}
