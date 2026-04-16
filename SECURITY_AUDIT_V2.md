# Fuel Rush Security Audit — v2

**Auditor:** Mr. Code Auditor  
**Date:** 2026-03-27 | **Review Updated:** 2026-03-29  
**Branch:** `security-audit-v2`  
**Repo:** `adnanizaman-star/fuel-Rush`  

---

## Executive Summary

Vercel deployment may be failing due to the `GEMINI_API_KEY` being thrown at module load time when not set. Beyond that, **multiple critical/high security issues** were found that need immediate fixing.

---

## 🔴 CRITICAL Issues

### C1: `GEMINI_API_KEY` Throws at Module Load (DEPLOYMENT BREAKER)
**File:** `src/lib/gemini/client.ts:5`

```ts
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}
```

This `throw` executes when the module is first imported — including during `next build` if any code path imports `gemini/client.ts`. If `GEMINI_API_KEY` is not set in the Vercel environment, **the build will crash**.

**Fix required:** Convert to lazy initialization (check at call time, not import time).

---

### C2: No Authentication on `/api/chat` — ✅ RESOLVED
**File:** `src/app/api/chat/route.ts`

The chat API previously had zero authentication checks. **Fixed:** `supabase.auth.getUser()` auth check is now in place, and `getReportRateLimiter()` is awaited and enforced (3 RPM per user via Upstash Redis sliding window).

---

### C3: No Authentication on `/api/routes/optimize` — ✅ RESOLVED
**File:** `src/app/api/routes/optimize/route.ts`

Previously open — no auth or rate limiting. **Fixed:** `supabase.auth.getUser()` check added; `getReportRateLimiter()` awaited and enforced.

---

## 🟠 HIGH Issues

### H1: Rate Limiter Defined But Never Used — ✅ RESOLVED
**File:** `src/lib/redis/client.ts`

The rate limiter (`Ratelimit.slidingWindow`) is now **actively called** in `/api/chat`, `/api/routes/optimize`, and `/api/stations/[id]/report` via `await getReportRateLimiter()`. The missing `await` on the Promise was also fixed.

---

### H2: Overly Permissive Station Update Policy
**File:** `supabase/migrations/001_initial_schema.sql:89-92`

```sql
CREATE POLICY "Last reporter can update station status" ON public.stations FOR UPDATE USING (
  auth.uid() IS NOT NULL   -- <-- WRONG: any authenticated user
  OR last_reporter_id = auth.uid()  -- (also wrong: no parens around OR)
);
```

The policy says: "anyone who is authenticated OR is the last reporter can update". Should be: "only the last reporter can update". Also missing parentheses around the OR expression.

**Fix required:**
```sql
CREATE POLICY "Last reporter can update station status" ON public.stations FOR UPDATE USING (
  auth.uid() = last_reporter_id
);
```

---

### H3: Console.log Leaking Sensitive Data
Multiple locations leak data via `console.log`:

| File | Line | Leaked Data |
|------|------|-------------|
| `src/lib/redis/client.ts` | 67 | `REDIS_URL` (internal infra) |
| `src/stores/index.ts` | 98 | Full report object (`newReport`) |
| `src/stores/index.ts` | 280 | Heartbeat response data |
| `src/app/main/map/page.tsx` | 245 | Map coordinates |

---

### H4: Missing Zod Schema Validation
**Files:** `src/app/api/routes/optimize/route.ts`

No Zod validation on `RouteOptimizationInput`:
- `start_lat`, `start_lng` — no range checking
- `dest_lat`, `dest_lng` — accepted but never validated
- `fuel_needed_liters` — no type/range check

**Fix required:** Add Zod schema validation for all API inputs.

---

### H5: `dest_lat` and `dest_lng` Accepted But Never Used
**File:** `src/app/api/routes/optimize/route.ts:19`

The route optimization accepts `dest_lat` and `dest_lng` from the request body but **never actually uses them** in the route calculation. This suggests incomplete functionality.

---

## 🟡 MEDIUM Issues

### M1: `console.log` URL Leaks in Non-Production
**File:** `src/lib/redis/client.ts:67`

```ts
console.log('[Redis] Connected to local Redis at', process.env.REDIS_URL);
```

Exposes internal Redis URL (could contain credentials if `REDIS_URL` includes auth).

---

### M2: `NEXT_PUBLIC_GEMINI_MODEL` Is Exposed to Client
**File:** Multiple

This is safe — it's just a model name string, not a secret. ✅

---

### M3: No Middleware for Route Protection
There is **no `middleware.ts`** in the project. Protected routes (`/main/*`) rely solely on client-side checks and API route `getUser()` calls. A `middleware.ts` should enforce auth at the edge for better security and UX.

---

### M4: No Auth on Ration Logs Insert
The ration logs INSERT policy (`001_initial_schema.sql:110`) allows any authenticated user to insert logs for themselves. While this is RLS-protected, there is **no server-side enforcement** in `api/ration/route.ts` — only a GET endpoint exists. If an INSERT endpoint is added later, it must enforce the vehicle type limit.

---

## ✅ Things That Are Good

1. **`/api/ration` GET has proper auth** — `supabase.auth.getUser()` is called ✅
2. **RLS is enabled** on all major tables ✅
3. **`server-only` import** is used in server files ✅
4. **OTP validation** happens server-side via Supabase ✅
5. **NEXT_PUBLIC vars** are appropriate (no server secrets exposed) ✅
6. **Supabase anon key** is correctly scoped ✅
7. **Firebase vars** are all `NEXT_PUBLIC_` (correct for client-side Firebase) ✅

---

## Recommended Fix Priority

| Priority | Issue | Status |
|----------|-------|--------|
| P0 | C1: GEMINI_API_KEY throw at load | ⚠️ Verify lazy init in `lib/gemini/client.ts` |
| P0 | C2: /api/chat no auth | ✅ RESOLVED — auth + rate limit added |
| P0 | C3: /api/routes/optimize no auth | ✅ RESOLVED — auth + rate limit added |
| P1 | H1: Rate limiter not wired | ✅ RESOLVED — awaited and called in all 3 AI routes |
| P1 | H2: Bad RLS policy | ⚠️ Fix in `supabase/migrations/001_initial_schema.sql` |
| P1 | H3: Console.log leaks | ⚠️ Reduce sensitive logs in Redis + stores |
| P1 | H4: No Zod validation | ⚠️ Add Zod schemas to route optimization inputs |
| P2 | H5: dest_lat/lng unused | ⚠️ Remove dead parameters or implement destination routing |
| P2 | M1: Redis URL log | ⚠️ Remove URL from log |
| P2 | M3: No middleware | ⚠️ Add `middleware.ts` for edge-level auth on `/main/*` |
