/**
 * inventoryService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase data access layer for the inventory_items table.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "../lib/supabase";

function mapItem(row) {
  return {
    id:        row.id,
    clinicId:  row.clinic_id,
    name:      row.name,
    quantity:  row.quantity,
    minLevel:  row.min_level,
    expiry:    row.expiry_date ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ── READ ────────────────────────────────────────────────────────────────── */

export async function fetchInventory(clinicId) {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true });

  return { data: error ? [] : data.map(mapItem), error };
}

/* ── CREATE ──────────────────────────────────────────────────────────────── */

export async function createInventoryItem(clinicId, item) {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      clinic_id:   clinicId,
      name:        item.name,
      quantity:    item.quantity,
      min_level:   item.minLevel,
      expiry_date: item.expiry ?? null,
    })
    .select()
    .single();

  return { data: data ? mapItem(data) : null, error };
}

/* ── UPDATE ──────────────────────────────────────────────────────────────── */

export async function updateInventoryItem(itemId, item) {
  const { data, error } = await supabase
    .from("inventory_items")
    .update({
      name:        item.name,
      quantity:    item.quantity,
      min_level:   item.minLevel,
      expiry_date: item.expiry ?? null,
    })
    .eq("id", itemId)
    .select()
    .single();

  return { data: data ? mapItem(data) : null, error };
}

/* ── DELETE ──────────────────────────────────────────────────────────────── */

export async function deleteInventoryItem(itemId) {
  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", itemId);
  return { error };
}
