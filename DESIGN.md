# Design System — Tizzle

## Product Context

- **What this is:** A mobile app (React Native/Expo) for blockchain event ticketing on Solana — fans buy tickets, organizers create events, venue door staff scan QR codes for check-in.
- **Who it's for:** Event organizers (create + issue), fans (hold + show ticket), venue door staff (scan + verify). Crypto-native and crypto-curious users.
- **Space/industry:** Live events × Web3. Solana devnet. Peers: DICE (aesthetic), Phantom (polish), Magic Eden (crypto UX patterns).
- **Project type:** React Native / Expo mobile app (iOS + Android)

---

## Aesthetic Direction

- **Direction:** Dark Event Poster — the visual language of a festival identity sheet, not software. The app should feel like the brand that _designed_ the festival, not the app that sold tickets to it. Concert poster meets verified blockchain record.
- **Decoration level:** Intentional — ticket-stub metaphors in key components (perforated divider on ticket cards), grain texture sparingly applied. Not bare minimal, not fully expressive.
- **Mood:** Bold, electric, high-contrast. When you open the app it should feel like walking up to the venue. Blockchain primitives are invisible infrastructure — a ticket is a ticket, not a token.
- **Reference:** dice.fm (editorial dark type), phantom.app (mobile web3 polish)

---

## Typography

- **Display / Hero:** `Clash Grotesk` (Fontshare) — event names, screen titles, hero headings. Weight 700. Tracking –0.03em to –0.04em. Use at aggressive sizes on hero moments (48–80pt for event names — make every act feel like a headliner).
- **Body / Labels:** `DM Sans` (Google Fonts) — descriptions, metadata, UI labels, navigation labels, tab bar labels. Weight 400/500/600. Line-height 1.5–1.65.
- **Data / Mono:** `Geist Mono` (Google Fonts) — wallet addresses, ticket IDs, SOL amounts, on-chain hashes. Feature `tabular-nums` enabled. Tracking +0.02em to +0.08em.

### Loading

```
Clash Grotesk: https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600,700&display=swap
DM Sans:       https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap
Geist Mono:    https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap
```

For React Native, load via `expo-font` or `@expo-google-fonts/*`.

### Type Scale

| Token    | Size    | Font          | Weight | Use                                |
| -------- | ------- | ------------- | ------ | ---------------------------------- |
| `xs`     | 12px    | DM Sans       | 400    | Captions, fine print               |
| `sm`     | 14px    | DM Sans       | 400    | Secondary metadata                 |
| `md`     | 16px    | DM Sans       | 400/500| Body text, descriptions            |
| `lg`     | 20px    | DM Sans       | 600    | Section headers, card prices       |
| `xl`     | 24px    | Clash Grotesk | 700    | Card titles, CTA labels            |
| `2xl`    | 32px    | Clash Grotesk | 700    | Large title (inline nav), headings |
| `3xl`    | 48px    | Clash Grotesk | 700    | Screen large titles                |
| `4xl`    | 64px    | Clash Grotesk | 700    | Event name hero                    |
| `5xl`    | 80px+   | Clash Grotesk | 700    | Full-bleed event poster            |
| `mono`   | 11–14px | Geist Mono    | 400/500| Addresses, IDs, amounts            |
| `label`  | 9–11px  | DM Sans/Mono  | 500    | Uppercase labels, tracking +0.08em |

---

## Color

- **Approach:** Restrained — `#CAFF00` is the single accent. Everything else is grayscale. When lime appears, it means something: active, live, confirmed, owned. Do not dilute it.

### Palette

| Token              | Hex                        | Usage                                                       |
| ------------------ | -------------------------- | ----------------------------------------------------------- |
| `background`       | `#0A0A0A`                  | App background, page root — the stage                       |
| `surface`          | `#111111`                  | Cards, tab bar, nav bar background                          |
| `surface-up`       | `#1A1A1A`                  | Elevated cards, inputs, ticket cards, nested elements       |
| `surface-high`     | `#242424`                  | Tooltips, active pressed state                              |
| `border`           | `rgba(255,255,255,0.08)`   | Hairline borders — invisible seams, not visible lines       |
| `border-strong`    | `#2A2A2A`                  | Explicit dividers where hairline isn't enough               |
| `accent`           | `#CAFF00`                  | Active tab, primary CTA, confirmed state, valid ticket dot  |
| `accent-dim`       | `rgba(202,255,0,0.12)`     | Accent backgrounds, "live" / "on sale" badge fill           |
| `accent-border`    | `rgba(202,255,0,0.20)`     | Accent badge borders                                        |
| `text-primary`     | `#FFFFFF`                  | Headlines, primary content                                  |
| `text-secondary`   | `#888888`                  | Metadata, secondary labels, inactive tab labels             |
| `text-muted`       | `#444444`                  | Placeholders, disabled states, fine print                   |
| `error`            | `#FF3B30`                  | Validation errors, destructive actions, invalid ticket      |
| `success`          | `#34C759`                  | Check-in confirmed (door staff view)                        |
| `warning`          | `#FFB800`                  | Edge states, expiring tickets                               |
| `chain`            | `#9945FF`                  | Solana on-chain status indicators — borrow Solana brand     |

