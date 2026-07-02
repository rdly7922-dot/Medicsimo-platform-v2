/**
 * expenseService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase data access layer for the expenses table.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "../lib/supabase";

function mapExpense(row) {
  return {
    id:          row.id,
    clinicId:    row.clinic_id,
    category:    row.category,
    amount:      row.amount,
    customName:  row.description ?? undefined,
    date:        row.expense_date,
    createdAt:   row.created_at,
  };
}

/* ── READ ────────────────────────────────────────────────────────────────── */

export async function fetchExpenses(clinicId) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, clinic_id, category, amount, description, expense_date, created_at")
    .eq("clinic_id", clinicId)
    .order("expense_date", { ascending: false });

  return { data: error ? [] : data.map(mapExpense), error };
}

/* ── CREATE ──────────────────────────────────────────────────────────────── */

export async function createExpense(clinicId, { category, amount, customName }) {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      clinic_id:    clinicId,
      category,
      amount,
      description:  customName ?? null,
      expense_date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  return { data: data ? mapExpense(data) : null, error };
}

/* ── UPDATE ──────────────────────────────────────────────────────────────── */

export async function updateExpense(expenseId, { category, amount, customName }) {
  const { data, error } = await supabase
    .from("expenses")
    .update({ category, amount, description: customName ?? null })
    .eq("id", expenseId)
    .select()
    .single();

  return { data: data ? mapExpense(data) : null, error };
}

/* ── DELETE ──────────────────────────────────────────────────────────────── */

export async function deleteExpense(expenseId) {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);
  return { error };
}
