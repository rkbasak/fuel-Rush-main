# ⛽ Fuel Rush

**Bangladesh's AI-Powered Fuel Intelligence Platform**

Real-time fuel intelligence that transforms Bangladesh's chaotic fuel landscape into a transparent, community-driven map. Fuel Rush helps drivers and riders find available fuel stations, avoid false queues, and track their daily ration — powered by community reports and AI verification.

---

## ✨ Features

- 🗺️ **Live Fuel Map** — Real-time station status with 5-color indicators (🟢 Available, 🟡 Low Stock, 🟠 Long Queue, 🔴 Empty, ⚫ Unknown)
- 🔮 **AI Confidence Engine** — Community reports with confidence scoring that decays over time, requiring re-confirmation
- 📊 **Personal Ration Tracker** — Vehicle-specific daily limits with midnight auto-reset (Motorcycle: 2L/day, Sedan: 10L/day, SUV: 20L/day)
- 🧭 **Smart Route Planner** — AI-optimized multi-station routing that avoids already-visited stations
- 💬 **AI Chat Assistant** — Ask about nearby fuel, best times, and station recommendations
- 🔔 **Push Notifications** — Firebase FCM proximity alerts when nearby stations get fuel
- 📱 **Android App** — Native APK built with Capacitor, offline-capable
- 🎨 **PWA** — Add to home screen on any device for a native-like experience
- 🛡️ **Admin Command Center** — Full admin panel for station management, moderation queue, user directory, and SaaS config

---

## 🚀 Quick Start

```bash
# Clone the repository
gh repo clone adnanizaman-star/fuel-Rush
cd fuel-Rush

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your API keys (see Environment Variables section below)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.
The Admin Panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## 🐳 Self-Hosting

Fuel Rush can be self-hosted on your own server (AMD64 or ARM64).

See [SELF_HOST.md](./SELF_HOST.md) for:
- **Docker** (recommended): Multi-arch images for AMD64 and ARM64 — one command to deploy
- **Bare Metal**: Node.js + nginx/Caddy on any Linux server
- **BTpanel (VPS)**: Budget VPS deployment guide
- Tested on Raspberry Pi 4, AWS Graviton, and more

Quick Docker start:
```bash
cp .env.example .env
docker compose up -d
# Visit http://localhost:8080
```

Docker images are auto-built on every push to `main`:
```bash
docker pull ghcr.io/adnanizaman-star/fuel-rush:latest
```

---

## 📱 Android Build

```bash
# Add Android platform (first time only)
npx cap add android

# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build APK directly
cd android && ./gradlew assembleDebug
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

### Download Pre-built APK

1. Go to **Actions** tab → "Build Android APK" workflow
2. Click the latest successful run
3. Download the `fuel-rush-apk-XXXXXXXXX` artifact
4. Transfer to your Android device and install

> Enable "Install from unknown sources" in Android settings if prompted.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| AI Brain | Google Gemini 2.0 Flash (primary) + multi-model fallback chain |
| AI Fallbacks | OpenAI GPT-4o-mini → Groq LLaMA → Anthropic Claude |
| Cache | Upstash Redis (REST) |
| Maps | Google Maps API (dark theme) + OpenStreetMap (station discovery) |
| Auth | Supabase Auth (Phone OTP for Bangladesh) |
| Notifications | Firebase Cloud Messaging (FCM) |
| Mobile | Capacitor.js (Android) |
| Design | Fuel Crisis dark UI — deep dark panels, high-contrast, premium SaaS aesthetic |
| Deployment | Vercel (recommended) or self-host via Docker |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
GEMINI_API_KEY=your-gemini-key

# Redis (pick one)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
# OR: REDIS_URL=redis://localhost:6379

# Optional — AI fallback chain (auto-activates when Gemini is rate-limited)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=

# Optional — Firebase push notifications
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Where to get API Keys

