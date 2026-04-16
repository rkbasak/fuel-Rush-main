# Fuel Rush — UX Design Specification
**Version:** 1.0.0  
**Brand:** Bangladesh's AI-Powered Fuel Intelligence Platform ⛽  
**Last Updated:** 2026-03-26

---

## 1. Brand Identity

| Element | Value |
|---|---|
| **Name** | Fuel Rush |
| **Tagline** | "Bangladesh's AI-Powered Fuel Intelligence Platform" |
| **Emoji** | ⛽ |
| **Vibe** | Urgent but trustworthy, community-powered, crisis-era practicality with modern intelligence |
| **Platform** | Mobile-first (iOS & Android) |

### Design Pillars
- ⚡ **Speed** — Every millisecond counts during a fuel crisis
- 🛡️ **Trust** — Reliability is life-or-death for drivers
- 🤝 **Community** — Crowdsourced data is our superpower
- 🧠 **AI Intelligence** — Smart routing, predictions, and natural language queries

---

## 2. Color Palette

### Fuel Crisis Theme

```css
:root {
  /* Primary */
  --color-primary:        #FF6B35;  /* Deep Orange — energy, urgency, fuel */
  --color-primary-light:  #FF8A5C;
  --color-primary-dark:   #E55A28;

  /* Secondary */
  --color-secondary:      #1A1A2E;  /* Dark Navy — trust, reliability, night mode */
  --color-secondary-light:#2A2A4E;
  --color-secondary-dark: #0A0A1E;

  /* Accent */
  --color-accent:         #00D4FF;  /* Electric Blue — AI, technology, freshness */
  --color-accent-light:   #33DDFF;
  --color-accent-dark:    #00A8CC;

  /* Status Colors */
  --color-success:        #00E676;  /* Bright Green — fuel available */
  --color-warning:        #FFB300;  /* Amber — medium supply */
  --color-danger:         #FF1744;  /* Red — low / out of fuel */
  --color-neutral:        #A0A0A0;  /* Muted grey — unknown / offline */

  /* Backgrounds */
  --bg-base:              #0D0D0D;  /* Near-black default (dark mode) */
  --bg-surface:           #1E1E2E;  /* Card / surface */
  --bg-elevated:          #2A2A3E;  /* Modals, bottom sheets */
  --bg-overlay:           rgba(0,0,0,0.7);

  /* Text */
  --text-primary:         #FFFFFF;
  --text-secondary:       #A0A0A0;
  --text-muted:           #666677;
  --text-inverse:         #0D0D0D;

  /* Borders */
  --border-default:       #2E2E3E;
  --border-focus:         #00D4FF;

  /* Shadows */
  --shadow-sm:            0 2px 8px rgba(0,0,0,0.4);
  --shadow-md:            0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg:            0 8px 32px rgba(0,0,0,0.6);
  --shadow-glow-orange:   0 0 20px rgba(255,107,53,0.4);
  --shadow-glow-blue:     0 0 20px rgba(0,212,255,0.4);
}
```

### Fuel Status Color Mapping

| Status | Color | Hex | Usage |
|---|---|---|---|
| **Available** | Bright Green | `#00E676` | Station has fuel |
| **Medium** | Amber | `#FFB300` | Limited supply |
| **Low** | Red | `#FF1744` | Almost out |
| **Unknown/Offline** | Muted Grey | `#A0A0A0` | No recent data |

---

## 3. Typography

### Google Fonts

