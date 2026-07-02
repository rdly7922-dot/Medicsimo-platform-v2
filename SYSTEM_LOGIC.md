# SYSTEM_LOGIC.md
# Medicsimo — Master Architect Reference Document
# Last updated: 2026-06-30 | Audit status: PASSED ✅

---

## 0. Platform Identity

| Key | Value |
|---|---|
| **Brand name** | Medicsimo |
| **Product** | Medicsimo |
| **Supabase project** | `yuxdpvbffqzkwidenjah` (supabase-lightBlue-village, us-east-1) |
| **Stack** | React 18 · Vite 5 · Tailwind CSS 3 · Supabase · React Query v5 |
| **Migrations applied** | 10 (all additive, zero destructive) |
| **Security audit** | PASSED — 2026-06-30 (1 low-risk residual, see §6) |

---

## 1. Multi-Tenant Isolation via RLS

### 1.1 Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser / PostgREST API                                │
├─────────────────────────────────────────────────────────┤
│  Supabase Auth JWT                                      │
│  claims: { clinic_id: "<uuid>", role: "staff|doctor" } │
├─────────────────────────────────────────────────────────┤
│  RLS Policy Layer (every table)                         │
│  ├── public.jwt_clinic_id()  → extracts clinic_id      │
│  └── internal.is_superadmin() → role bypass            │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                             │
│  Tenant A data ──╮                                      │
│  Tenant B data ──┤ completely isolated in same DB       │
│  Tenant C data ──╯                                      │
└─────────────────────────────────────────────────────────┘
```

### 1.2 RLS Enforcement Rules

Every table that contains tenant data MUST have:

```sql
-- SELECT isolation
CREATE POLICY "tenant_read_{table}" ON public.{table}
  FOR SELECT USING (clinic_id = public.jwt_clinic_id()
                    OR public.is_superadmin());

-- INSERT isolation
CREATE POLICY "tenant_insert_{table}" ON public.{table}
  FOR INSERT WITH CHECK (clinic_id = public.jwt_clinic_id());

-- UPDATE/DELETE isolation
CREATE POLICY "tenant_modify_{table}" ON public.{table}
  FOR UPDATE USING (clinic_id = public.jwt_clinic_id());
```

### 1.3 Helper Function Architecture

| Function | Schema | Type | Purpose |
|---|---|---|---|
| `jwt_clinic_id()` | `public` | SECURITY INVOKER wrapper | Safe PostgREST exposure; returns clinic_id from JWT |
| `is_superadmin()` | `public` | SECURITY INVOKER wrapper | Safe PostgREST exposure; checks role=superadmin |
| `jwt_clinic_id()` | `internal` | SECURITY DEFINER | Actual JWT extraction — not exposed via PostgREST |
| `is_superadmin()` | `internal` | SECURITY DEFINER | Actual role check — not exposed via PostgREST |

**Rule**: All `SECURITY DEFINER` functions that must not be called by the browser live in the `internal` schema. PostgREST only exposes `public.*`.

### 1.4 Superadmin Bypass Pattern

```sql
-- Inside any RLS policy:
USING (clinic_id = public.jwt_clinic_id() OR public.is_superadmin())
```

Superadmin JWT must contain: `user_metadata.role = "superadmin"`

Set via:
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"superadmin"}'::jsonb
WHERE email = 'admin@medicsimo.app';
```

### 1.5 Subdomain Routing

Each clinic maps to a unique subdomain:
```
al-noor-erbil.medicsimo.app  →  workspace_id = "al-noor-erbil"
zakho-dental.medicsimo.app →  workspace_id = "zakho-dental"
```

**DB column**: `clinics.subdomain_slug TEXT UNIQUE`
**Backfilled**: Automatically mirrors `workspace_id` for existing clinics.

**Frontend routing logic** (add to `main.jsx`):
```js
const host = window.location.hostname;
const parts = host.split('.');
const isSubdomain = parts.length >= 3 && parts[0] !== 'www';
const workspaceSlug = isSubdomain ? parts[0] : null;

// Pre-fill TenantGate input if subdomain detected
if (workspaceSlug) joinTenant(workspaceSlug);
```

### 1.6 Tables with RLS Enabled (22 total)