### Accent usage rules

- ✅ Active tab indicator (dot + label + icon color)
- ✅ Primary CTA button (lime fill, `#0A0A0A` text)
- ✅ Valid ticket status dot (with `box-shadow: 0 0 8px #CAFF00` glow)
- ✅ "Live" / "On Sale" badge fill
- ✅ Active filter pill selection
- ✅ QR scan line animation
- ✅ Lime uppercase label on mono data (dates in event cards)
- ❌ Do not use lime on surfaces other than `#0A0A0A` background — contrast ratio may fail on `#111111`
- ❌ Do not use lime for every interactive element — reserve for action, live state, and success

### Dark mode

This app is dark mode only. There is no light mode. `#0A0A0A` is the floor.

---

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable — spacious enough to feel premium, tight enough to show meaningful content on a mobile viewport.

### Scale

| Token | Value | Notes                               |
| ----- | ----- | ----------------------------------- |
| `2xs` | 4px   | Icon-to-label gap, badge padding    |
| `xs`  | 8px   | Minimum inner padding               |
| `sm`  | 12px  | Compact item padding                |
| `md`  | 16px  | Default card and screen padding     |
| `lg`  | 24px  | Section gap, generous card padding  |
| `xl`  | 32px  | Between major sections              |
| `2xl` | 48px  | Screen top padding, hero gap        |
| `3xl` | 64px  | Full-bleed section spacing          |

- **Screen horizontal padding:** `md` (16px)
- **Card internal padding:** `md` (16px)
- **Tab bar height:** native 49pt + bottom safe area — do not customize

---

## Border Radius

Restrained. Sharp by default; rounding is purposeful and creates hierarchy.

| Element                     | Radius   |
| --------------------------- | -------- |
| Tag / chip / badge          | 4px      |
| Input field                 | 8px      |
| Card (event card)           | 10px     |
| Ticket card (stub-cut)      | 10px     |
| Bottom sheet / modal        | 16px top corners only |
| Button pill (CTA)           | 9999px   |
| Status pill / filter pill   | 9999px   |
| Full-bleed (images, banners)| 0        |
| Phone frame (preview only)  | 36px     |

Do not apply uniform radius across all elements. The contrast between sharp and rounded elements creates visual hierarchy.

---

## Layout

- **Approach:** Hybrid — grid-disciplined for tab screens, lists, and data; editorial freedom for event hero moments (event detail, ticket view, QR screen).
- **Mobile grid:** Single column, `md` (16px) horizontal padding.
- **Max content width:** Full-bleed on mobile (no max-width constraint for app screens). 1200px for any web preview only.
- **Image treatment:** Event cover images are full-width with no border-radius (bleed to card edges). 16:9 for cards, 1:1 for thumbnails.

---

## Mobile Navigation

Navigation is a first-class design surface. These specs must be applied consistently across all screens.

### Header — Large Title (main tab screens)

Used on: **Explore, Tickets, Create, Scanner**

- **Background:** `#0A0A0A` — transparent, flush with screen background, no elevation or shadow
- **Status bar:** Light content (`StatusBar barStyle="light-content"`) — white clock, white icons
- **Large title font:** Clash Grotesk 700, 34pt, `#FFFFFF`, letter-spacing –0.03em
- **Title position:** Left-aligned, below status bar, 16px left inset
- **Scroll behavior:** Title stays large at scroll-top. On scroll, `rgba(255,255,255,0.08)` hairline border appears at bottom — no compact title transition unless native behavior applies.

```
┌──────────────────────────────────────────┐
│ 9:41                         ▓▓▓ ▓▓ 🔋  │  ← Status bar (44pt)
│                                          │
│ Explore                                  │  ← Clash Grotesk 700 / 34pt / left
└──────────────────────────────────────────┘
```

### Header — Inline Title (pushed / detail screens)

Used on: **Event Detail, Ticket Detail, Profile, Create form, Org settings, Scanner result**

