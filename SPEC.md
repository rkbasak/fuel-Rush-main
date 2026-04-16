# SPEC.md — Fuel Rush

> Bangladesh's AI-Powered Fuel Intelligence Platform

---

## 1. Concept & Vision

**Fuel Rush** is a real-time fuel intelligence platform that transforms Bangladesh's chaotic fuel landscape into a transparent, community-driven map. It feels like a live radar for scarcity — urgent but trustworthy, crowdsourced but AI-verified. The app embodies the anxiety of a fuel queue and the relief of a confirmed lead, wrapped in a modern, minimal interface that works even on low-end Android devices on 3G.

The core emotional promise: *never wait in a false queue again.*

---

## 2. Design Language

### Aesthetic Direction
"Mission control meets mobile-first Bangladesh" — think a Bloomberg terminal crossed with a rideshare app. Dark-mode-first with high-contrast data visualization. Bold status colors cut through visual noise.

### Color Palette
| Role | Hex | Usage |
|---|---|---|
| Background | `#0A0A0A` | App background, deep dark base |
| Surface | `#111116` | Cards, panels, admin dark panels |
| Surface Elevated | `#1A1A22` | Modals, dropdowns |
| Primary | `#FF6B35` | CTAs, links, selected states (fuel orange) |
| Accent | `#10B981` | Success, verified, green status |
| Warning | `#F59E0B` | Yellow status, medium confidence |
| Danger | `#EF4444` | Red status, errors |
| Muted | `#6B7280` | Disabled, secondary text |
| Text Primary | `#F9FAFB` | Headings, primary content |
| Text Secondary | `#9CA3AF` | Body text, labels |
| Border | `rgba(255,255,255,0.05)` | Dividers, card borders |

### Station Status Colors
| Status | Color | Meaning |
|---|---|---|
| 🟢 Available | `#22C55E` | Fuel confirmed available |
| 🟡 Low Stock | `#EAB308` | Fuel may run out soon |
| 🟠 Long Queue | `#F97316` | Available but >30min wait |
| 🔴 Empty | `#EF4444` | Confirmed empty |
| ⚫ Unknown | `#6B7280` | No recent data |

### Typography
- **Primary Font:** `Inter` (Google Fonts) — clean, highly legible on low-res screens
- **Mono Font:** `JetBrains Mono` — for confidence scores, fuel amounts, timestamps
- **Fallbacks:** `-apple-system, BlinkMacSystemFont, sans-serif`
- **Scale:** 12/14/16/18/24/32/48px with tight line-heights

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Card radius: 12px
- Button radius: 8px
- Max content width: 480px (mobile-first)

### Motion Philosophy
- Transitions: 150ms ease-out for micro-interactions
- Page transitions: 200ms slide-up on mobile
- Map markers: pulse animation for live 🟢 stations
- Skeleton loaders instead of spinners
- Confidence decay: smooth color fade over decay period

### Visual Assets
- Icons: Lucide React (consistent stroke width, MIT licensed)
- Map: Google Maps with custom dark-style JSON
- No stock photos — data IS the visual
- Custom SVG fuel drop icon for branding

---

## 3. Layout & Structure

### App Shell (Mobile-First)
```
┌─────────────────────────┐
│  Header (sticky)         │  ← Logo + Status bar + Avatar
├─────────────────────────┤
│                         │
│  Map View (60-70% h)    │  ← Primary interaction surface
│                         │
├─────────────────────────┤
│  Bottom Sheet           │  ← Station list / Route planner / Report
├─────────────────────────┤
│  Tab Bar (fixed)        │  ← Map | Stations | Ration | Route | Profile
└─────────────────────────┘
```

### Pages
1. **Map (Home)** — Full-screen map with station markers, floating filter chips
2. **Stations** — Scrollable list of nearby stations sorted by distance/status
3. **Ration Tracker** — Today's consumption, vehicle profiles, visit history
4. **Route Planner** — AI-optimized multi-stop fuel run
5. **Report** — Submit fuel status for a station
6. **Profile** — Auth, vehicle management, settings, notification prefs

### Responsive Strategy
- Mobile-first (375px base)
- Tablet: 768px+ — map + sidebar split view
- Desktop: 1024px+ — full dashboard with station list sidebar

---

## 4. Features & Interactions

### 4.1 Live Fuel Map
- Google Maps with dark theme
- Custom markers per station status (color + icon)
- Marker clustering at zoom < 14
- Tap marker → bottom sheet slides up with station details
- Long-press map → "Report fuel here" context action
- Filter chips: All | Available | Queue | Empty
- Pull-to-refresh station data

### 4.2 AI Confidence Engine
**Confidence Score (0–100):**
- Base: Report type (photo = +40, text = +20)
- User trust score: +0 to +30
- Recency: decays linearly over 2-minute heartbeat
- Cross-validation: each corroborating vote +10