| Table | RLS | Tenant-scoped |
|---|---|---|
| `clinics` | ✅ | superadmin only for write |
| `patients` | ✅ | clinic_id |
| `patient_notes` | ✅ | clinic_id |
| `appointments` | ✅ | clinic_id |
| `expenses` | ✅ | clinic_id |
| `inventory_items` | ✅ | clinic_id |
| `inventory_movements` | ✅ | clinic_id |
| `subscriptions` | ✅ | clinic_id (read) |
| `patient_feedback` | ✅ | clinic_id |
| `complaints` | ✅ | clinic_id |
| `payment_transactions` | ✅ | clinic_id (read) / service_role (write) |
| `superadmin_audit_log` | ✅ | superadmin only |
| `orders` | ✅ | clinic_id |
| `order_items` | ✅ | via orders.clinic_id |
| `products` | ✅ | clinic_id |
| `departments` | ✅ | clinic_id |
| `doctors` | ✅ | clinic_id |
| `clinic_members` | ✅ | clinic_id |
| `whatsapp_messages` | ✅ | clinic_id |
| `specialties` | ✅ | public read / superadmin write |
| `clinic_specialties` | ✅ | clinic_id (read) / superadmin (write) |

### 1.7 Sensitive RPC Lockdown

| Function | anon | authenticated | service_role |
|---|---|---|---|
| `record_gateway_payment` | ❌ | ❌ | ✅ |
| `superadmin_activate_clinic` | ❌ | ❌ | ✅ |
| `superadmin_suspend_clinic` | ❌ | ❌ | ✅ |
| `jwt_clinic_id` | ✅ (INVOKER, safe) | ✅ | ✅ |
| `is_superadmin` | ✅ (INVOKER, safe) | ✅ | ✅ |

---

## 2. PWA Offline-First Capabilities

### 2.1 Current State

| Layer | Implementation | Status |
|---|---|---|
| React Query cache | `networkMode: "offlineFirst"`, stale 3min, gc 10min | ✅ Active |
| localStorage fallback | `src/utils/storage.js` — async loadStored/saveStored | ✅ Active |
| Service Worker | Not yet implemented | ⚠️ Required |
| Web App Manifest | Not yet implemented | ⚠️ Required |

### 2.2 Required: Service Worker Setup

Add `vite-plugin-pwa` for automatic service worker generation:

```bash
npm install -D vite-plugin-pwa
```

**vite.config.js** addition:
```js
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      runtimeCaching: [
        {
          // Cache Supabase REST API responses
          urlPattern: /^https:\/\/yuxdpvbffqzkwidenjah\.supabase\.co\/rest/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api',
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
          },
        },
      ],
    },
    manifest: {
      name: 'مركز دجلة الطبي — Medicsimo',
      short_name: 'Medicsimo',
      description: 'Multi-tenant Dental Clinic Management',
      theme_color: '#0f766e',
      background_color: '#0f172a',
      display: 'standalone',
      orientation: 'any',
      start_url: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
  }),
],
```

### 2.3 Offline Data Strategy

```
User opens app (offline)
  │
  ├── React Query reads from in-memory cache (staleTime: 3min)
  │     └── If cache miss → reads from localStorage via storage.js
  │
  ├── Mutations queue (networkMode: "offlineFirst")
  │     └── Auto-replay when connection returns
  │
  └── Service Worker (after setup)
        └── Cache-first for static assets
        └── Network-first for API calls with offline fallback
```

### 2.4 Offline-Safe Operations

| Operation | Offline behavior |
|---|---|
| View patients | ✅ Served from React Query cache |
| View expenses | ✅ Served from React Query cache |
| Add patient | ✅ Optimistic UI + queued mutation |
| Add expense | ✅ Optimistic UI + queued mutation |
| Process payment | ⚠️ Requires network (gateway API) |
| Backup download | ✅ Uses `useBackup.js` JSON export |

### 2.5 Manual Backup (Always Available)

`src/hooks/useBackup.js` exports all clinic data as a downloadable JSON file — works completely offline, no network required.

---

## 3. Localization & RTL Support

### 3.1 Supported Languages

| Code | Language | Script | Direction |
|---|---|---|---|
| `ar` | Arabic | Arabic | RTL |
| `en` | English | Latin | LTR |
| `bad` | Kurdish Badini | Arabic | RTL |
| `sor` | Kurdish Sorani | Arabic | RTL |

### 3.2 Architecture

