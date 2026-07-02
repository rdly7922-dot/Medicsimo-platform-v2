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
import { queryClient }            from "./queryClient";
import { ClinicProvider, useClinic } from "./ClinicContext";
import DashboardLayout            from "./DashboardLayout";
import TenantGate                 from "./TenantGate";


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
