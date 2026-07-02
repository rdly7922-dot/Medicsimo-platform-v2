/**
 * SuperadminApp.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Root of the Superadmin portal. Completely separate from the clinic tenant UI.
 *
 * Access: /superadmin route (configured in vite.config or router)
 *
 * Auth guard:
 *   1. Must be signed in via Supabase Auth
 *   2. user_metadata.role must equal "superadmin"
 *   3. All DB calls are further protected by is_superadmin() RLS
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from "react";
import { supabase }              from "../lib/supabase";
import { QueryClientProvider }   from "@tanstack/react-query";
import { queryClient }           from "../lib/queryClient";
import SuperadminLogin           from "./views/SuperadminLogin";
import SuperadminDashboard       from "./views/SuperadminDashboard";

export default function SuperadminApp() {
  const [session,  setSession]  = useState(undefined); // undefined = loading
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    // Resolve initial session
    supabase.auth.getSession().then(({ data }) => {
      const s = data?.session ?? null;
      setSession(s);
      setIsSuperadmin(s?.user?.user_metadata?.role === "superadmin");
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setIsSuperadmin(s?.user?.user_metadata?.role === "superadmin");
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-400/30 border-t-teal-400 animate-spin" />
      </div>
    );
  }

  // Not authenticated or not superadmin
  if (!session || !isSuperadmin) {
    return <SuperadminLogin />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SuperadminDashboard session={session} />
    </QueryClientProvider>
  );
}