**Decay Timer:**
- Confidence drops 1 point every 12 seconds (2 min = 120 pts)
- At 0, station falls back to ⚫ Unknown
- Users within 500m radius get pinged to re-report

**2-Minute Heartbeat:**
- Client polls Redis cache every 30 seconds
- Background job recalculates all active station confidences
- FCM push sent to nearby users if confidence crosses threshold

### 4.3 Personal Ration Tracker
**Vehicle Profiles:**
| Vehicle Type | Daily Limit | Per Station Max | Visits/Day |
|---|---|---|---|
| Motorcycle | 2L | 2L | 1 |
| Sedan ≤2000cc | 10L | 10L | Unlimited |
| SUV / Large Car | 20L | 20L | Unlimited |
| Commercial | BPC Rules | BPC Rules | Varies |

- Midnight (00:00 BST) auto-reset of daily counters
- Each fuel-up logged: station, amount, timestamp, odometer (optional)
- Alert when approaching daily limit (80% threshold)
- Block report submission if ration exceeded for that vehicle

**Visited Stations:**
- Red zone on map for stations already visited today
- Cannot claim fuel at same station twice in 24h (motorcycles)

### 4.4 Smart Route Planner
- Input: current location, target fuel amount, preferred stations
- Output: ordered multi-stop route minimizing total travel time
- Considers: real-time station status, queue estimates, distance
- Gemini API generates natural language reasoning for route choice
- Save route as "mission" for offline access

### 4.5 Station Report Flow
1. Tap station → bottom sheet → "Report Status"
2. Select: 🟢 Available | 🟡 Low | 🟠 Queue | 🔴 Empty
3. Optional: add photo (camera or gallery)
4. Optional: wait time estimate (for 🟠)
5. Submit → confidence calculated → broadcast to nearby users

### 4.6 Notifications
- Proximity alert: "Station X is 200m away and showing 🟢"
- Confidence decay alert: "Station X status expiring — confirm?"
- Ration limit warning: "You've used 8/10L today"
- Route update: "Station Y now showing 🔴 — rerouting"

---

## 5. Component Inventory

### StationCard
- States: default, expanded, visited, reported-by-me
- Shows: name, address, status badge, confidence score, last updated, distance
- Actions: Report, Navigate, Details

### StatusBadge
- 5 variants: available, low, queue, empty, unknown
- Pulsing animation for 🟢 Available

### ConfidenceMeter
- Horizontal bar 0–100%
- Color: green >70, yellow 40–70, red <40
- Shows decay countdown timer

### ReportForm
- Status selector (5 large tap targets)
- Photo uploader with preview
- Wait time slider (for queue status)
- Submit with loading state

### RationGauge
- Circular progress for daily limit
- Segmented bar for per-station remaining
- Color shifts as limit approaches

### RouteCard
- Step-by-step station list
- Total distance + ETA
- Expandable AI reasoning section

### VehicleProfileCard
- Vehicle type selector
- Plate number input
- Ration limits display
- Edit / Delete actions

---

## 6. Technical Approach

### Frontend Architecture
```
fuel-Rush/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── auth/               # Auth group: login, register (OTP)
│   │   ├── main/              # Main app pages
│   │   │   ├── map/           # Live full-screen fuel map
│   │   │   ├── stations/      # Station list
│   │   │   ├── ration/        # Ration tracker
│   │   │   ├── route/         # AI route planner
│   │   │   ├── notifications/ # Notification center
│   │   │   └── profile/       # User profile + trust score
│   │   ├── admin/             # Admin Command Center
│   │   │   ├── page.tsx       # Dashboard metrics
│   │   │   ├── stations/      # Station manager
│   │   │   ├── reports/       # Moderation queue
│   │   │   ├── users/         # User directory
│   │   │   ├── settings/      # SaaS config
│   │   │   └── layout.tsx     # Admin shell (sidebar + topbar)
│   │   ├── api/               # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Button, Input, Card, Badge, TabBar, BottomSheet
│   │   ├── admin/             # DiscoveryModal, StationForm, CsvUploadModal
│   │   ├── map/               # MapView, StationMarker, Cluster
│   │   ├── stations/          # StationCard, StationList, ReportForm
│   │   ├── ration/            # RationGauge
│   │   ├── route/             # RouteCard
│   │   └── chat/              # ChatAssistant + suggestion chips
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── supabase/          # Client + server Supabase clients
│   │   ├── redis/             # Upstash Redis + local Redis + rate limiters
│   │   ├── ai/                # Multi-model router, providers, fraud detection, confidence engine
│   │   ├── services/          # SaaS config service (site settings)
│   │   ├── firebase/          # Firebase FCM client
│   │   └── maps/              # Google Maps utilities
│   ├── stores/                # Zustand (stations, ration, auth, heartbeat, notifications, predictions)
│   ├── types/                 # TypeScript types
│   └── utils/                 # Helpers
├── public/
│   └── icons/                 # PWA icons
├── supabase/
│   └── migrations/            # SQL migrations (001–004)
└── android/                   # Capacitor Android project
```