- **Background:** `#0A0A0A`
- **Back button:** `#CAFF00` `‹` chevron icon (SF Symbol: `chevron.left`) — no label text — 44pt touch target, 16px from left edge
- **Title:** DM Sans 600, 16pt (17pt on iOS), `#FFFFFF`, horizontally centered
- **Right actions:** Stroke-based icon buttons at 22–24pt icon size, `#FFFFFF`, 44pt touch target, 16px from right edge
- **Separator:** 1px `rgba(255,255,255,0.08)` bottom border

```
┌──────────────────────────────────────────┐
│ 9:41                         ▓▓▓ ▓▓ 🔋  │  ← Status bar (44pt)
│  ‹  Explore     Night Moves      ···     │  ← Inline nav (44pt), DM Sans 600
└──────────────────────────────────────────┘
```

### Bottom Tab Bar

- **Background:** `#111111` (surface)
- **Top separator:** 1px `rgba(255,255,255,0.08)` hairline
- **Height:** 49pt + `safeAreaInsets.bottom` — do not override native height
- **Active tab:** Icon color `#CAFF00` + label color `#CAFF00` + 4×4px lime dot centered above icon
- **Inactive tab:** Icon color `#888888` (opacity 0.6) + label color `#888888`
- **Label font:** DM Sans 500, 10pt, no text transform, no letter-spacing
- **Icon:** Stroke-based (not filled), 22–24pt, 2pt stroke weight
- **Touch target:** 44pt minimum per tab item
- **Transition:** Active indicator changes at `micro` (80ms)

```
┌──────────────────────────────────────────┐
│         ·                                │  ← 4px lime dot (active only)
│  [🔍]     [🎟]     [＋]     [📡]        │  ← 22pt icons
│ Explore  Tickets  Create  Scanner        │  ← 10pt DM Sans
│                                          │  ← bottom safe area
└──────────────────────────────────────────┘
```

**Tab order:** Explore · Tickets · Create · Scanner

---

## Key Components

### Event Card (Explore tab)

- Background: `surface` (`#111111`)
- Border: 1px `rgba(255,255,255,0.08)`
- Border radius: 10px
- Image: full-width top, 16:9 ratio, no radius (clips to card corners)
- Date: Geist Mono 500, 11pt, `#CAFF00`, uppercase, letter-spacing +0.06em
- Title: Clash Grotesk 700, 20pt, white, tracking –0.02em
- Venue: DM Sans 400, 13pt, `#888888`
- Price: Clash Grotesk 600, 16pt, white + Geist Mono 400 12pt `#888888` for fiat estimate
- CTA pill: lime button ("Buy"), right-aligned in footer row

### Ticket Card — Stub-Cut Style (Tickets tab)

- Background: `surface-up` (`#1A1A1A`)
- Border: 1px `rgba(255,255,255,0.08)`
- Border radius: 10px
- **Stub divider:** dashed horizontal line with semicircular notches cut from each side — `::before`/`::after` pseudo-elements with `background: #0A0A0A`, `border-radius: 50%`, offset –8px from each edge. Echoes physical ticket tear line.
- **Main section** (above divider): event name (Clash Grotesk 700, 24pt), location + date (DM Sans 400, 13pt, `#888888`), 2-column metadata grid, status badge
- **Stub section** (below divider): on-chain address in Geist Mono 400, 11pt, `#444444`
- Valid status dot: 8px circle, `#CAFF00` fill, `box-shadow: 0 0 8px #CAFF00`

### QR Ticket View (full-screen modal)

- Full-screen modal, slides up from bottom (spring, 300ms)
- Event banner: full-width image or gradient, 100–120pt tall; event name overlaid in Clash Grotesk 700 white at 28–48pt with text shadow
- QR code container: white background, 160×160px, centered, border-radius 12px
- QR center mark: 12×12px `#CAFF00` square — Tizzle brand mark inside every QR
- Ticket metadata below QR: Clash Grotesk event name, DM Sans date/section, Geist Mono ticket ID
- Valid confirmation bar: lime accent pill at bottom — `rgba(202,255,0,0.12)` fill, `rgba(202,255,0,0.2)` border, lime text ("✓ Valid On-Chain Ticket")

### Bottom Sheet / Modal

- Border radius: 16px top corners, 0 bottom corners
- Background: `#111111`
- Drag handle: 4×32px `rgba(255,255,255,0.2)` pill, centered, 8px from top
- Content padding: `md` (16px) horizontal
- Backdrop: `rgba(0,0,0,0.7)`, tappable to dismiss
- Spring animation up (tension 80, friction 20), ease-in 200ms dismiss

### Scanner View (door staff)

- Full-screen camera viewfinder
- Lime corner markers (4 L-shaped brackets, 2px stroke, `#CAFF00`) at QR target area
- Animated lime scan line: 2s ease-in-out infinite sweep across viewfinder — `background: linear-gradient(to bottom, transparent, #CAFF00, transparent)`
- Active event chip: top-center, surface pill showing event name
- Stats row (bottom): scanned / remaining / capacity in Geist Mono

