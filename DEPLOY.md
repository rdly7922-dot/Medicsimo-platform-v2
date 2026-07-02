# Medicsimo Medical SaaS — Deployment Guide

## Prerequisites
- Node.js 18+
- Supabase CLI: `npm install -g supabase`
- Project ID: `yuxdpvbffqzkwidenjah`

---

## 1 — Environment Setup

```bash
cp .env.example .env
```

Fill in `.env`:
```
VITE_SUPABASE_URL=https://yuxdpvbffqzkwidenjah.supabase.co
VITE_SUPABASE_ANON_KEY=<from Supabase Dashboard → Settings → API → anon public>
```

---

## 2 — Install & Run Locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## 3 — Create Your Superadmin Account

In Supabase Dashboard → Authentication → Users → Add User:
- Email: your email
- Password: strong password
- Then run in SQL Editor:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"superadmin"}'::jsonb
WHERE email = 'your-email@example.com';
```

Access the superadmin portal at: `http://localhost:3000/superadmin`

---

## 4 — Deploy Edge Functions

```bash
supabase login
supabase link --project-ref yuxdpvbffqzkwidenjah

# Deploy all payment webhook functions
supabase functions deploy zain-cash-webhook
supabase functions deploy fib-webhook
supabase functions deploy asia-hawala-webhook
supabase functions deploy qi-card-webhook

# Set secrets for each gateway
supabase secrets set ZAIN_CASH_WEBHOOK_SECRET=<from Zain Cash portal>
supabase secrets set FIB_WEBHOOK_SECRET=<from FIB portal>
supabase secrets set ASIA_HAWALA_WEBHOOK_SECRET=<from AsiaHawala portal>
supabase secrets set QI_CARD_WEBHOOK_SECRET=<from Qi Card portal>
```

### Webhook URLs to register with each gateway:
```
Zain Cash:   https://yuxdpvbffqzkwidenjah.supabase.co/functions/v1/zain-cash-webhook
FIB:         https://yuxdpvbffqzkwidenjah.supabase.co/functions/v1/fib-webhook
AsiaHawala:  https://yuxdpvbffqzkwidenjah.supabase.co/functions/v1/asia-hawala-webhook
Qi Card:     https://yuxdpvbffqzkwidenjah.supabase.co/functions/v1/qi-card-webhook
```

---

## 5 — Production Build

```bash
npm run build
# Output in /dist — deploy to Vercel, Netlify, or Cloudflare Pages
```

### Vercel (recommended):
```bash
npx vercel --prod
```

---

## 6 — Adding the Superadmin Route

In `src/main.jsx`, add routing for `/superadmin`:

```jsx
import SuperadminApp from "./superadmin/SuperadminApp";

const path = window.location.pathname;
if (path.startsWith("/superadmin")) {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode><SuperadminApp /></React.StrictMode>
  );
} else {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode><App /></React.StrictMode>
  );
}
```

---

## 7 — Onboarding First Clinic

1. Sign in to `/superadmin`
2. Click **New Clinic** tab
3. Fill in clinic name, workspace ID, owner email, initial passcode
4. Click **Provision Clinic**
5. Share the workspace ID with the clinic owner
6. When payment is received, click **Activate** in the Clinics tab

---

## Architecture Summary

```
Browser
  ├── /                  → Clinic tenant dashboard (ClinicProvider + React Query)
  └── /superadmin        → Platform owner portal (separate auth)

Supabase Project: yuxdpvbffqzkwidenjah
  ├── Auth               → JWT with clinic_id claim
  ├── Database (RLS)     → jwt_clinic_id() + is_superadmin() isolation
  ├── Edge Functions     → 4 payment gateway webhooks
  └── Views              → superadmin_clinic_overview
```