```
src/utils/i18n.js
  └── TRANSLATIONS object: ~1,400 strings × 4 languages
        └── accessed via t(key) from useTranslation()

src/hooks/useTranslation.js
  └── useTranslation()
        ├── t(key)      — returns translated string
        ├── isRtl       — true for ar/bad/sor
        └── applies dir="rtl|ltr" to <html> element
```

### 3.3 RTL Implementation Rules

**RULE 1**: Direction applied globally at `<html>` level, not per-component:
```js
// useTranslation.js
useEffect(() => {
  document.documentElement.dir  = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}, [lang]);
```

**RULE 2**: Use CSS logical properties everywhere — never `left/right`:
```css
/* ✅ CORRECT — works in both directions */
padding-inline-start: 1rem;
margin-inline-end: 0.5rem;
inset-inline-start: 0;

/* ❌ WRONG — breaks RTL */
padding-left: 1rem;
margin-right: 0.5rem;
left: 0;
```

**RULE 3**: Tailwind logical property classes:
```
ps-* pe-*     → padding-inline-start/end
ms-* me-*     → margin-inline-start/end
start-* end-* → inset-inline-start/end
border-s border-e → logical borders
```

### 3.4 Kurdish-Specific Rules

- Badini and Sorani both use Arabic script → RTL applies
- Font size for Kurdish labels: use `text-[12.5px]` instead of `text-sm` (13px) — Arabic characters in Kurdish dialects are slightly wider
- In Sidebar, the `isKurdish` flag reduces nav label size:
  ```js
  const isKurdish = lang === "bad" || lang === "sor";
  className={isKurdish ? "text-[12.5px]" : "text-sm"}
  ```

### 3.5 Adding New Translation Keys

1. Add key to all 4 language objects in `src/utils/i18n.js`
2. Never hard-code Arabic/Kurdish strings in JSX — always use `t("key")`
3. If a translation is missing, the key string itself is returned (visible in UI as a debug signal)

### 3.6 DB Localization

The `specialties` table stores names in all 4 languages:
```sql
name_ar  TEXT NOT NULL,  -- Arabic
name_en  TEXT NOT NULL,  -- English
name_bad TEXT,           -- Badini Kurdish
name_sor TEXT,           -- Sorani Kurdish
```

Frontend selects the correct column based on current `lang` value:
```js
const localizedName = specialty[`name_${lang}`] ?? specialty.name_en;
```

---

## 4. Multi-Specialty Architecture

### 4.1 Current Specialty: Dental

All existing workflows (patient kanban, inventory, bookings) default to the `dental` specialty slug.

### 4.2 DB Schema for Multi-Specialty

```
specialties
  id · slug · name_ar · name_en · name_bad · name_sor · icon · is_active

clinic_specialties
  clinic_id · specialty_id · is_primary
  (A clinic can serve multiple specialties)

patients
  specialty_id (nullable FK → specialties.id)

appointments
  specialty_id (nullable FK → specialties.id)
```

### 4.3 Adding a New Specialty (e.g., Orthopedics)

**Step 1 — DB**: Insert the specialty:
```sql
INSERT INTO public.specialties (slug, name_ar, name_en, name_bad, name_sor, icon)
VALUES ('orthopedic', 'طب العظام', 'Orthopedic', 'Hestî', 'ئێسکپزیشکی', 'bone');
```

**Step 2 — DB**: Link to a clinic:
```sql
INSERT INTO public.clinic_specialties (clinic_id, specialty_id, is_primary)
VALUES ('<clinic-uuid>', (SELECT id FROM specialties WHERE slug='orthopedic'), false);
```

**Step 3 — Frontend**: Add to `CATEGORY_KEYS` in `src/constants/seedData.js`

**Step 4 — i18n**: Add specialty label to all 4 languages in `src/utils/i18n.js`

**Step 5 — Views**: Filter by specialty in patients/bookings views:
```js
const filtered = patients.filter(p =>
  !activeSpecialty || p.specialtyId === activeSpecialty
);
```

### 4.4 Specialty-Aware Inventory

When multi-specialty is active, inventory items should carry a `specialty_id`:
```sql
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS specialty_id UUID
    REFERENCES public.specialties(id) ON DELETE SET NULL;
```

This allows the secretary to filter supplies by department (dental supplies vs orthopedic equipment).