---

## Motion

- **Approach:** Intentional — motion aids comprehension and signals state changes. No decorative-only animation.
- **Easing:** Enter → `ease-out` · Exit → `ease-in` · Move/reorder → `ease-in-out` · Bottom sheet → spring (tension 80, friction 20)

### Duration Tokens

| Token    | Duration  | Use                                              |
| -------- | --------- | ------------------------------------------------ |
| `micro`  | 80ms      | Button press, tap highlight, tab icon color      |
| `short`  | 200ms     | Tab switch, state transitions, theme toggle      |
| `medium` | 350ms     | Card entrance, bottom sheet open                 |
| `long`   | 500ms     | Full-screen transitions, QR modal open           |

### Key Animations

- **Tab switch:** 200ms content cross-fade. Tab icon/label recolor at `micro` (80ms).
- **Ticket card entrance:** Cards enter with 350ms `opacity 0→1 + translateY(12px→0)`, staggered 50ms per item.
- **Bottom sheet open:** Spring up from bottom (300ms). Dismiss: ease-in 200ms back down.
- **QR screen open:** Full-screen modal slides up (300ms spring). QR fades in after 150ms delay.
- **Check-in confirmed (door staff):** `#34C759` success state, checkmark scales in (200ms spring), lime glow pulse on dot (500ms ease-in-out once).
- **QR scan line:** 2s ease-in-out infinite — lime sweep across QR viewfinder frame.
- **Active event dot (explore):** 2s ease-in-out infinite pulse on `box-shadow` glow.

---

## Screen Map

### Fan Flow

- **Welcome / Onboarding** — splash, Connect Wallet CTA
- **Explore** — event list (featured card + upcoming rows), filter pills, search
- **Event Detail** — event hero poster, info grid, ticket tiers (GA / VIP), pinned "Get Ticket" CTA bottom bar
- **My Tickets** — wallet list of held tickets, validity badges, upcoming / past sections
- **Ticket Detail** — stub-cut ticket artifact, event info grid, on-chain badge, "Show QR" CTA
- **Show QR** — full-screen QR with animated lime scan line, valid confirmation bar

### Organizer Flow

- **Create Event** — form (name, date, time, venue, capacity, ticket price in SOL), "Mint Tickets on Solana" submit
- **Event Created** — success state: tickets minted count, Solana tx hash, "Open Scanner" / "Share" CTAs

### Venue / Door Flow

- **Scanner** — live camera viewfinder with lime corner markers + scan line, active event chip, scanned/remaining/capacity stats
- **Scan Result — Valid** — `#CAFF00` ✓, "Valid Ticket", holder wallet (Geist Mono), timestamp, dismiss
- **Scan Result — Already Used** — `#FF3B30` ✗, "Already Used", original scan time, USED badge

---

## Decisions Log

| Date       | Decision                                            | Rationale                                                                                              |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 2026-03-20 | Chose editorial / high-contrast aesthetic           | Product is about trust + verification. Hard contrast signals reliability. Must look nothing like a DeFi app. |
| 2026-03-20 | Single accent `#CAFF00` — everything else grayscale | One signal = maximum signal. Lime = "valid", "live", "yours". Open lane — no competitor in ticketing or Solana space owns this combination. |
| 2026-03-20 | Clash Grotesk for display                           | Geometric confidence. Not overused. Pairs with the poster direction without feeling like a template.   |
| 2026-03-20 | Geist Mono for all on-chain data                    | Wallet addresses, ticket IDs, hashes need tabular-nums and legibility at 9–11px.                       |
| 2026-03-20 | Solana purple `#9945FF` for chain status            | Borrows Solana brand recognition. Users familiar with the ecosystem read "purple = on-chain confirmed" instantly. |
| 2026-03-26 | Added full mobile navigation spec (header + tab bar)| Persistent UI elements appear on every screen — inconsistent implementation is the most visible design failure. Specs lock in the lime active state, Clash Grotesk large titles, and safe area behavior. |
| 2026-03-26 | Ticket card stub-cut divider                        | Physical ticket metaphor — immediately communicates "this is a ticket" not a token. High-signal decoration. |
| 2026-03-26 | Aggressive display type at 48–80pt for event names  | Most apps cap display at 28–36pt. Large type makes every event feel like a headliner on a poster. Requires truncation logic for long names. |
| 2026-03-26 | Borders as `rgba(255,255,255,0.08)` not opaque hex  | Opaque dark borders look muddy on non-black surfaces. Alpha borders adapt to any surface color and stay invisible. |
