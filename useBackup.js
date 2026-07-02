/**
 * useBackup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides manual backup (export) and restore (import) of all clinic data
 * as a single downloadable JSON file — satisfying the "zero data loss" and
 * "offline-first" requirements from the product spec.
 *
 * The user clicks "Download Backup" → gets a timestamped .json file.
 * To restore: they upload the file, we validate and overwrite context state.
 *
 * USAGE:
 *   const { downloadBackup, restoreBackup } = useBackup();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback } from "react";
import { useClinic } from "../context/ClinicContext";

export function useBackup() {
  const {
    tenantId,
    patients, expenses, bookings, inventory, reviews,
    setPatients, setExpenses, setBookings, setInventory, setReviews,
  } = useClinic();

  const downloadBackup = useCallback(() => {
    const payload = {
      version:   1,
      tenantId,
      exportedAt: new Date().toISOString(),
      patients,
      expenses,
      bookings,
      inventory,
      reviews,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `medicsimo-backup-${tenantId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tenantId, patients, expenses, bookings, inventory, reviews]);

  const restoreBackup = useCallback((file, onSuccess, onError) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version || !data.tenantId) throw new Error("Invalid backup file.");
        if (data.tenantId !== tenantId) {
          throw new Error(`Backup is for workspace "${data.tenantId}", not "${tenantId}".`);
        }
        if (Array.isArray(data.patients))  setPatients(data.patients);
        if (Array.isArray(data.expenses))  setExpenses(data.expenses);
        if (Array.isArray(data.bookings))  setBookings(data.bookings);
        if (Array.isArray(data.inventory)) setInventory(data.inventory);
        if (Array.isArray(data.reviews))   setReviews(data.reviews);
        onSuccess?.();
      } catch (err) {
        onError?.(err.message);
      }
    };
    reader.readAsText(file);
  }, [tenantId, setPatients, setExpenses, setBookings, setInventory, setReviews]);

  return { downloadBackup, restoreBackup };
}
