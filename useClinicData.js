/**
 * useClinicData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * React Query hooks for every data domain.
 *
 * Pattern per domain:
 *   usePatients()        → { patients, isLoading, isError }
 *   useCreatePatient()   → mutation with optimistic update
 *   useUpdatePatient()   → mutation with optimistic update
 *   useDeletePatient()   → mutation with cache removal
 *
 * Optimistic UI strategy:
 *   1. onMutate  — immediately update the query cache (UI feels instant)
 *   2. onError   — roll back to the previous snapshot
 *   3. onSettled — refetch to get the true server state
 *
 * Offline-first:
 *   networkMode: "offlineFirst" on the QueryClient means mutations queue
 *   when offline and replay automatically when the connection returns.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClinic } from "../context/ClinicContext";

import * as patientSvc   from "./patientService";
import * as expenseSvc   from "./expenseService";
import * as bookingSvc   from "./bookingService";
import * as inventorySvc from "./inventoryService";
import * as feedbackSvc  from "./feedbackService";

/* ── Query key factory — centralised, no magic strings ──────────────────── */
export const QK = {
  patients:   (cid) => ["patients",   cid],
  expenses:   (cid) => ["expenses",   cid],
  bookings:   (cid) => ["bookings",   cid],
  inventory:  (cid) => ["inventory",  cid],
  feedback:   (cid) => ["feedback",   cid],
  complaints: (cid) => ["complaints", cid],
};

/* ════════════════════════════════════════════════════════════════════════════
 *  PATIENTS
 * ════════════════════════════════════════════════════════════════════════════ */

export function usePatients() {
  const { tenantId } = useClinic();
  return useQuery({
    queryKey: QK.patients(tenantId),
    queryFn:  () => patientSvc.fetchPatients(tenantId).then((r) => {
      if (r.error) throw r.error;
      return r.data;
    }),
    enabled: !!tenantId,
    placeholderData: [],
  });
}

export function useCreatePatient() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patient, initialNote }) =>
      patientSvc.createPatient(tenantId, patient, initialNote).then((r) => {
        if (r.error) throw r.error;
        return r.data;
      }),
    onMutate: async ({ patient }) => {
      await qc.cancelQueries({ queryKey: QK.patients(tenantId) });
      const prev = qc.getQueryData(QK.patients(tenantId));
      const optimistic = { id: `temp-${Date.now()}`, ...patient, timeline: [] };
      qc.setQueryData(QK.patients(tenantId), (old = []) => [optimistic, ...old]);
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QK.patients(tenantId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.patients(tenantId) }),
  });
}

export function useUpdatePatient() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, updates }) =>
      patientSvc.updatePatient(patientId, updates).then((r) => {
        if (r.error) throw r.error;
        return r.data;
      }),
    onMutate: async ({ patientId, updates }) => {
      await qc.cancelQueries({ queryKey: QK.patients(tenantId) });
      const prev = qc.getQueryData(QK.patients(tenantId));
      qc.setQueryData(QK.patients(tenantId), (old = []) =>
        old.map((p) => (p.id === patientId ? { ...p, ...updates } : p))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QK.patients(tenantId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.patients(tenantId) }),
  });
}

export function useDeletePatient() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patientId) =>
      patientSvc.deletePatient(patientId).then((r) => {
        if (r.error) throw r.error;
      }),
    onMutate: async (patientId) => {
      await qc.cancelQueries({ queryKey: QK.patients(tenantId) });
      const prev = qc.getQueryData(QK.patients(tenantId));
      qc.setQueryData(QK.patients(tenantId), (old = []) =>
        old.filter((p) => p.id !== patientId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QK.patients(tenantId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.patients(tenantId) }),
  });
}

export function useAddClinicalNote() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, note }) =>
      patientSvc.addClinicalNote(tenantId, patientId, note).then((r) => {
        if (r.error) throw r.error;
        return r.data;
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.patients(tenantId) }),
  });
}

/* ════════════════════════════════════════════════════════════════════════════
 *  EXPENSES
 * ════════════════════════════════════════════════════════════════════════════ */

export function useExpenses() {
  const { tenantId } = useClinic();
  return useQuery({
    queryKey: QK.expenses(tenantId),
    queryFn:  () => expenseSvc.fetchExpenses(tenantId).then((r) => {
      if (r.error) throw r.error;
      return r.data;
    }),
    enabled: !!tenantId,
    placeholderData: [],
  });
}

export function useCreateExpense() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expense) =>
      expenseSvc.createExpense(tenantId, expense).then((r) => {
        if (r.error) throw r.error;
        return r.data;
      }),
    onMutate: async (expense) => {
      await qc.cancelQueries({ queryKey: QK.expenses(tenantId) });
      const prev = qc.getQueryData(QK.expenses(tenantId));
      qc.setQueryData(QK.expenses(tenantId), (old = []) => [
        { id: `temp-${Date.now()}`, ...expense, date: new Date().toISOString().slice(0, 10) },
        ...old,
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QK.expenses(tenantId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.expenses(tenantId) }),
  });
}

export function useUpdateExpense() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, updates }) =>
      expenseSvc.updateExpense(expenseId, updates).then((r) => {
        if (r.error) throw r.error;
        return r.data;
      }),
    onMutate: async ({ expenseId, updates }) => {
      await qc.cancelQueries({ queryKey: QK.expenses(tenantId) });
      const prev = qc.getQueryData(QK.expenses(tenantId));
      qc.setQueryData(QK.expenses(tenantId), (old = []) =>
        old.map((e) => (e.id === expenseId ? { ...e, ...updates } : e))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QK.expenses(tenantId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.expenses(tenantId) }),
  });
}