### 4.5 Future: Department Routing

The existing `departments` table supports routing patients to different specialty departments within the same clinic. The kanban board in `PatientsView` can be extended with a department filter tab:

```jsx
// Planned extension
<SpecialtyTabBar
  specialties={clinicSpecialties}
  active={activeSpecialty}
  onChange={setActiveSpecialty}
/>
```

---

## 5. Security Hardening Summary

### 5.1 Migrations Applied

| Migration | Purpose |
|---|---|
| `create_core_multitenant_schema` | Core tables, RLS foundations |
| `create_clinical_tables` | patients, notes, appointments |
| `create_commerce_inventory_whatsapp` | inventory, orders, messages |
| `dijla_saas_additive_layer_v1` | expenses, subscriptions, feedback, audit |
| `dijla_superadmin_and_payments_v1` | payment_transactions, RPCs, overview view |
| `dijla_master_architect_security_hardening` | RLS fixes, specialty tables, subdomain |
| `dijla_security_final_lockdown` | internal schema, search_path pins, RPC lockdown |
| `dijla_rpc_postgrest_exposure_fix` | Explicit REVOKE FROM PUBLIC on 3 service-role-only RPCs |
| `medicsimo_universal_specialty_taxonomy` | 50-specialty taxonomy, category column, clinics.specialty_id FK |
| `medicsimo_backfill_legacy_dental_category` | Backfilled null category on legacy 'dental' slug |

> **Naming note (Medicsimo rebrand, 2026-07-02):** Migration names before this
> date use the `dijla_` prefix and are intentionally left unchanged. Supabase
> records migration names permanently in `supabase_migrations.schema_migrations`
> as an immutable historical ledger — renaming them would require dropping and
> re-applying already-live schema changes on a production database for zero
> functional benefit, purely cosmetic. All migrations from
> `medicsimo_universal_specialty_taxonomy` onward use the new prefix.

### 5.2 Resolved Security Issues

| Issue | Fix Applied | Status |
|---|---|---|
| SECURITY DEFINER view | Recreated with `security_invoker = true` | ✅ Resolved |
| Mutable search_path on 7 functions | `SET search_path = public, pg_catalog` added | ✅ Resolved |
| anon/authenticated callable SECURITY DEFINER RPCs (6 lint warnings) | `REVOKE ALL ... FROM PUBLIC, anon, authenticated` — PostgREST checks the PUBLIC grant chain, not just role-specific grants | ✅ Resolved |
| Permissive INSERT on orders/order_items | Replaced `WITH CHECK (true)` with clinic_id scoping | ✅ Resolved |
| `pg_trgm` extension in public schema | Not fixed — requires extension relocation, low risk (extension itself has no RLS-bypass capability), deferred to Pro-plan maintenance window | ⚠️ Documented, deferred |

### 5.3 Edge Function Security

All 4 payment webhooks:
- Verify HMAC-SHA256 signature before processing
- Use `service_role` key (never anon key)
- Constant-time comparison to prevent timing attacks
- Return 200 even on processing error (prevents gateway retries exposing internals)

---

## 6. Hardcoded Values to Review Before Production

| Location | Value | Action needed |
|---|---|---|
| `asia-hawala-webhook/index.ts` | IQD/USD rate = 1310 | Move to `clinics.iqd_usd_rate` column |
| `fib-webhook/index.ts` | IQD/USD rate = 1310 | Same |
| `zain-cash-webhook/index.ts` | IQD/USD rate = 1310 | Same |
| `qi-card-webhook/index.ts` | IQD/USD rate = 1310 | Same |
| `superadminService.js` | Subscription price $25 | Move to `platform_config` table |
| `ProvisionClinicPanel.jsx` | Passcode stored as plaintext | Hash via Edge Function before insert |

---

## 7. File Structure Reference

