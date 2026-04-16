# Fuel Rush Security Audit Report

**Auditor:** Mr. Code Auditor  
**Date:** 2026-03-26  
**Repo:** `adnanizaman-star/fuel-Rush`  
**Stack:** Next.js 14 (App Router) · Supabase · Upstash Redis · Google Maps · Gemini AI

---

## Executive Summary

This is a **Pre-Production Audit** — the codebase is early-stage with significant security gaps across authentication, authorization, input validation, and dependency management. Several issues are severe enough that they must be addressed before any public deployment. Given this app handles real-world fuel scarcity data for Bangladesh, inaccurate or manipulable data can directly harm users.

**Overall Risk Posture: HIGH** 🔴  
**Recommendation: Do not deploy until all Critical and High issues are resolved.**

---

## Critical Issues (Fix Immediately)

### C1 — Next.js 14.2.21 Has Multiple High-Severity Vulnerabilities
**File:** `package.json`  
**Line:** 14  
**Issue:** Next.js version `14.2.21` is installed, which has **4 known high-severity CVEs**:
- `GHSA-9g9p-9gw9-jx7f` — DoS via Image Optimizer remotePatterns
- `GHSA-h25m-26qc-wcjf` — HTTP request deserialization leading to DoS
- `GHSA-ggv3-7p47-pfv8` — HTTP request smuggling in rewrites
- `GHSA-3x4c-7xq6-9pq8` — Unbounded next/image disk cache growth exhausting storage

**Risk:** Remote code execution, denial of service, cache poisoning.

**Fix:** Upgrade to Next.js 16.2.1 (`npm install next@latest`). Note this is a **breaking change** — test all pages and API routes thoroughly after upgrade. Specifically test:
- Server Actions (used for report submissions)
- Image optimization (`<Image>` components)
- API rewrites (if any)
- Dynamic routes with `generateStaticParams`

---

### C2 — Authentication Flow Is Completely Fake/Mock
**File:** `src/app/(auth)/login/page.tsx`  
**Line:** 43  
**Issue:** Login page does NOT call Supabase auth. It hard-codes:
```tsx
if (otp === '123456') {
  router.push('/map');
}
```
The same pattern exists in `register/page.tsx` line 54. The login/register flow is entirely mock code — no Supabase OTP is sent or verified. Any user can enter any phone number and OTP `123456` to "authenticate."

**Risk:** Complete authentication bypass. Anyone can access any user's account and modify their vehicle data, fuel ration logs, and reports. This is an **authorization bypass at the highest level**.

**Fix:** Replace the mock OTP logic with real Supabase Auth OTP verification:
```tsx
// Use @supabase/ssr for proper SSR-compatible auth
const { data, error } = await supabase.auth.verifyOtp({
  phone: phone,
  token: otp,
  type: 'sms'
});
if (error) throw error;
// Then sign in
const { data: { user } } = await supabase.auth.getUser();
```
Remove the hardcoded `123456` check entirely.

---

## High Issues (Fix Before Launch)

### H1 — No Rate Limiting on Authentication Endpoints
**File:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`  
**Lines:** 22, 29, 53, 60  
**Issue:** Both login and register pages perform OTP sending and verification without any rate limiting. No attempt tracking, no CAPTCHA, no throttling.

**Risk:** OTP enumeration/brute-force (though currently moot due to C2), SMS flooding attacks (if real auth is added), resource exhaustion.

**Fix:** 
1. Add rate limiting using `@upstash/ratelimit` (already in dependencies) for OTP send:
```tsx
const otpRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'),
  prefix: 'ratelimit:otp',
});
```
2. Add attempt tracking: lock after 5 failed OTP attempts for 15 minutes.
3. Consider adding a CAPTCHA before OTP send.

---

### H2 — RLS Policy Allows Any Authenticated User to Modify Any Station
**File:** `supabase/migrations/001_initial_schema.sql`  
**Lines:** 73-74  
**Issue:** The `stations` UPDATE policy reads:
```sql
CREATE POLICY "Authenticated users can update stations" ON public.stations
  FOR UPDATE USING (auth.uid() IS NOT NULL);
```
This allows ANY authenticated user to update the status/location of ANY fuel station — not just ones they've reported on.

**Risk:** Malicious users can spam-change station statuses (e.g., mark all stations as `empty`), causing panic and disrupting real fuel-seeking behavior. While the API layer adds some protection, RLS is the last line of defense.

**Fix:** Restrict updates to stations the user has recently reported, or require a minimum trust score:
```sql
CREATE POLICY "Users can update stations they reported in last 24h" ON public.stations
  FOR UPDATE USING (
    auth.uid() IS NOT NULL 
    AND last_reporter_id = auth.uid()
    AND last_reported_at > NOW() - INTERVAL '24 hours'
  );