export function useDeleteExpense() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId) =>
      expenseSvc.deleteExpense(expenseId).then((r) => {
        if (r.error) throw r.error;
      }),
    onMutate: async (expenseId) => {
      await qc.cancelQueries({ queryKey: QK.expenses(tenantId) });
      const prev = qc.getQueryData(QK.expenses(tenantId));
      qc.setQueryData(QK.expenses(tenantId), (old = []) =>
        old.filter((e) => e.id !== expenseId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QK.expenses(tenantId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.expenses(tenantId) }),
  });
}

/* ════════════════════════════════════════════════════════════════════════════
 *  BOOKINGS
 * ════════════════════════════════════════════════════════════════════════════ */

export function useBookings() {
  const { tenantId } = useClinic();
  return useQuery({
    queryKey: QK.bookings(tenantId),
    queryFn:  () => bookingSvc.fetchBookings(tenantId).then((r) => {
      if (r.error) throw r.error;
      return r.data;
    }),
    enabled: !!tenantId,
    placeholderData: [],
  });
}

export function useCreateBooking() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (booking) =>
      bookingSvc.createBooking(tenantId, booking).then((r) => {
        if (r.error) throw r.error;
        return r.data;
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.bookings(tenantId) }),
  });
}

export function useConfirmBookingPayment() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, gateway }) =>
      bookingSvc.confirmBookingPayment(bookingId, gateway).then((r) => {
        if (r.error) throw r.error;
        return r.data;
      }),
    onMutate: async ({ bookingId, gateway }) => {
      await qc.cancelQueries({ queryKey: QK.bookings(tenantId) });
      const prev = qc.getQueryData(QK.bookings(tenantId));
      qc.setQueryData(QK.bookings(tenantId), (old = []) =>
        old.map((b) =>
          b.id === bookingId
            ? { ...b, status: "confirmed", gateway, paidAt: new Date().toISOString() }
            : b
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QK.bookings(tenantId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.bookings(tenantId) }),
  });
}

export function useDeleteBooking() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId) =>
      bookingSvc.deleteBooking(bookingId).then((r) => {
        if (r.error) throw r.error;
      }),
    onMutate: async (bookingId) => {
      await qc.cancelQueries({ queryKey: QK.bookings(tenantId) });
      const prev = qc.getQueryData(QK.bookings(tenantId));
      qc.setQueryData(QK.bookings(tenantId), (old = []) =>
        old.filter((b) => b.id !== bookingId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QK.bookings(tenantId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.bookings(tenantId) }),
  });
}

/* ════════════════════════════════════════════════════════════════════════════
 *  INVENTORY
 * ════════════════════════════════════════════════════════════════════════════ */

export function useInventory() {
  const { tenantId } = useClinic();
  return useQuery({
    queryKey: QK.inventory(tenantId),
    queryFn:  () => inventorySvc.fetchInventory(tenantId).then((r) => {
      if (r.error) throw r.error;
      return r.data;
    }),
    enabled: !!tenantId,
    placeholderData: [],
  });
}

export function useUpsertInventoryItem() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ item, editingId }) =>
      editingId
        ? inventorySvc.updateInventoryItem(editingId, item).then((r) => {
            if (r.error) throw r.error;
            return r.data;
          })
        : inventorySvc.createInventoryItem(tenantId, item).then((r) => {
            if (r.error) throw r.error;
            return r.data;
          }),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.inventory(tenantId) }),
  });
}

export function useDeleteInventoryItem() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId) =>
      inventorySvc.deleteInventoryItem(itemId).then((r) => {
        if (r.error) throw r.error;
      }),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: QK.inventory(tenantId) });
      const prev = qc.getQueryData(QK.inventory(tenantId));
      qc.setQueryData(QK.inventory(tenantId), (old = []) =>
        old.filter((i) => i.id !== itemId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QK.inventory(tenantId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.inventory(tenantId) }),
  });
}

/* ════════════════════════════════════════════════════════════════════════════
 *  FEEDBACK & COMPLAINTS
 * ════════════════════════════════════════════════════════════════════════════ */

export function useFeedback() {
  const { tenantId } = useClinic();
  return useQuery({
    queryKey: QK.feedback(tenantId),
    queryFn:  () => feedbackSvc.fetchFeedback(tenantId).then((r) => {
      if (r.error) throw r.error;
      return r.data;
    }),
    enabled: !!tenantId,
    placeholderData: [],
  });
}

export function useSubmitFeedback() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, patientName, ratings, comment }) =>
      feedbackSvc.submitFeedback(tenantId, patientId, patientName, ratings, comment).then((r) => {
        if (r.error) throw r.error;
        return r.data;
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.feedback(tenantId) }),
  });
}

export function useComplaints() {
  const { tenantId } = useClinic();
  return useQuery({
    queryKey: QK.complaints(tenantId),
    queryFn:  () => feedbackSvc.fetchComplaints(tenantId).then((r) => {
      if (r.error) throw r.error;
      return r.data;
    }),
    enabled: !!tenantId,
    placeholderData: [],
  });
}

export function useSubmitComplaint() {
  const { tenantId } = useClinic();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, priority }) =>
      feedbackSvc.submitComplaint(tenantId, text, priority).then((r) => {
        if (r.error) throw r.error;
        return r.data;
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.complaints(tenantId) }),
  });
}
