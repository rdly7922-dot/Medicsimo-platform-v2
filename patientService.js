/**
 * patientService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase data access layer for patients and patient_notes tables.
 *
 * Column mapping (DB → JS):
 *   full_name        → name
 *   phone_number     → phone
 *   visit_reason     → reason
 *   total_cost       → totalCost
 *   amount_paid      → paid
 *   chronic_conditions → chronicConditions
 *   diagnostic_tools → diagnosticTools
 *   loyalty_points   → loyaltyPoints
 *
 * All functions return { data, error } — callers decide how to handle errors.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "../lib/supabase";

/* ── Column selector used on every patient fetch ─────────────────────────── */
const PATIENT_SELECT = `
  id,
  clinic_id,
  full_name,
  phone_number,
  age,
  visit_reason,
  status,
  total_cost,
  amount_paid,
  medications,
  chronic_conditions,
  diagnostic_tools,
  loyalty_points,
  created_at,
  updated_at,
  patient_notes (
    id,
    note_date,
    title,
    content,
    performed_by,
    created_at
  )
`.trim();

/* ── Shape raw DB row into the JS object all views expect ────────────────── */
function mapPatient(row) {
  return {
    id:                row.id,
    clinicId:          row.clinic_id,
    name:              row.full_name,
    phone:             row.phone_number,
    age:               row.age,
    reason:            row.visit_reason,
    status:            row.status,
    totalCost:         row.total_cost         ?? 0,
    paid:              row.amount_paid        ?? 0,
    medications:       row.medications        ?? [],
    chronicConditions: row.chronic_conditions ?? [],
    diagnosticTools:   row.diagnostic_tools   ?? [],
    loyaltyPoints:     row.loyalty_points     ?? 0,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
    timeline: (row.patient_notes ?? []).map((n) => ({
      id:    n.id,
      date:  n.note_date,
      title: n.title,
      note:  n.content,
      by:    n.performed_by ?? "",
    })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/* ── READ ──────────────────────────────────────────────────────────────────── */

/**
 * Fetch all patients for a clinic, ordered by creation date desc.
 *
 * @param {string} clinicId
 * @returns {Promise<{ data: Patient[], error }>}
 */
export async function fetchPatients(clinicId) {
  const { data, error } = await supabase
    .from("patients")
    .select(PATIENT_SELECT)
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  return {
    data:  error ? [] : data.map(mapPatient),
    error,
  };
}

/**
 * Fetch a single patient by id.
 *
 * @param {string} patientId
 * @returns {Promise<{ data: Patient|null, error }>}
 */
export async function fetchPatient(patientId) {
  const { data, error } = await supabase
    .from("patients")
    .select(PATIENT_SELECT)
    .eq("id", patientId)
    .single();

  return {
    data:  data ? mapPatient(data) : null,
    error,
  };
}

/* ── CREATE ────────────────────────────────────────────────────────────────── */

/**
 * Insert a new patient record.
 *
 * @param {string} clinicId
 * @param {object} patient  JS-shaped patient object
 * @param {string} [initialNote]  optional first clinical note text
 * @returns {Promise<{ data: Patient|null, error }>}
 */
export async function createPatient(clinicId, patient, initialNote) {
  const { data, error } = await supabase
    .from("patients")
    .insert({
      clinic_id:          clinicId,
      full_name:          patient.name,
      phone_number:       patient.phone,
      age:                patient.age,
      visit_reason:       patient.reason,
      status:             patient.status      ?? "waiting",
      total_cost:         patient.totalCost   ?? 0,
      amount_paid:        patient.paid        ?? 0,
      medications:        patient.medications        ?? [],
      chronic_conditions: patient.chronicConditions  ?? [],
      diagnostic_tools:   patient.diagnosticTools    ?? [],
      loyalty_points:     patient.loyaltyPoints      ?? 0,
    })
    .select(PATIENT_SELECT)
    .single();

  if (error || !data) return { data: null, error };

  // Attach initial clinical note if provided
  if (initialNote?.trim()) {
    await supabase.from("patient_notes").insert({
      clinic_id:    clinicId,
      patient_id:   data.id,
      note_date:    new Date().toISOString().slice(0, 10),
      title:        "Initial Treatment Notes",
      content:      initialNote.trim(),
      performed_by: "Dr. Ali",
    });
  }

  return { data: mapPatient(data), error: null };
}

/* ── UPDATE ────────────────────────────────────────────────────────────────── */

/**
 * Update an existing patient's fields.
 *
 * @param {string} patientId
 * @param {object} updates  partial JS-shaped patient object
 * @returns {Promise<{ data: Patient|null, error }>}
 */
export async function updatePatient(patientId, updates) {
  const dbUpdates = {};

  if (updates.name              !== undefined) dbUpdates.full_name          = updates.name;
  if (updates.phone             !== undefined) dbUpdates.phone_number       = updates.phone;
  if (updates.age               !== undefined) dbUpdates.age                = updates.age;
  if (updates.reason            !== undefined) dbUpdates.visit_reason       = updates.reason;
  if (updates.status            !== undefined) dbUpdates.status             = updates.status;
  if (updates.totalCost         !== undefined) dbUpdates.total_cost         = updates.totalCost;
  if (updates.paid              !== undefined) dbUpdates.amount_paid        = updates.paid;
  if (updates.medications       !== undefined) dbUpdates.medications        = updates.medications;
  if (updates.chronicConditions !== undefined) dbUpdates.chronic_conditions = updates.chronicConditions;
  if (updates.diagnosticTools   !== undefined) dbUpdates.diagnostic_tools   = updates.diagnosticTools;
  if (updates.loyaltyPoints     !== undefined) dbUpdates.loyalty_points     = updates.loyaltyPoints;

  const { data, error } = await supabase
    .from("patients")
    .update(dbUpdates)
    .eq("id", patientId)
    .select(PATIENT_SELECT)
    .single();

  return { data: data ? mapPatient(data) : null, error };
}

/* ── DELETE ────────────────────────────────────────────────────────────────── */

/**
 * Delete a patient (cascades to patient_notes via FK).
 *
 * @param {string} patientId
 * @returns {Promise<{ error }>}
 */
export async function deletePatient(patientId) {
  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", patientId);
  return { error };
}

/* ── CLINICAL NOTES ────────────────────────────────────────────────────────── */

/**
 * Add a clinical note to a patient's timeline.
 *
 * @param {string} clinicId
 * @param {string} patientId
 * @param {{ title, note, by }} noteData
 * @returns {Promise<{ data, error }>}
 */
export async function addClinicalNote(clinicId, patientId, noteData) {
  const { data, error } = await supabase
    .from("patient_notes")
    .insert({
      clinic_id:    clinicId,
      patient_id:   patientId,
      note_date:    new Date().toISOString().slice(0, 10),
      title:        noteData.title ?? "Clinical Note",
      content:      noteData.note  ?? "",
      performed_by: noteData.by    ?? "",
    })
    .select()
    .single();

  return { data, error };
}