| Service | URL |
|---------|-----|
| Supabase | [supabase.com](https://supabase.com) → Settings → API |
| Google Maps | [console.cloud.google.com](https://console.cloud.google.com) → enable Maps JavaScript API + Places API |
| Upstash Redis | [upstash.com](https://upstash.com) → Redis → REST URL & Token |
| Gemini | [aistudio.google.com](https://aistudio.google.com) → API Key |
| Firebase | [console.firebase.google.com](https://console.firebase.google.com) → Project Settings |
| OpenRouter | [openrouter.ai](https://openrouter.ai) → Keys (optional fallback) |

---

## 📁 Project Structure

```
fuel-Rush/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── auth/              # Login / Register (Phone OTP)
│   │   ├── main/              # Main user-facing pages
│   │   │   ├── map/           # Live full-screen fuel map
│   │   │   ├── stations/      # Searchable station list
│   │   │   ├── ration/        # Personal ration tracker
│   │   │   ├── route/         # AI route planner
│   │   │   ├── notifications/ # Notification center
│   │   │   └── profile/       # User profile + trust score
│   │   ├── admin/             # Admin Command Center
│   │   │   ├── page.tsx       # Dashboard overview & metrics
│   │   │   ├── stations/      # Station manager (add, AI discover, CSV import)
│   │   │   ├── reports/       # Moderation queue
│   │   │   ├── users/         # User directory + trust management
│   │   │   ├── settings/      # SaaS config (API keys, AI provider)
│   │   │   └── layout.tsx     # Admin shell (sidebar + topbar)
│   │   ├── api/               # API routes (server-side)
│   │   └── globals.css        # Design tokens + Tailwind
│   ├── components/
│   │   ├── ui/                # Button, Card, Badge, Input, BottomSheet, TabBar, Header
│   │   ├── admin/             # DiscoveryModal, StationForm, CsvUploadModal
│   │   ├── map/               # MapView (Google Maps dark theme)
│   │   ├── stations/          # StationCard, StationList, ReportForm
│   │   ├── ration/            # RationGauge
│   │   ├── route/             # RouteCard
│   │   └── chat/              # ChatAssistant + suggestion chips
│   ├── lib/
│   │   ├── supabase/          # Client + server Supabase clients
│   │   ├── redis/             # Upstash + local Redis + rate limiters
│   │   ├── ai/                # Multi-model AI router, providers, fraud detection, confidence engine
│   │   ├── services/          # SaaS config service (site settings via Supabase)
│   │   ├── firebase/          # Firebase FCM client
│   │   └── maps/              # Google Maps utilities
│   ├── stores/                # Zustand (stations, ration, auth, heartbeat, notifications, predictions)
│   ├── types/                 # TypeScript types (Station, Report, Route, Ration, etc.)
│   └── utils/                 # Helpers
├── supabase/migrations/        # SQL migrations (001 → 004)
├── scripts/                   # Seed data scripts
├── android/                   # Capacitor Android project
├── ux-design/                 # Full UX design specification
├── Dockerfile                 # Multi-arch Docker build
├── docker-compose.yml         # Self-hosting stack
└── SELF_HOST.md               # Self-hosting guide
```

---

## 🗺️ Architecture

**Smart Cache Router:**
```
Request → Redis (cache hit?) → Return immediately
              ↓ miss
         Supabase DB → Return + cache result
              ↓ no data
         Gemini AI → Store in DB + cache → Return
```

**AI Fallback Chain:**
```
Gemini 2.0 Flash → Gemini 1.5 Flash → Groq LLaMA → Mixtral → GPT-4o-mini → GPT-4o → Claude
(Auto-switches on rate limit — transparent to the user)
```

**Confidence Decay Engine:**
| Status | Trigger | Confidence |
|--------|---------|------------|
| 🟢 High | 3+ users confirmed | 90–100% |
| 🟡 Medium | 1 user reported | 50–70% |
| 🟠 Decaying | 30+ min no reconfirm | 30–50% |
| 🔴 Disputed | Contradicting reports | 0–20% |
| ⚫ Expired | 2+ hours no update | 0% |

**Fraud Detection:** Flags contradictory reports, remote reporting (>10km), rapid-fire (<2min apart), impossible frequency (>20/day).

---

## 🛡️ Admin Panel

Access the admin panel at `/admin`. Features:

| Page | Purpose |
|------|---------|
| **Overview** | Live platform metrics, report volume, confidence distribution |
| **Stations** | Add/edit stations manually, bulk CSV import, AI-powered station discovery (Google Places + OSM) |
| **Moderation Queue** | Review & verify/reject community reports |
| **User Directory** | Search users, view trust scores, manage roles |
| **SaaS Config** | API key management, AI provider selection, ration reset controls |

> **Note:** Admin auth is currently a development passthrough. Enforce role-based access before production using Supabase RLS.

---

## 📦 Hosting Options

| Platform | Best For | Guide |
|----------|----------|-------|
| **Vercel** (recommended) | Production web app, serverless API | [DEPLOY.md](./DEPLOY.md) |
| **Self-hosted (Docker)** | Full control, on-premise | [SELF_HOST.md](./SELF_HOST.md) |
| **BTpanel (VPS)** | Budget VPS, China/Bangladesh users | [BTPANEL.md](./BTPANEL.md) |

---

## 🤝 Beta Testing

See [BETA_TEST.md](./BETA_TEST.md) to join the beta program and test in Bangladesh.

---

## 📖 Documentation

| Doc | What it covers |
|-----|----------------|
| [SPEC.md](./SPEC.md) | Full technical specification |
| [ux-design/UX_DESIGN.md](./ux-design/UX_DESIGN.md) | Design system, colors, components, wireframes |
| [DEPLOY.md](./DEPLOY.md) | Vercel + Supabase + Upstash deployment |
| [SELF_HOST.md](./SELF_HOST.md) | Self-hosting on your own server |
| [BETA_TEST.md](./BETA_TEST.md) | Beta testing guide |
| [PLAY_STORE_PREP.md](./PLAY_STORE_PREP.md) | Android release to Play Store |
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) | Security findings + fixes |
| [SECURITY_AUDIT_V2.md](./SECURITY_AUDIT_V2.md) | Security audit v2 — rate limiting, RLS, auth gaps |
| [BTPANEL.md](./BTPANEL.md) | BTpanel/VPS deployment guide |

---

## 📄 License

MIT. Built with ❤️ for Bangladesh.