```

---

### H3 — `amount_liters` Has No Upper Bound Validation
**File:** `src/app/api/ration/log/route.ts`  
**Line:** 19  
**Issue:** While the DB schema has `CHECK (amount_liters > 0)`, the API does not validate an upper bound on `amount_liters`. A user could log an astronomically large value (e.g., 10,000 liters) in a single call, which:
1. Would bypass client-side ration gauges
2. Could cause numeric overflow or incorrect ration calculations in edge cases

**Risk:** Ration limit bypass, data integrity issues.

**Fix:** Add validation in the API route:
```tsx
if (amount_liters < 0.1 || amount_liters > 100) {
  return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
}
```
Also add `CHECK (amount_liters <= 100)` to the DB schema.

---

### H4 — `wait_minutes` Not Validated for Negative Values
**File:** `src/app/api/stations/[id]/report/route.ts`  
**Line:** 32  
**Issue:** `wait_minutes` is accepted from the request body but only checked for truthiness (if provided). A negative value would pass:
```tsx
const { status, wait_minutes, photo_url } = body;
// ...
wait_minutes: wait_minutes || null, // negative values pass this check
```
**Risk:** While the DB has `CHECK (wait_minutes >= 0 AND wait_minutes <= 300)`, sending a negative value will cause a DB error that leaks implementation details in the response.

**Fix:** Validate before constructing the insert:
```tsx
if (wait_minutes !== undefined && (wait_minutes < 0 || wait_minutes > 300)) {
  return NextResponse.json({ error: 'Invalid wait time' }, { status: 400 });
}
```

---

### H5 — Station Coordinate Input Not Validated
**File:** `src/app/api/stations/route.ts`  
**Lines:** 10-11  
**Issue:** `lat` and `lng` are parsed with `parseFloat()` but never range-checked:
```tsx
const userLat = parseFloat(lat);
const userLng = parseFloat(lng);
// No NaN/Infinity check, no range check (-90 to 90, -180 to 180)
```
Invalid values (NaN, Infinity, out-of-range) would propagate to `calcDistance()` and produce incorrect results.

**Risk:** Incorrect distance calculations, potential NaN propagation, broken station filtering.

**Fix:**
```tsx
if (isNaN(userLat) || isNaN(userLng) || 
    userLat < -90 || userLat > 90 || 
    userLng < -180 || userLng > 180) {
  return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
}
```

---

### H6 — `photo_url` Not Validated as URL
**File:** `src/app/api/stations/[id]/report/route.ts`  
**Line:** 33  
**Issue:** `photo_url` from the body is not validated as a proper URL. The DB schema has no URL constraint (`TEXT`), and the frontend's `type="url"` is trivially bypassed with curl.

**Risk:** Malformed URLs stored, potential for future XSS if URLs are ever rendered without sanitization, broken image links.

**Fix:**
```tsx
if (photo_url !== undefined && photo_url !== null) {
  try {
    new URL(photo_url); // validates URL format
    if (!photo_url.startsWith('https://')) {
      return NextResponse.json({ error: 'Photo URL must use HTTPS' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 });
  }
}
```

---

## Medium Issues (Fix Soon)

### M1 — No CORS Configuration
**File:** `next.config.mjs`  
**Issue:** No explicit CORS headers are configured. While Next.js defaults to same-origin, for an API intended for cross-origin mobile apps, CORS should be explicitly configured.

**Fix:** Add CORS configuration:
```js
// In next.config.mjs - add headers for API routes
// Or use next-safe-api middleware
```

---

### M2 — Unused Server-Side Supabase Client Function
**File:** `src/lib/supabase/server.ts`  
**Lines:** 35-54  
**Issue:** `createServiceClient()` is defined but never used anywhere in the codebase. It uses the `SUPABASE_SERVICE_ROLE_KEY` which should be treated as highly sensitive.

**Risk:** Dead code that exposes the service role key pattern. If ever accidentally used incorrectly, it could grant admin privileges client-side.

**Fix:** Remove `createServiceClient()` entirely. If service role is needed in the future, use it only in server-side Route Handlers with proper request validation.

---

### M3 — Experimental Next.js Server Actions with Hardcoded Localhost Origin
**File:** `next.config.mjs`  
**Lines:** 14-16  
**Issue:**
```js
experimental: {
  serverActions: {
    allowedOrigins: ['localhost:3000'],
  },
},
```
`allowedOrigins` restricts server actions to localhost only. This is correct for development but means **server actions will be completely disabled** when deployed to production domains. Any server action (form submissions, etc.) will fail.

**Risk:** Silent failure of critical functionality in production.

**Fix:** Either remove `allowedOrigins` (to allow all origins) or explicitly add your production domain:
```js
allowedOrigins: ['fuelrush.app', 'www.fuelrush.app'],
```

---

### M4 — OTP Timing-Safe Comparison Missing
**File:** `src/app/(auth)/login/page.tsx`  
**Line:** 43  
**Issue:** OTP verification uses direct string comparison:
```tsx
if (otp === '123456')
```
This is vulnerable to timing attacks — an attacker could measure response times to determine if the first digit is correct, then the second, etc.

**Risk:** Low currently (mock code), but if real OTP verification is added without fixing this pattern, it becomes high.

**Fix:** Use `crypto.timingSafeEqual()` or `===` with constant-time consideration. In the real flow, Supabase handles this — but the pattern should not be `otp === expected`.

---

### M5 — Trust Score Has No Validation on Update
**File:** `supabase/migrations/001_initial_schema.sql`  
**Line:** 13  
**Issue:** The `users.trust_score` column has a `CHECK (trust_score >= 0 AND trust_score <= 100)` in the DB, but there's no API endpoint to update trust scores. However, if one is added later, it should validate bounds server-side.

**Risk:** Future API addition could skip validation, relying solely on DB constraints (not defense in depth).

**Fix:** When trust score update logic is added, validate in API layer:
```tsx
const newScore = body.trust_score;
if (typeof newScore !== 'number' || newScore < 0 || newScore > 100) {
  return NextResponse.json({ error: 'Invalid trust score' }, { status: 400 });
}
```

---

### M6 — No Audit Logging for Sensitive Operations
**File:** All API routes  
**Issue:** There is no structured audit trail for:
- Report submissions (`POST /api/stations/[id]/report`)
- Ration logs (`POST /api/ration/log`)
- Vehicle additions (`POST /api/vehicles`)

**Risk:** No accountability for false reports, no forensic capability for investigating abuse, no way to track trust score changes.

**Fix:** Add audit log inserts for each sensitive operation:
```tsx
await supabase.from('audit_logs').insert({
  action: 'report_submit',
  user_id: user.id,
  resource_id: stationId,
  metadata: { status, confidence },
  ip_address: request.headers.get('x-forwarded-for'),
});
```

---

## Low Issues (Nice to Have)

### L1 — No Content Security Policy Headers
**Issue:** No CSP headers are configured in `next.config.mjs` or via a custom `_middleware`.

**Risk:** XSS attacks have fewer restrictions.

**Fix:** Add CSP headers in `next.config.mjs`:
```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; ..."
    }]
  }];
}
```

---

### L2 — No Request ID / Correlation ID
**Issue:** No correlation IDs on API requests for tracing.

**Fix:** Add a middleware that generates/propagates request IDs:
```tsx
const requestId = crypto.randomUUID();
response.headers.set('X-Request-ID', requestId);
```

---

### L3 — Dead Profile Menu Items with `href="#"`
**File:** `src/app/(main)/profile/page.tsx`  
**Lines:** 18-21  
**Issue:** All menu items have `href="#"` — they look interactive but do nothing. Accessibility issue.

**Fix:** Either implement these pages or use `<button>` elements styled as cards.

---

### L4 — Station Status Confidence Not Recalculated on Conflicting Reports
**File:** `src/app/api/stations/[id]/report/route.ts`  
**Issue:** When a new report is submitted, the station's `confidence` is set to the single report's score. If a `available` report and an `empty` report are submitted within minutes of each other, the second overwrites the first with its own confidence.

**Risk:** Station status can flip-flop based on report order, creating unstable/conflicting information.

**Fix:** Implement corroboration logic — check for recent conflicting reports within a time window and use average or weighted confidence.

---

### L5 — API Error Messages Leak Implementation Details
**File:** Multiple API routes  
**Issue:** While error responses generally return generic messages, some DB errors (e.g., CHECK constraint violations for `wait_minutes`) could leak that a CHECK constraint exists and its bounds.

**Fix:** Ensure all `insertError` / `updateError` catch blocks return a generic message without propagating the specific DB error.

---

### L6 — No Request Body Size Limit
**Issue:** No explicit body size limits on API routes. Large bodies could cause memory issues.

**Fix:** Add body parsing limits:
```tsx
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