### Database Schema (Supabase / PostgreSQL)

**stations**
```sql
id uuid PK
name text
address text
lat float8
lng float8
status text CHECK (status IN ('available','low','queue','empty','unknown'))
confidence int DEFAULT 0
last_reported_at timestamptz
last_reporter_id uuid FK
created_at timestamptz
updated_at timestamptz
```

**reports**
```sql
id uuid PK
station_id uuid FK
user_id uuid FK
status text CHECK (status IN ('available','low','queue','empty'))
photo_url text
wait_minutes int
confidence_score int
created_at timestamptz
```

**users**
```sql
id uuid PK (matches auth.users)
display_name text
trust_score int DEFAULT 50
created_at timestamptz
```

**vehicles**
```sql
id uuid PK
user_id uuid FK
type text CHECK (type IN ('motorcycle','sedan','suv','commercial'))
plate_number text
nickname text
created_at timestamptz
```

**ration_logs**
```sql
id uuid PK
user_id uuid FK
vehicle_id uuid FK
station_id uuid FK
amount_liters float
logged_at timestamptz
```

### API Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/stations` | List stations with filters |
| GET | `/api/stations/[id]` | Station details + recent reports |
| POST | `/api/stations/[id]/report` | Submit a fuel report (auth + fraud check) |
| POST | `/api/stations/[id]/vote` | Upvote/downvote station confidence |
| GET | `/api/stations/[id]/predict` | AI confidence prediction for station |
| GET | `/api/stations/confirmed` | Get list of confirmed station IDs |
| GET | `/api/ration` | Current user's ration status |
| GET | `/api/ration/visited` | Visited station IDs for today |
| POST | `/api/routes/optimize` | AI route optimization (Gemini) |
| POST | `/api/chat` | AI chat assistant (NLQ over station data) |
| POST | `/api/heartbeat` | Trigger confidence recalculation |
| POST | `/api/admin/stations/discover` | AI station discovery (Google Places + OSM) |

### Caching Strategy (Upstash Redis)
- Station status cached: `station:{id}:status` → TTL 120s
- Confidence scores: `station:{id}:confidence` → TTL 120s
- Nearby stations geo-query: `stations:nearby:{lat}:{lng}` → TTL 60s
- Rate limit reports: `ratelimit:{user_id}:report` → 3/min max

### Authentication (Supabase Auth)
- Phone number + OTP (critical for Bangladesh market)
- Fallback: email + password
- JWT stored in httpOnly cookie
- Middleware protects all `/(main)` routes

### AI Integration (Gemini 1.5 Flash)
- Route optimization: natural language reasoning
- Report summarization: flag suspicious reports
- Queue time estimation: based on station history
- Prompt caching for repeated station context

---

## 7. Build Phases Detail

### Phase 1: Foundation ✅
- [x] SPEC.md authored
- [x] Next.js 14 + Tailwind initialized
- [x] Supabase schema + client
- [x] Google Maps integration (basic dark map)
- [x] Station data model + mock data
- [x] App shell: Header, TabBar, BottomSheet
- [x] Station list view with status badges
- [x] Basic station detail view

### Phase 2: Community Engine
- [x] Report submission form
- [x] Confidence scoring algorithm
- [x] 2-minute heartbeat system
- [x] Re-report / corroboration flow
- [x] Station status decay

### Phase 3: AI Layer
- [x] Gemini API client
- [x] Route optimization endpoint
- [x] Smart cache router (Upstash)
- [x] AI reasoning in route cards

### Phase 4: Rationing System
- [x] Vehicle profile CRUD
- [x] Daily limit enforcement
- [x] Midnight auto-reset (cron)
- [x] Visit history + red zone map
- [x] Ration gauge components

### Phase 5: Notifications
- [x] Firebase FCM setup
- [x] Proximity alert triggers
- [x] Confidence decay push
- [x] Ration limit warnings

### Phase 6: Android App
- [x] Capacitor integration
- [x] APK build pipeline
- [x] Native permissions (camera, location)
- [x] PWA manifest + icons

### Phase 7: Admin Command Center ✅
- [x] Admin layout (sidebar + topbar, responsive)
- [x] Dashboard overview with live metrics
- [x] Station manager (manual add, CSV bulk import, AI discovery via Google Places + OSM)
- [x] Moderation queue (verify/reject reports)
- [x] User directory (trust scores, roles)
- [x] SaaS config panel (API keys, AI provider, ration reset)
- [x] Settings migrated from user-facing pages to admin-only

### Phase 8: Code Quality & Security
- [x] Rate limiter wired to all public AI endpoints
- [x] Fraud detection on report submissions
- [x] Duplicate report/vote prevention
- [x] TypeScript type coverage improved
- [x] Static Tailwind class verification
- [x] Full codebase audit (14 bugs resolved)

---

*Last updated: 2026-03-29*