```html
<!-- Primary: Inter — clean, modern, highly legible on mobile -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- Display/Headers: Poppins — bold, energetic -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<!-- Monospace for data: JetBrains Mono -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

```css
:root {
  /* Font Families */
  --font-primary:   'Inter', -apple-system, sans-serif;
  --font-display:   'Poppins', -apple-system, sans-serif;
  --font-mono:      'JetBrains Mono', 'Courier New', monospace;

  /* Sizes (mobile-first) */
  --text-xs:   0.75rem;   /* 12px — labels, captions */
  --text-sm:   0.875rem;  /* 14px — secondary text */
  --text-base: 1rem;      /* 16px — body */
  --text-lg:   1.125rem;  /* 18px — emphasized body */
  --text-xl:   1.25rem;   /* 20px — section headers */
  --text-2xl:  1.5rem;    /* 24px — card titles */
  --text-3xl:  1.875rem;  /* 30px — screen titles */
  --text-4xl:  2.25rem;   /* 36px — hero / splash */
  --text-5xl:  3rem;      /* 48px — large display */

  /* Line Heights */
  --leading-tight:  1.2;
  --leading-snug:   1.375;
  --leading-normal: 1.5;
  --leading-relaxed:1.625;

  /* Font Weights */
  --weight-light:   300;
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semibold:600;
  --weight-bold:    700;
  --weight-extrabold:800;
}
```

### Usage Guidelines

| Element | Font | Weight | Size | Line Height |
|---|---|---|---|---|
| Screen Title | Poppins | 700 | 24px | 1.2 |
| Section Header | Poppins | 600 | 20px | 1.2 |
| Card Title | Poppins | 600 | 18px | 1.3 |
| Body Text | Inter | 400 | 16px | 1.5 |
| Secondary Text | Inter | 400 | 14px | 1.4 |
| Button Text | Inter | 600 | 16px | 1.0 |
| Data / Numbers | JetBrains Mono | 500 | 16px | 1.0 |
| Caption / Label | Inter | 500 | 12px | 1.3 |

---

## 4. Spacing & Layout Grid System

### Spacing Scale (8pt Grid)

```css
:root {
  --space-0:  0px;
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

### Layout Grid

```
Mobile (default):  4 columns | 16px gutter | 16px margin
Tablet (640px+):   8 columns | 24px gutter | 24px margin
Desktop (1024px+): 12 columns | 32px gutter | 48px margin
```

### Screen Padding
- **Mobile:** 16px horizontal padding
- **Bottom navigation height:** 64px (safe area aware)
- **Status bar:** 44px top safe area on notched devices
- **Bottom safe area:** 34px on devices with home indicator

---

## 5. Icons

### Library: Lucide React / Heroicons

We use **Lucide** as our primary icon library (open source, consistent stroke weight).

```bash
# Install Lucide
npm install lucide-react
```

### Core Icon Set

| Icon Name | Usage | Category |
|---|---|---|
| `Fuel` | Fuel drop logo, empty state | Brand |
| `MapPin` | Station markers, location | Navigation |
| `Navigation` | Directions, navigate button | Action |
| `Search` | Search bar | Input |
| `Bell` | Notifications | Header |
| `User` | Profile avatar | Header |
| `Plus` | FAB, add actions | Action |
| `CheckCircle` | Confirmation, available status | Status |
| `AlertCircle` | Warning, medium status | Status |
| `XCircle` | Error, no fuel | Status |
| `HelpCircle` | Unknown status | Status |
| `ChevronRight` | List item arrow | Navigation |
| `ChevronDown` | Expand, accordion | Navigation |
| `X` | Close, dismiss | Action |
| `Camera` | Photo upload | Input |
| `Send` | Chat send button | Chat |
| `MessageCircle` | Chat icon | Navigation |
| `BarChart3` | Stats, weekly chart | Dashboard |
| `Car` | Vehicle: Sedan/SUV | Vehicle |
| `Bike` | Vehicle: Motorcycle | Vehicle |
| `Truck` | Vehicle: Commercial | Vehicle |
| `Settings` | Settings gear | Profile |
| `Moon` | Dark mode | Theme |
| `Sun` | Light mode | Theme |
| `Globe` | Language toggle | Settings |
| `Clock` | Timestamps, history | Data |
| `Zap` | AI lightning bolt | AI |
| `TrendingUp` | Route optimization | Route |
| `Gauge` | Ration tracker | Dashboard |
| `RefreshCw` | Pull-to-refresh, sync | Action |
| `Check` | Confirm, done | Action |
| `AlertTriangle` | Ration warning | Alert |
| `Star` | Points, rating | Gamification |

### Icon Sizing

| Context | Size | Stroke Width |
|---|---|---|
| Bottom nav | 24px | 2px |
| Header icons | 22px | 2px |
| Inline icon (button) | 20px | 2px |
| Status badge icon | 16px | 2px |
| Data label icon | 14px | 2px |

---

## 6. Component Library

### 6.1 Buttons

#### Primary Button
- **Use:** Main CTA actions (Report Fuel, Confirm, Submit)
- **Height:** 52px (44px minimum touch target + 8px padding)
- **Border Radius:** 12px
- **Background:** `var(--color-primary)` → hover: `var(--color-primary-light)`
- **Text:** White, Inter 600, 16px, uppercase tracking 0.5px
- **Shadow:** `var(--shadow-glow-orange)` on hover
- **Transition:** 200ms ease-out

#### States:
```
Default:   bg-primary | text-white | shadow-sm
Hover:     bg-primary-light | shadow-glow-orange | scale(1.02)
Active:    bg-primary-dark | scale(0.98)
Loading:   bg-primary | spinner icon | text-"Submitting..."
Disabled:  bg-neutral-30% | text-muted | cursor-not-allowed
```

#### Secondary Button
- **Use:** Secondary actions (Cancel, Back, Dismiss)
- **Height:** 48px
- **Border Radius:** 12px
- **Background:** transparent
- **Border:** 1.5px solid `var(--color-primary)`
- **Text:** Primary color, Inter 600, 16px

#### Ghost Button
- **Use:** Tertiary actions, icon-only buttons
- **Background:** transparent
- **Text:** `var(--text-secondary)`, Inter 500, 14px
- **Hover:** bg-surface

#### Floating Action Button (FAB)
- **Size:** 60px × 60px
- **Background:** `var(--color-primary)` with `var(--shadow-glow-orange)`
- **Icon:** Plus or Report icon, 28px, white
- **Position:** 24px from right edge, 100px from bottom (above nav)
- **Animation:** Pulse animation when user hasn't reported in 30+ min

### 6.2 Cards

#### Station Card
- **Background:** `var(--bg-surface)`
- **Border Radius:** 16px
- **Padding:** 16px
- **Border:** 1px solid `var(--border-default)`
- **Shadow:** `var(--shadow-sm)`
- **Content:** Station name (Poppins 600 16px), address (Inter 400 14px muted), status badge, distance

#### Status Badge
- **Size:** Auto-width pill, 28px height
- **Border Radius:** 14px
- **Typography:** Inter 600 12px, uppercase, letter-spacing 0.5px
- **Colors:** Green/Amber/Red/Grey per fuel status
- **Icon:** Status icon left-aligned, 4px gap to text

#### Stats Card (Dashboard)
- **Background:** `var(--bg-elevated)`
- **Border Radius:** 20px
- **Padding:** 20px
- **Shadow:** `var(--shadow-md)`
- **Content:** Icon + Label (top), Big Number (Poppins 700 32px), Subtext

#### Vehicle Card
- **Background:** `var(--bg-surface)`
- **Border Radius:** 16px
- **Left accent bar:** 4px wide, primary color
- **Content:** Vehicle icon + type (top), fuel limit (large mono number), used/remaining

### 6.3 Inputs

#### Text Input
- **Height:** 52px
- **Border Radius:** 12px
- **Background:** `var(--bg-elevated)`
- **Border:** 1.5px solid `var(--border-default)`
- **Padding:** 0 16px
- **Text:** Inter 400 16px white
- **Placeholder:** `var(--text-muted)`
- **States:**
  - Default: grey border
  - Focus: `var(--border-focus)` border + subtle blue glow
  - Error: `var(--color-danger)` border + error message below
  - Disabled: 50% opacity

#### Search Input
- **Height:** 48px
- **Border Radius:** 24px (pill shape)
- **Background:** `var(--bg-elevated)`
- **Left icon:** Search icon, 20px, muted
- **Clear button:** X icon right side when has value

#### Chat Input
- **Min Height:** 48px, max 120px (auto-grow)
- **Border Radius:** 24px
- **Background:** `var(--bg-elevated)`
- **Send button:** 44px circle, primary color, right side

### 6.4 Bottom Sheets

Bottom sheets slide up from bottom with a drag handle at top.

- **Drag Handle:** 40px wide, 4px tall, grey, centered, 8px from top
- **Border Radius:** 24px top corners
- **Background:** `var(--bg-elevated)`
- **Padding:** 24px horizontal, 16px top (below handle), 32px bottom
- **Shadow:** `var(--shadow-lg)` top
- **Animation:** 300ms cubic-bezier(0.4, 0, 0.2, 1)
- **Backdrop:** Semi-transparent overlay on map behind sheet

**Sheet Sizes:**
- Small (peek): 25% screen height — used for quick stats on map
- Medium: 50% screen height — station details, filters
- Large: 85% screen height — report flow, chat, full lists

### 6.5 Bottom Navigation

```
┌────────────────────────────────────────────────────────────┐
│  [44px safe area top]                                      │
│                                                            │
│                    SCREEN CONTENT                          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Content above nav, scrollable]                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🗺️ Map  │  ⛽ Report  │  📊 Tracker  │  💬 AI  │  👤  │  │
│  │  24px    │   24px     │    24px      │  24px   │ 24px │  │
│  └──────────────────────────────────────────────────────┘  │
│  [34px safe area bottom]                                  │
└────────────────────────────────────────────────────────────┘
```

- **Height:** 64px + safe area
- **Background:** `var(--bg-surface)` with top border 1px `var(--border-default)`
- **Icon size:** 24px
- **Label size:** 11px Inter 500
- **Active state:** Primary color icon + text + subtle glow
- **Inactive:** Muted grey icon + text

### 6.6 Status Indicators (Map)

Map markers use a 4-color system:

| Status | Color | Hex | Marker Style |
|---|---|---|---|
| Available | Green | `#00E676` | Pulsing dot + ring animation |
| Medium | Amber | `#FFB300` | Static dot |
| Low | Red | `#FF1744` | Static dot |
| Unknown | Grey | `#A0A0A0` | Hollow dot |

Marker size: 32px diameter on map, expands to 44px on selection.

### 6.7 Chat Bubbles

#### User Bubble
- **Background:** `var(--color-primary)`
- **Text:** White, Inter 400 15px
- **Border Radius:** 18px top-left, 18px top-right, 4px bottom-right, 18px bottom-left
- **Max Width:** 80% of screen
- **Alignment:** Right

#### AI Bubble
- **Background:** `var(--bg-elevated)`
- **Text:** White, Inter 400 15px
- **Border Radius:** 18px top-left, 18px top-right, 18px bottom-right, 4px bottom-left
- **Max Width:** 80% of screen
- **Alignment:** Left
- **AI indicator:** Small blue dot left side

### 6.8 Progress Indicators

#### Circular Ration Progress
- **Size:** 120px diameter
- **Track:** `var(--bg-surface)` 8px stroke
- **Fill:** Gradient from `var(--color-primary)` to `var(--color-accent)`
- **Center text:** Liters remaining (Poppins 700 24px)
- **Subtext:** "/ X L limit" (Inter 400 12px muted)

#### Linear Progress Bar
- **Height:** 8px
- **Border Radius:** 4px
- **Track:** `var(--bg-surface)`
- **Fill:** Status color (green/amber/red) based on percentage
- **Animation:** 400ms ease-out fill transition

---

## 7. Animation Specifications

### Timing
| Name | Duration | Easing |
|---|---|---|
| Instant | 0ms | — |
| Fast | 150ms | ease-out |
| Normal | 200ms | ease-out |
| Slow | 300ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Sheet | 350ms | cubic-bezier(0.4, 0, 0.2, 1) |

### Micro-Animations

| Element | Animation | Trigger |
|---|---|---|
| Button press | scale(0.97) + bg darken, 100ms | on touch start |
| Card tap | scale(0.98), 150ms | on tap |
| Bottom sheet open | slide up 300ms + fade backdrop | on open |
| Bottom sheet close | slide down 250ms | on dismiss/drag down |
| FAB appear | scale(0→1) + fade, 300ms spring | on scroll threshold |
| Station marker pulse | opacity 1→0.5→1, 2s infinite | when status = available |
| Confidence score count | number count-up 800ms | on reveal |
| Pull-to-refresh | rotate spinner, translate Y | on pull |
| Tab switch | color fade 200ms + indicator slide | on tab tap |
| Toast notification | slide in from top + fade, 3s auto-dismiss | on trigger |
| Chat send | bubble scale(0→1) from right, 200ms | on send |
| AI typing | 3 dots bounce in sequence, 1.2s loop | AI thinking |

### Page Transitions
- **Forward:** Slide left (new page), 300ms
- **Back:** Slide right (old page), 300ms
- **Modal/Sheet:** Slide up from bottom, 350ms
- **Tab content swap:** Fade cross-dissolve, 200ms

---

## 8. Mobile-First Breakpoints

```css
/* Base: 320px — Minimum supported width */
@media (min-width: 320px) { }

/* Small: 375px — Standard phone portrait */
@media (min-width: 375px) { }

/* Medium: 425px — Large phone portrait */
@media (min-width: 425px) { }

/* Tablet: 640px — Phone landscape / small tablet */
@media (min-width: 640px) { }

/* Large Tablet: 768px — Tablet portrait */
@media (min-width: 768px) { }

/* Desktop: 1024px — Tablet landscape / small desktop */
@media (min-width: 1024px) { }

/* Large Desktop: 1280px+ */
@media (min-width: 1280px) { }
```

**Note:** Primary design target is 375px–428px (standard to large phone). Desktop is secondary.

---

## 9. Screen Wireframes

---

### Screen 1: Splash / Onboarding

```
┌──────────────────────────────────┐
│  [Status Bar - 44px]             │
│                                  │
│                                  │
│                                  │
│          ⛽ [animated]            │
│        FUEL RUSH                 │
│   Never wait in line for         │
│        fuel again                │
│                                  │
│    ┌──────────────────────┐       │
│    │   🏍️ Motorcycle     │       │
│    └──────────────────────┘       │
│    ┌──────────────────────┐       │
│    │   🚗 Sedan           │       │
│    └──────────────────────┘       │
│    ┌──────────────────────┐       │
│    │   🚙 SUV             │       │
│    └──────────────────────┘       │
│    ┌──────────────────────┐       │
│    │   🚚 Commercial      │       │
│    └──────────────────────┘       │
│                                  │
│    ● ○ ○ ○  (step dots)          │
│                                  │
│  [Home Indicator - 34px]         │
└──────────────────────────────────┘

Background: #0D0D0D
Logo animation: Fuel drop bounces in, scales up with spring physics
Vehicle cards: full-width, 56px height, rounded-16px, bg-surface
Each card: vehicle icon (32px) left, label right, chevron
On select: card glows primary, checkmark appears, auto-advances after 400ms
```

---

### Screen 2: Main Map Screen (Home)

```
┌──────────────────────────────────┐
│ [44px] [Search........🔔 👤] [64px]│
│         │                        │
│   ┌──────▼───────────────────┐   │
│   │  🔍 Search fuel stations  │   │
│   └──────────────────────────┘   │
│                                  │
│         [MAP - Full Screen]      │
│                                  │
│    📍      📍                    │
│         [●]          📍          │
│    📍          📍                │
│              [●]                 │
│    📍              📍            │
│         📍                       │
│                                  │
│ ┌─────────────────────────────┐  │
│ │ [DRAG HANDLE]               │  │
│ │                             │  │
│ │  Today: 3.2L / 5L  [■■■□□]  │  │
│ │  🏍️ Yamaha • Stations: 2   │  │
│ │  ─────────────────────────  │  │
│ │  Nearby: Dhanmondi  [2.1km]  │  │
│ │  📍 Station A ● Available   │  │
│ │  📍 Station B ● Medium      │  │
│ └─────────────────────────────┘  │
│                           [FAB]  │
│  ┌────────────────────────────┐  │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

Map: Google Maps / Mapbox with dark style
Station markers: 32px circles with status color + icon
Selected marker: 44px with bounce animation + callout
FAB: 60px, primary orange, bottom-right 24px margins, shadow-glow
Bottom sheet peek height: ~180px
Quick stats visible in peek: ration bar + station count
Pull up sheet: reveals nearby station list
```

---

### Screen 3: Station Detail Bottom Sheet

```
┌──────────────────────────────────┐
│         [FULL SCREEN MAP]        │
│              📍                  │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ [DRAG HANDLE]         [✕]  │ │
│  │                             │ │
│  │  ⛽ Petromax Dhanmondi      │ │
│  │  📍 House 12, Road 5,       │ │
│  │     Dhanmondi 27, Dhaka    │ │
│  │                             │ │
│  │  ┌─────────────────────────┐│ │
│  │  │  ● AVAILABLE  [92%]     ││ │
│  │  │  Last confirmed 3m ago  ││ │
│  │  └─────────────────────────┘│ │
│  │                             │ │
│  │  ┌─ Fuel Types ───────────┐│ │
│  │  │ Octane 95   ● Available ││ │
│  │  │ Octane 92   ● Available ││ │
│  │  │ Diesel      ◐ Medium    ││ │
│  │  │ Prem Diesel ○ Low       ││ │
│  │  └─────────────────────────┘│ │
│  │                             │ │
│  │  ┌──────────┐ ┌──────────┐  │ │
│  │  │ 🧭       │ │  ✓       │  │ │
│  │  │ Navigate │ │ Confirm │  │ │
│  │  │          │ │  Fuel    │  │ │
│  │  └──────────┘ └──────────┘  │ │
│  │                             │ │
│  │  ── Community ─────────────  │ │
│  │  Rahim A. • 5m ago  ● Yes   │ │
│  │  Fatima K. • 12m ago ● Yes  │ │
│  │  [View all 24 reports]      │ │
│  │                             │ │
│  └─────────────────────────────┘ │
│                           [FAB] │
│  ┌────────────────────────────┐ │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘ │
└──────────────────────────────────┘

Sheet: Large (85% height), scrollable
Confidence badge: 92% in accent blue, pill shape
Confidence meter: thin horizontal bar below badge
Fuel types list: icon + name + availability pill per row
Navigate button: Secondary style, opens Google Maps with coords
Confirm button: Primary style (green tint for success), opens confirm modal
Community section: avatar initial + name + relative time + status voted
```

---

### Screen 4: Report Fuel Flow

```
STEP 1 - Select Station:
┌──────────────────────────────────┐
│  [←]  Report Fuel          [?]  │
│  ──────────────────────────────  │
│  Step 1 of 6                    │
│  ● ● ○ ○ ○ ○                    │
│                                  │
│  Which station are you           │
│  reporting for?                  │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ 🔍 Search stations...       │ │
│  └─────────────────────────────┘ │
│                                  │
│  Recent:                        │
│  ┌─────────────────────────────┐ │
│  │ ⛽ Petromax Dhanmondi   0.3km│ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ ⛽ Gradex Fill Station  0.8km│ │
│  └─────────────────────────────┘ │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ ➕ Station not listed?      │ │
│  └─────────────────────────────┘ │
│                                  │
│  [Continue →]                    │
│  ┌────────────────────────────┐  │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

STEP 2 - Fuel Type:
┌──────────────────────────────────┐
│  [←]  Report Fuel          [?]  │
│  ──────────────────────────────  │
│  Step 2 of 6                    │
│  ○ ● ● ○ ○ ○                    │
│                                  │
│  What fuel type are you          │
│  reporting?                     │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ ⛽  Octane 95          [ ] │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ ⛽  Octane 92          [ ] │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ 🚗  Diesel             [✓] │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ 🚙  Premium Diesel      [ ] │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ 🏠  Kerosene           [ ] │ │
│  └─────────────────────────────┘ │
│                                  │
│  [← Back]      [Continue →]     │
│  ┌────────────────────────────┐  │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────┘  │
└──────────────────────────────────┘

STEP 3 - Availability:
┌──────────────────────────────────┐
│  [←]  Report Fuel          [?]  │
│  ──────────────────────────────  │
│  Step 3 of 6                    │
│  ○ ○ ● ○ ○ ○                    │
│                                  │
│  Is fuel available right now?    │
│                                  │
│       ┌─────────────────────┐     │
│       │                     │     │
│       │    ●  AVAILABLE     │     │
│       │                     │     │
│       └─────────────────────┘     │
│       ┌─────────────────────┐     │
│       │                     │     │
│       │    ○  NOT AVAILABLE │     │
│       │                     │     │
│       └─────────────────────┘     │
│       ┌─────────────────────┐     │
│       │                     │     │
│       │    ?  NOT SURE      │     │
│       │                     │     │
│       └─────────────────────┘     │
│                                  │
│  [← Back]                        │
│  ┌────────────────────────────┐  │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

Large selection cards: 80px height, full width, rounded-16px
Available card: green border + green bg tint
Not Available card: red border + red bg tint
Not Sure card: grey border + grey bg tint
Selection animates with checkmark + scale pulse

STEP 4 - Photo Upload:
┌──────────────────────────────────┐
│  [←]  Report Fuel          [?]  │
│  ──────────────────────────────  │
│  Step 4 of 6                    │
│  ○ ○ ○ ● ○ ○                    │
│                                  │
│  Add a photo (optional)          │
│                                  │
│       ┌───────────────────┐       │
│       │                   │       │
│       │    📷            │       │
│       │   Tap to add     │       │
│       │   photo          │       │
│       │                   │       │
│       └───────────────────┘       │
│                                  │
│  [Skip this step →]              │
│                                  │
│  [← Back]      [Continue →]     │
│  ┌────────────────────────────┐  │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

Photo upload area: 200px height, dashed border, rounded-20px
After photo: shows thumbnail with X to remove

STEP 5 - AI Confidence:
┌──────────────────────────────────┐
│  [←]  Report Fuel          [?]  │
│  ──────────────────────────────  │
│  Step 5 of 6                    │
│  ○ ○ ○ ○ ● ○                    │
│                                  │
│  🧠 Analyzing your report...     │
│                                  │
│       ┌─────────────────┐        │
│       │    ████████░░   │        │
│       │      78%        │        │
│       │  Confidence     │        │
│       └─────────────────┘        │
│                                  │
│  Checking cross-reports...       │
│  ✓ 2 similar reports nearby      │
│  ✓ Photo verified (if added)     │
│  ✓ Time-of-day pattern match     │
│                                  │
│  [← Back]      [Submit →]        │
│  ┌────────────────────────────┐  │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

Confidence display: circular progress + percentage in center
Checklist items animate in one by one (stagger 200ms)

STEP 6 - Confirmation:
┌──────────────────────────────────┐
│  [←]  Report Fuel          [✕]  │
│  ──────────────────────────────  │
│  Step 6 of 6                    │
│  ○ ○ ○ ○ ○ ●                    │
│                                  │
│                                  │
│         ✓                        │
│                                  │
│    Report Submitted!             │
│                                  │
│    ┌─────────────────────┐        │
│    │  ⛽ Petromax        │        │
│    │  Diesel             │        │
│    │  ● Available        │        │
│    └─────────────────────┘        │
│                                  │
│    ┌─────────────────────┐        │
│    │  🏆 +15 Points     │        │
│    │  Contribution: 3    │        │
│    │  Rank: Fuel Scout  │        │
│    └─────────────────────┘        │
│                                  │
│    [Back to Map]                 │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

Confetti animation on success (subtle, brand colors)
Points card: gold/yellow accent, star icon
Rank badge: icon + name
```

---

### Screen 5: AI Chat / Query Screen

```
┌──────────────────────────────────┐
│ [44px]  💬  Fuel Rush AI   [⋮]  │
│ ─────────────────────────────── │
│                                  │
│  ┌──────────────────────────┐   │
│  │ 🧠                       │   │
│  │ Hi! I'm your fuel intel  │   │
│  │ assistant. Ask me anything│   │
│  │ about fuel near you.     │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │ Which stations near      │   │
│  │ Mohammadpur have fuel    │   │
│  │ right now?           [→] │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │ 🧠                       │   │
│  │ Based on recent reports,  │   │
│  │ 3 stations near Mohammadpur│   │
│  │ have fuel available:     │   │
│  │ • Petromax (+1.2km) ●    │   │
│  │ • Gradex (+1.8km) ●      │   │
│  │ • City Fill (+2.1km) ●   │   │
│  │                        [→]│   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │ How long are the lines   │   │
│  │ at Petromax right now?   │   │
│  │                      [→] │   │
│  └──────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐  │
│ │ 📷 │ Type a message... [😀]│ │ [➤] │ │
│ └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

Header: back arrow, AI icon + "Fuel Rush AI", menu dots
Welcome message: left-aligned AI bubble with blue dot
Suggested chips below welcome: "Nearby available stations", "Best route to Gulshan", "Ration status"
User bubbles: right-aligned, primary orange
AI bubbles: left-aligned, elevated surface, avatar dot
Typing indicator: 3 bouncing dots in AI bubble
Input bar: camera icon | text input | emoji picker | send button
Quick suggestions (horizontal scroll): pill-shaped, ghost style, tappable
```

---

### Screen 6: Ration Tracker Dashboard

```
┌──────────────────────────────────┐
│ [44px]  📊  Ration Tracker  [⚙️]│
│ ─────────────────────────────── │
│                                  │
│       ┌──────────────┐          │
│      ╱                ╲         │
│     │    3.2 / 5 L    │         │
│     │   [■■■■■□□□□□]   │         │
│      ╲                ╱         │
│       └──────────────┘          │
│       Daily Ration Used         │
│                                  │
│  ┌─────────────────────────────┐│
│  │ 🚗  Yamaha FZS              ││
│  │ Daily limit: 5.0L           ││
│  │ Used today: 3.2L            ││
│  │ Remaining: 1.8L              ││
│  └─────────────────────────────┘│
│                                  │
│  ── Today ───────────────────── │
│                                  │
│  ┌─────────────────────────────┐│
│  │ 🕐 08:30 AM                 ││
│  │ ⛽ Petromax Dhanmondi        ││
│  │ 1.5L filled                 ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🕐 02:15 PM                 ││
│  │ ⛽ Gradex Fill Station     ││
│  │ 1.7L filled                 ││
│  └─────────────────────────────┘│
│                                  │
│  ── Weekly Summary ──────────── │
│                                  │
│  ┌─────────────────────────────┐│
│  │  [Bar Chart: Mon-Sun]      ││
│  │  █                          ││
│  │  █ █     █                  ││
│  │  █ █ █ █ █                  ││
│  │  M  T  W  T  F  S  S        ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │ 🔄 Ration resets in        ││
│  │    7h 42m at midnight      ││
│  └─────────────────────────────┘│
│                                  │
│  ┌────────────────────────────┐ │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘ │
└──────────────────────────────────┘

Circular progress: 120px, gradient stroke, animates on load
Bar chart: 7 bars, current day highlighted in primary color
Trip entries: timestamp (mono font), station name, liters filled
Reset countdown: warning card, amber accent
```

---

### Screen 7: Route Planner Screen

```
┌──────────────────────────────────┐
│ [44px]  🧭  Route Planner   [✕]│
│ ─────────────────────────────── │
│                                  │
│  ┌─────────────────────────────┐│
│  │ 📍 My Location (current)    ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🎯 Destination              ││
│  │ [Search or enter address]  ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │ ⚡  Optimize with AI        ││
│  │ Find fuel-efficient route  ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │ Add stop (fuel station)    ││
│  │ [+]                         ││
│  └─────────────────────────────┘│
│                                  │
│         [MAP PREVIEW]            │
│    ══════════════════           │
│   /                       \     │
│  ════════════════════════  ●    │
│   \        ↓ ↓ ↓       /        │
│    ═══════════════════           │
│                                  │
│  ┌─────────────────────────────┐│
│  │ Route: 12.4 km              ││
│  │ ETA: 28 min                 ││
│  │ Fuel needed: ~2.1L          ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │  🗺️  Start Navigation      ││
│  └─────────────────────────────┘│
│                                  │
│  ┌────────────────────────────┐ │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘ │
└──────────────────────────────────┘

Start point: locked, shows GPS icon, auto-filled
Destination: editable input with autocomplete
Optimize button: full-width, accent blue, lightning icon
Add stop: dashed outline card, taps to open station selector
Map preview: shows route line (primary color) with waypoints
Stats bar: route km + ETA + fuel estimate in mono font
Start Navigation: primary button, opens Google Maps with route
```

---

### Screen 8: Notifications Center

```
┌──────────────────────────────────┐
│ [44px]  🔔  Notifications   [✓]│
│ ─────────────────────────────── │
│                                  │
│  [All] [Nearby] [Alerts] [Mine]  │
│                                  │
│  ┌─────────────────────────────┐│
│  │ 🚨 URGENT                    ││
│  │ Station X near you has      ││
│  │ fuel available NOW!         ││
│  │ Petromax Dhanmondi • 300m    ││
│  │ 2m ago                       ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │ ❓ Confirm fuel?            ││
│  │ Someone reported fuel at    ││
│  │ Gradex 5m ago. Can you       ││
│  │ confirm current status?      ││
│  │ [✓ Yes]  [✗ No]  [? Unsure] ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │ 🔄 Ration resets tonight    ││
│  │ Your daily ration resets    ││
│  │ at 12:00 AM. Used 4.2L/5L.  ││
│  │ 7h 20m remaining            ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │ 🏆 Milestone reached!        ││
│  │ You've submitted 50 reports  ││
│  │ and helped 1,234 drivers.   ││
│  │ [+15 bonus points]           ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │ ℹ️ Station updated           ││
│  │ Octane 95 now available at  ││
│  │ Gradex Fill Station         ││
│  │ 45m ago                     ││
│  └─────────────────────────────┘│
│                                  │
│  ┌────────────────────────────┐ │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘ │
└──────────────────────────────────┘

Filter tabs: scrollable horizontal, active has underline
Urgent notification: red left border, bold title
Confirm request: has inline Yes/No/Unsure action buttons
Milestone: gold/yellow accent, star icon
Timestamp: right-aligned, relative time, muted color
Mark all read: text button top-right
Empty state: illustration + "All caught up!"
```

---

### Screen 9: Profile / Settings

```
┌──────────────────────────────────┐
│ [44px]  👤  Profile        [⚙️] │
│ ─────────────────────────────── │
│                                  │
│         ┌─────────┐             │
│         │  👤 AZ  │             │
│         └─────────┘             │
│       Adnan Zaman               │
│       🏆 Fuel Scout • Lvl 3     │
│                                  │
│  ┌─────────────────────────────┐│
│  │  📊 Contribution Stats      ││
│  │  ─────────────────────────  ││
│  │  Reports submitted:   47     ││
│  │  Confirmations:      89     ││
│  │  Total points:       782     ││
│  │  [View Leaderboard →]       ││
│  └─────────────────────────────┘│
│                                  │
│  ── My Vehicle ──────────────── │
│  ┌─────────────────────────────┐│
│  │ 🚗 Yamaha FZS               ││
│  │ Daily limit: 5.0L            ││
│  │ [Edit Vehicle →]            ││
│  └─────────────────────────────┘│
│                                  │
│  ── Preferences ─────────────── │
│  ┌─────────────────────────────┐│
│  │ 🔔 Notifications       [✓]  ││
│  │ Proximity alerts     [✓]   ││
│  │ Confirm requests     [✓]   ││
│  │ Ration reminders      [✓]   ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🌙 Dark Mode          [✓]   ││
│  │ ☀️ Light Mode         [ ]   ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🌐 Language          [EN ▾] ││
│  │ Bangla / English            ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │ 📖 Help & Support           ││
│  │ ℹ️ About Fuel Rush          ││
│  │ 🚪 Sign Out                 ││
│  └─────────────────────────────┘│
│                                  │
│  ┌────────────────────────────┐ │
│  │ 🗺️  │ ⛽ │ 📊 │ 💬 │ 👤 │  │
│  └────────────────────────────┘ │
└──────────────────────────────────┘

Avatar: 80px circle, initials fallback, gradient background
Level badge: icon + name below name
Stats card: surface background, mono font numbers
Vehicle card: left accent bar
Toggle switches: 52px wide, 32px tall, smooth 200ms transition
Sign out: danger red text, confirmation modal on tap
```

---

## 10. Design Tokens Summary (CSS Variables)

```css
/* Ready to paste into your Tailwind config or CSS base */

--fuel-primary:      #FF6B35;
--fuel-primary-light: #FF8A5C;
--fuel-primary-dark:  #E55A28;
--fuel-secondary:    #1A1A2E;
--fuel-accent:        #00D4FF;
--fuel-success:       #00E676;
--fuel-warning:       #FFB300;
--fuel-danger:        #FF1744;
--fuel-neutral:       #A0A0A0;

--bg-base:     #0D0D0D;
--bg-surface:  #1E1E2E;
--bg-elevated:  #2A2A3E;

--text-primary:   #FFFFFF;
--text-secondary: #A0A0A0;
--text-muted:     #666677;

--border-default: #2E2E3E;
--border-focus:   #00D4FF;

--radius-sm:  8px;
--radius-md:  12px;
--radius-lg:  16px;
--radius-xl:  24px;
--radius-full: 9999px;

--shadow-sm:  0 2px 8px rgba(0,0,0,0.4);
--shadow-md:  0 4px 16px rgba(0,0,0,0.5);
--shadow-lg:  0 8px 32px rgba(0,0,0,0.6);

--transition-fast:   150ms ease-out;
--transition-normal: 200ms ease-out;
--transition-slow:   300ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 11. Accessibility

- **Color contrast:** All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- **Touch targets:** Minimum 44×44px for all interactive elements
- **Focus indicators:** Visible focus ring in accent blue for keyboard/switch users
- **Screen reader:** Semantic HTML, ARIA labels on icons, alt text on images
- **Reduced motion:** Respect `prefers-reduced-motion` — disable pulse, bounce animations
- **Font scaling:** Text uses `rem`, respects browser/OS font size preferences

---

*End of Fuel Rush UX Design Specification v1.0*