---

## Dependency Audit

### ✅ No Suspicious Packages Found
All packages in `package.json` are from known, reputable sources (Google, Supabase, Upstash, Next.js, etc.). No typosquatting or suspicious packages detected.

### ⚠️ Outdated Packages
| Package | Current | Latest | Risk |
|---------|---------|--------|------|
| `next` | 14.2.21 | 16.2.1 | **HIGH** — Multiple CVEs |
| `@supabase/ssr` | ^0.5.1 | ^0.6.x | Low |
| `zustand` | ^5.0.2 | ^5.0.x | Low |
| `typescript` | ^5.7.2 | ^5.8.x | Low |

**Recommendation:** Update all packages before launch. The Next.js upgrade should be prioritized immediately due to CVEs.

---

## Secrets Audit

### ✅ No Hardcoded Secrets Found
All secrets are accessed via `process.env` in server-side code only:
- `GEMINI_API_KEY` — used server-side only in `src/lib/gemini/client.ts`
- `SUPABASE_SERVICE_ROLE_KEY` — used in `src/lib/supabase/server.ts` (but that function is unused — see M2)
- `UPSTASH_REDIS_REST_TOKEN` — used server-side only in `src/lib/redis/client.ts`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — used client-side (acceptable for public key)

### ✅ `.env.example` Properly Configured
All env vars have placeholder values in `.env.example`. No real credentials committed.