```
medicsimo/
├── src/
│   ├── App.jsx                        # QueryClientProvider + ClinicProvider root
│   ├── main.jsx                       # React 18 entry + subdomain routing (planned)
│   ├── index.css                      # Tailwind + RTL logical property shims
│   ├── context/ClinicContext.jsx      # All clinic state — single source of truth
│   ├── hooks/
│   │   ├── useTranslation.js          # t() + isRtl + <html> dir management
│   │   └── useBackup.js               # Offline JSON export/restore
│   ├── utils/
│   │   ├── i18n.js                    # ~1,400 strings × 4 languages
│   │   ├── storage.js                 # Async localStorage with offline fallback
│   │   ├── formatters.js              # fmtIQD, fmtDate
│   │   └── webhooks.js                # notifyWebhook, buildWhatsAppLink
│   ├── constants/seedData.js          # Mock data, CATEGORY_KEYS, GATEWAY_KEYS
│   ├── lib/
│   │   ├── supabase.js                # Singleton client
│   │   └── queryClient.js             # React Query config (offline-first)
│   ├── services/
│   │   ├── authService.js             # Supabase Auth + workspace resolution
│   │   ├── patientService.js          # Patient CRUD + notes
│   │   ├── expenseService.js          # Expense CRUD
│   │   ├── bookingService.js          # Booking CRUD + payment confirmation
│   │   ├── inventoryService.js        # Inventory CRUD
│   │   ├── feedbackService.js         # Feedback + complaints
│   │   ├── superadminService.js       # Superadmin portal data layer
│   │   └── useClinicData.js           # React Query hooks (optimistic UI)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TenantGate.jsx         # Workspace login
│   │   │   ├── Sidebar.jsx            # Nav + tenant badge
│   │   │   ├── Header.jsx             # Search + role + lang
│   │   │   └── DashboardLayout.jsx    # Shell + all modal mounting
│   │   ├── ui/ui.jsx                  # GlassPanel, StatCard, StatusDot, etc.
│   │   └── modals/
│   │       ├── PasscodeModal.jsx      # Doctor auth + recovery
│   │       └── AppModals.jsx          # All 7 view modals
│   ├── views/
│   │   ├── OverviewView.jsx           # KPI + Recharts + expenses
│   │   ├── PatientsView.jsx           # Kanban + profile panel
│   │   ├── BookingsView.jsx           # Pending bookings + checkout
│   │   ├── LoyaltyView.jsx            # Points grid
│   │   ├── AIIntelligenceView.jsx     # Surveys + complaints
│   │   ├── ExecutiveReportView.jsx    # Doctor-only briefing
│   │   ├── InventoryView.jsx          # Stock grid with expiry alerts
│   │   └── PlatformSettingsView.jsx   # Webhook + subscriptions + passcode
│   └── superadmin/
│       ├── SuperadminApp.jsx          # Auth guard + QueryClientProvider
│       ├── views/
│       │   ├── SuperadminLogin.jsx    # Platform owner login
│       │   └── SuperadminDashboard.jsx # 4-tab shell
│       └── components/
│           ├── ClinicsPanel.jsx       # Tenant list + activate/suspend
│           ├── PaymentsPanel.jsx      # Transaction ledger
│           ├── AuditLogPanel.jsx      # Immutable audit trail
│           └── ProvisionClinicPanel.jsx # New clinic form
├── supabase/functions/
│   ├── gateway-shared/verify.js       # HMAC-SHA256 shared utility
│   ├── zain-cash-webhook/index.ts     # Zain Cash webhook
│   ├── fib-webhook/index.ts           # FIB webhook
│   ├── asia-hawala-webhook/index.ts   # AsiaHawala webhook
│   └── qi-card-webhook/index.ts       # Qi Card webhook
├── DEPLOY.md                          # Deployment instructions
├── SYSTEM_LOGIC.md                    # This file
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
└── .env.example
```

---

## 8. Audit Checklist

Run before every production deployment:

- [ ] `Supabase:get_advisors(type: "security")` returns 0 critical issues
- [ ] `Supabase:get_advisors(type: "performance")` reviewed
- [ ] All new tables have RLS enabled
- [ ] All new SECURITY DEFINER functions are in `internal` schema
- [ ] All new public-facing functions use SECURITY INVOKER
- [ ] `SET search_path = public, pg_catalog` on all new functions
- [ ] No hardcoded clinic_id, rate, or price values in new code
- [ ] i18n keys added for all 4 languages for any new UI text
- [ ] CSS logical properties used (no `left:`, `right:`, `padding-left:`)
- [ ] Any new patient/appointment table has `specialty_id` FK column

---

*Document auto-maintained by the Medicsimo Master Architect Audit process.*
*Supabase project: `yuxdpvbffqzkwidenjah` · Region: us-east-1*
