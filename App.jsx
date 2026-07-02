/**
 * App.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Application root — Phase 3 updated.
 *
 * Tree:
 *   <QueryClientProvider>        ← React Query cache
 *     <ClinicProvider>           ← all clinic state + auth
 *       <AppShell>               ← TenantGate or DashboardLayout
 *     </ClinicProvider>
 *   </QueryClientProvider>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient }         from "./lib/queryClient";
import { ClinicProvider, useClinic } from "./context/ClinicContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import TenantGate      from "./components/layout/TenantGate";

function AppShell() {
  const { tenantId, tenantResolved } = useClinic();
  if (!tenantResolved) return null;
  return tenantId ? <DashboardLayout /> : <TenantGate />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClinicProvider>
        <AppShell />
      </ClinicProvider>
    </QueryClientProvider>
  );
}
