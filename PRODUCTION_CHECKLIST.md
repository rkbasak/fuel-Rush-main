# ⛽ Fuel Rush — Production Readiness Checklist

> Based on the full codebase audit. Items marked ✅ are already done. Items marked ⚠️ must be completed before going live.

---

## 🔑 1. Environment Variables

| # | Task | Status |
|---|------|--------|
| 1.1 | Create `.env.local` (or Vercel env dashboard) with **all required variables** | ⚠️ Do it |
| 1.2 | `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL | ⚠️ Required |
| 1.3 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key | ⚠️ Required |
| 1.4 | `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key (**keep secret**) | ⚠️ Required |
| 1.5 | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Maps JavaScript API + Places API enabled | ⚠️ Required |
| 1.6 | `GEMINI_API_KEY` — primary AI key from aistudio.google.com | ⚠️ Required |
| 1.7 | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — from upstash.com | ⚠️ Required (rate limiting won't work without it) |
| 1.8 | `NEXT_PUBLIC_APP_URL` — your production domain e.g. `https://fuelrush.app` | ⚠️ Required |
| 1.9 | `OPENAI_API_KEY` / `GROQ_API_KEY` / `ANTHROPIC_API_KEY` — AI fallback chain | 💡 Recommended (prevents downtime when Gemini hits rate limits) |
| 1.10 | Firebase vars (`NEXT_PUBLIC_FIREBASE_*`) — for FCM push notifications | 💡 Optional for v1 |

---

## 🗄️ 2. Supabase Database

| # | Task | Status |
|---|------|--------|
| 2.1 | Run **all 9 migrations** in order from `supabase/migrations/` | ⚠️ Required |
| | `000_local_setup.sql` → `001_initial_schema.sql` → `002_community_engine.sql` | |
| | `002_phase34_ai_rationing.sql` → `003_notifications.sql` → `004_motorcycle_limit_enforcement.sql` | |
| | `005_fix_station_rls_policy.sql` → `006_station_votes.sql` → `007_saas_infrastructure_v2.sql` | |
| 2.2 | Fix the **overly permissive RLS policy** on `stations` table | ⚠️ Security |
| | Run this SQL in Supabase → SQL Editor: | |
| | `DROP POLICY IF EXISTS "Last reporter can update station status" ON public.stations;` | |
| | `CREATE POLICY "Last reporter can update station status" ON public.stations FOR UPDATE USING (auth.uid() = last_reporter_id);` | |
| 2.3 | Enable **Row Level Security (RLS)** on all tables — verify it's ON | ⚠️ Required |
| 2.4 | Enable **Supabase Realtime** for the `stations` and `reports` tables | ⚠️ Required (live map updates) |
| 2.5 | Seed **real Dhaka station data** — replace mock data from `scripts/seed-data.ts` | ⚠️ Required |
| 2.6 | Set up a **Supabase database backup schedule** (Settings → Database → Backups) | 💡 Recommended |

---

## 🔐 3. Security — Must Fix Before Launch

| # | Task | Status |
|---|------|--------|
| 3.1 | **Fix Admin auth passthrough** in `src/app/admin/layout.tsx` line 67 | ⚠️ CRITICAL |
| | `setIsAuthorized(true)` fires for **all** users — replace with a real Supabase role check | |
| 3.2 | Add **`src/middleware.ts`** to protect `/main/*` and `/admin/*` routes at the Edge | ⚠️ Required |
| | Without this, route protection is only client-side and easily bypassed | |
| 3.3 | Add your **Google Maps API key domain restriction** in Google Cloud Console | ⚠️ Required (prevents key theft) |
| | Restrict to: `https://your-domain.com/*` only | |
| 3.4 | Verify `GEMINI_API_KEY` has **lazy initialization** in `src/lib/gemini/client.ts` | ⚠️ Required (prevents build crash) |
| | Should NOT throw at module load time — only at call time | |
| 3.5 | Remove **sensitive `console.log` statements** from production | ⚠️ Required |
| | `src/stores/index.ts` line 98 — Remove station report log | |
| | `src/stores/index.ts` line 280 — Remove heartbeat log | |
| | `src/lib/redis/client.ts` — Remove Redis URL from log output | |
| 3.6 | Set `reactStrictMode: true` in `next.config.mjs` (currently `false`) | 💡 Recommended |

---

## 🛡️ 4. Admin Panel Hardening

| # | Task | Status |
|---|------|--------|
| 4.1 | **Add a real admin `role` column** to Supabase `users` table (check migration 007) | ⚠️ Required |
| 4.2 | **Fix admin layout auth check** — replace the dev passthrough | ⚠️ CRITICAL |

```typescript
// In src/app/admin/layout.tsx — replace current useEffect with:
useEffect(() => {
  const checkAdmin = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') { router.push('/main/map'); return; }
    setIsAuthorized(true);
  };
  checkAdmin();
}, [router]);
```

| # | Task | Status |
|---|------|--------|
| 4.3 | Set your user's role to admin in Supabase SQL Editor: | ⚠️ Required |
| | `UPDATE users SET role = 'admin' WHERE id = 'your-user-id';` | |
| 4.4 | Wire the **Admin Settings page** to actually update Supabase `site_settings` table (verify migration 007 ran) | ⚠️ Required |

---

## 🌐 5. Deployment — Vercel (Recommended)

| # | Task | Status |
|---|------|--------|
| 5.1 | Push all code to GitHub (`main` branch) | ⚠️ Do it |
| 5.2 | Go to [vercel.com](https://vercel.com) → Import Git Repository | ⚠️ Do it |
| 5.3 | Add **all environment variables** from Section 1 in Vercel → Settings → Environment Variables | ⚠️ Do it |
| 5.4 | Framework Preset = Next.js, Build command = `npm run build`, Output = `.next` | ✅ Auto-detected |
| 5.5 | Set **Node.js version** = 20.x (matches `engines` in `package.json`) | ⚠️ Verify in Vercel settings |
| 5.6 | Add your **custom domain** in Vercel → Settings → Domains | 💡 Optional |
| 5.7 | Run `npm run build` locally first to catch any build errors | ⚠️ Do it |

---

## 📦 6. Alternative: Self-Host with Docker

| # | Task | Status |
|---|------|--------|
| 6.1 | Copy `.env.example` → `.env` and fill in all values | ⚠️ Required |
| 6.2 | Run `docker compose up -d` | ⚠️ Do it |
| 6.3 | Set up **nginx reverse proxy** with SSL via Certbot | ⚠️ Required for HTTPS |
| 6.4 | Configure health check on `/api/heartbeat` for uptime monitoring | 💡 Recommended |

> See [SELF_HOST.md](./SELF_HOST.md) or [BTPANEL.md](./BTPANEL.md) for detailed guides.

---

## 📱 7. Android / PWA

| # | Task | Status |
|---|------|--------|
| 7.1 | Update `NEXT_PUBLIC_APP_URL` to your live domain before building APK | ⚠️ Required |
| 7.2 | Run `npx cap sync android` to push web assets into the Android project | ⚠️ Required |
| 7.3 | Update `android/app/build.gradle` — set `versionCode` and `versionName` | ⚠️ Required |
| 7.4 | Build release APK: `cd android && ./gradlew assembleRelease` | ⚠️ Do it |
| 7.5 | Sign the APK with your keystore (required for Play Store) | ⚠️ Required for Play Store |
| 7.6 | Test PWA: open live URL on Android → "Add to Home Screen" | ⚠️ Verify |
| 7.7 | Verify `public/manifest.json` has correct app name, icons, colors | ⚠️ Verify |

---

## 🔔 8. Firebase Push Notifications

| # | Task | Status |
|---|------|--------|
| 8.1 | Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) | ⚠️ Required for push |
| 8.2 | Enable **Cloud Messaging (FCM)** in Firebase project settings | ⚠️ Required |
| 8.3 | Get **VAPID key** from Firebase → Project Settings → Cloud Messaging → Web Push | ⚠️ Required |
| 8.4 | Add `public/firebase-messaging-sw.js` service worker file | ⚠️ Required |
| 8.5 | Fill in all `NEXT_PUBLIC_FIREBASE_*` env vars | ⚠️ Required |

---

## 🗺️ 9. Google Maps — API Setup

| # | Task | Status |
|---|------|--------|
| 9.1 | Enable **Maps JavaScript API** in Google Cloud Console | ⚠️ Required |
| 9.2 | Enable **Places API (New)** — needed for AI station discovery | ⚠️ Required |
| 9.3 | Set **HTTP referrer restriction** on the API key to your domain only | ⚠️ Required |
| 9.4 | Set up **billing alert** in Google Cloud (Maps API costs money at scale) | ⚠️ Recommended |

---

## 📊 10. Monitoring & Observability

| # | Task | Status |
|---|------|--------|
| 10.1 | Enable **Vercel Analytics** (free tier available) | 💡 Recommended |
| 10.2 | Set up **Supabase email alerts** for DB storage / API quota | 💡 Recommended |
| 10.3 | Monitor **Upstash Redis usage** — free tier has 10k commands/day limit | ⚠️ Watch this |
| 10.4 | Set up **Gemini API quota alerts** in Google AI Studio | 💡 Recommended |
| 10.5 | Remove all `console.log` debug statements (see Section 3.5) | ⚠️ Required |

---

## ✅ 11. Pre-Launch Final Checks

| # | Task | Status |
|---|------|--------|
| 11.1 | Run `npm run build` locally — **must succeed with zero errors** | ⚠️ Required |
| 11.2 | Run `npm run lint` — **must pass** | ⚠️ Required |
| 11.3 | Test on a **real Android device** (not just Chrome DevTools mobile) | ⚠️ Required |
| 11.4 | Test **login with a real phone number** OTP flow end-to-end | ⚠️ Required |
| 11.5 | Submit a **fuel report** and verify it appears on the live map | ⚠️ Required |
| 11.6 | Test **AI Route Optimizer** with a real Gemini API key | ⚠️ Required |
| 11.7 | Test **Admin Panel** with admin role user — verify non-admins are blocked | ⚠️ Required |
| 11.8 | Test **CSV bulk import** with a real `.csv` file | ⚠️ Verify |
| 11.9 | Test **AI Station Discovery** with Google Places API enabled | ⚠️ Verify |
| 11.10 | Verify **map loads** in production (API key restricted to your domain) | ⚠️ Required |

---

## 🚀 Priority Order — Shortest Path to Live

```
1. Set up Supabase → run all 9 migrations in order
2. Get all API keys → fill in .env.local or Vercel dashboard
3. Fix admin auth passthrough (CRITICAL — see Section 4.2)
4. Add middleware.ts for edge-level route protection
5. Fix RLS policy (1 SQL query in Supabase SQL Editor)
6. Remove console.log debug statements
7. Run npm run build → fix any errors
8. Deploy to Vercel → verify env vars in dashboard
9. Test login → report → admin panel end-to-end
10. Restrict Google Maps API key to your domain
11. 🎉 Live!
```

---

> **Current state:** The app is fully built and functional in development. The main blockers for production are the **admin auth passthrough** (anyone can access `/admin`), the **missing `middleware.ts`**, and **filling in real API keys**.