### ✅ `.gitignore` Properly Configured
`.env`, `.env.local`, `.env.production.local` are all gitignored. `node_modules/` is ignored.

---

## Code Quality Notes (Non-Security)

1. **`src/lib/gemini/client.ts`** — The Gemini AI integration is well-structured with fallback behavior. However, the `summarizeReport()` function silently swallows all errors (line 136: `catch { return { suspicious: false } }`), which could allow clearly fraudulent reports through.

2. **Mock data** (`src/lib/mock-data.ts`) — The mock data uses real Dhaka coordinates, which is good for realistic testing. However, mock OTPs (`123456`) should be clearly gated behind a `NEXT_PUBLIC_IS_DEMO` flag.

3. **Unused imports** — Some components may import unused utilities. Run `npm run lint` to identify.

4. **No test coverage** — No test files found. Before launch, add unit tests for:
   - `calcConfidence()` function
   - `calcDistance()` function  
   - Ration limit calculations
   - API route authorization checks

---

## Summary Table

| ID | Severity | Category | File(s) | Fix Effort |
|----|----------|----------|---------|------------|
| C1 | 🔴 CRITICAL | Dependency | `package.json` | Medium |
| C2 | 🔴 CRITICAL | Auth Bypass | `login/page.tsx`, `register/page.tsx` | Low |
| H1 | 🟠 HIGH | Rate Limiting | `login/page.tsx`, `register/page.tsx` | Low |
| H2 | 🟠 HIGH | Authorization | `001_initial_schema.sql` | Medium |
| H3 | 🟠 HIGH | Input Validation | `ration/log/route.ts` | Low |
| H4 | 🟠 HIGH | Input Validation | `report/route.ts` | Low |
| H5 | 🟠 HIGH | Input Validation | `stations/route.ts` | Low |
| H6 | 🟠 HIGH | Input Validation | `report/route.ts` | Low |
| M1 | 🟡 MEDIUM | CORS | `next.config.mjs` | Low |
| M2 | 🟡 MEDIUM | Dead Code | `supabase/server.ts` | Trivial |
| M3 | 🟡 MEDIUM | Config | `next.config.mjs` | Low |
| M4 | 🟡 MEDIUM | Crypto | `login/page.tsx` | Low |
| M5 | 🟡 MEDIUM | Input Validation | DB schema | Low (future) |
| M6 | 🟡 MEDIUM | Audit | All API routes | Medium |
| L1 | ⚪ LOW | CSP | `next.config.mjs` | Medium |
| L2 | ⚪ LOW | Observability | API routes | Low |
| L3 | ⚪ LOW | Accessibility | `profile/page.tsx` | Trivial |
| L4 | ⚪ LOW | Logic | `report/route.ts` | Medium |
| L5 | ⚪ LOW | Error Handling | API routes | Low |
| L6 | ⚪ LOW | Config | API routes | Low |

---

## Fix Priority

1. **Immediately (Before Any Testing):** C1 (Next.js upgrade), C2 (Real auth integration)
2. **Before Launch:** H1–H6, M1–M6
3. **Soon:** L1–L6

---

*Report generated by Mr. Code Auditor — Fuel Rush Security Audit*
