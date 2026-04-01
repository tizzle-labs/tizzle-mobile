# Tizzle — UI Design Spec

_Date: 2026-03-26_

## Overview

React Native / Expo mobile app for blockchain event ticketing on Solana devnet. Three user roles (Fan, Organizer, Venue Door Staff) coexist in a single app — no role switching, all flows always accessible. Design system: Editorial/Brutalist (DESIGN.md).

---

## Navigation Structure

4-tab bottom nav, always visible:

| Tab     | Icon   | Purpose                  |
| ------- | ------ | ------------------------ |
| Explore | grid   | Browse + discover events |
| Tickets | ticket | My registrations         |
| Create  | +      | Organizer flow           |
| Scanner | scan   | Door staff check-in      |

### Route Map (Expo Router)

```
app/
  sign-in.tsx                      # Wallet connect screen
  onboarding.tsx                   # Display name prompt (skippable)
  (tabs)/
    explore/
      index.tsx                    # Events list + search
    tickets/
      index.tsx                    # My registrations list
      [registrationPda].tsx        # Ticket detail + Show QR
    create/
      index.tsx                    # Create org (if none) or event form
    scanner/
      index.tsx                    # Camera viewfinder
      result.tsx                   # Scan result (valid / already used)
  (modals)/
    event/[eventPda].tsx           # Event detail
    buy-ticket/[eventPda].tsx      # Deposit & register flow
    qr/[registrationPda].tsx       # Full-screen QR display
    profile/index.tsx              # User profile
```

### Auth Flow

1. No wallet connected → `sign-in`
2. Wallet connected, no backend `username` → `onboarding` (skippable)
3. Both done → land on `explore`

---

## Data Layer

### Auth

- Mobile Wallet Adapter (MWA) for wallet sign-in
- After MWA connect: GET `/v1/auth/nonce` → sign message → POST `/v1/auth/verify` → JWT stored in SecureStore
- JWT auto-injected into all REST calls via axios interceptor

### REST API

Base URL: `https://dev-api.tizzle.app`

Key hooks (React Query):

| Hook                      | Endpoint                          | Purpose                   |
| ------------------------- | --------------------------------- | ------------------------- |
| `useEvents()`             | GET /v1/events                    | Explore list              |
| `useEventDetail(pda)`     | GET /v1/events/:pda               | Event detail modal        |
| `useMyRegistrations()`    | GET /v1/registrations?attendee=me | Tickets tab               |
| `useMyOrganizations()`    | GET /v1/organizations?owner=me    | Create tab check          |
| `useCreateOrganization()` | POST /v1/organizations            | Org creation mutation     |
| `useCreateEvent()`        | POST /v1/events                   | Event creation mutation   |
| `useRegisterEvent()`      | POST /v1/registrations            | Registration mutation     |
| `useCheckIn(pda)`         | PUT /v1/registrations/:pda        | Scanner check-in mutation |

### On-chain (Anchor / Solana)

- Program IDL loaded into `useTizzleProgram()`
- MWA (`useMobileWallet()`) signs all transactions

| Action       | Instruction             | Who calls it         |
| ------------ | ----------------------- | -------------------- |
| Create org   | `create_organization`   | Organizer            |
| Create event | `create_event`          | Organizer            |
| Buy ticket   | `register_event`        | Fan (stakes SOL/SPL) |
| Check-in     | Backend only (REST PUT) | Scanner              |

### Two-Step Mutations

**Buy Ticket:**

1. `register_event` on-chain via MWA → tx signature
2. POST `/v1/registrations` with `{ eventPda, transactionSignature }`
3. Invalidate `useMyRegistrations()`

**Create Event:**

1. `create_organization` on-chain (if needed) → POST `/v1/organizations`
2. `create_event` on-chain → POST `/v1/events` with metadata + tx signature
3. Invalidate `useMyOrganizations()`, navigate to success screen

---

## Screen Designs

### `sign-in`

- Full dark screen (#0A0A0A)
- "TIZZLE" in Clash Grotesk hero (96px, -0.04em)
- Tagline in DM Sans body
- Lime "CONNECT WALLET" button pinned to bottom

### `onboarding`

- "WHAT SHOULD WE CALL YOU?" section title
- Single DM Sans text input
- "Skip" text link (secondary) + "CONTINUE" lime button

### Explore tab (`explore/index`)

- Header: "EXPLORE" label (Clash Grotesk 28px) + search icon
- Featured card: full-width, tall, event image with gradient overlay, title + date overlay
- "UPCOMING" section label (Geist Mono uppercase 10px)
- Vertical list: compact event rows — thumbnail, title (Clash Grotesk 16px), date (DM Sans), category chip (pill)
- Tap any → pushes `event/[eventPda]` modal

### Event Detail modal (`(modals)/event/[eventPda]`)

- Hero image full-width, close/back button overlay
- Event title (Clash Grotesk), org name (DM Sans secondary)
- Info grid (Geist Mono): date, time, location, capacity
- Stake chip: lime if SOL, #9945FF if SPL token
- Status badge: AVAILABLE / ONGOING / ENDED / SETTLEMENT / CLOSED
- Bottom CTA: "GET TICKET" lime button → pushes `buy-ticket/[eventPda]`
- If already registered: "REGISTERED ✓" badge replaces CTA

### Buy Ticket screen (`(modals)/buy-ticket/[eventPda]`)

- Event title + date summary at top
- **Stake section** (Surface card):
  - Token amount + symbol in Clash Grotesk (e.g. "0.5 SOL")
  - Wallet balance below in DM Sans secondary
  - Token mint address in Geist Mono (for SPL tokens)
- Fee breakdown: stake amount + platform fee
- Insufficient balance: button disabled, red warning "Insufficient [TOKEN] balance"
- "DEPOSIT & REGISTER" lime button
- Loading state: "Confirming on Solana…" with spinner
- On success: replace with Ticket Detail

### Tickets tab (`tickets/index`)

- "MY TICKETS" header
- List of ticket cards: event name, date, validity badge:
  - Lime "VALID" — registered, not checked in, event not ended
  - Red "USED" — checked_in = true
  - Grey "UPCOMING" — event hasn't started
  - Yellow "ENDED" — event ended, not checked in
- Empty state: "No tickets yet. Explore events →"
- Tap → `tickets/[registrationPda]`

### Ticket Detail (`tickets/[registrationPda]`)

- Perforated-edge ticket artifact card (dashed border top/bottom)
- Event name, org, date/time in Clash Grotesk + DM Sans
- Registration PDA + tx hash in Geist Mono 9px
- Solana purple on-chain badge "ON-CHAIN VERIFIED"
- "SHOW QR" lime button → pushes `qr/[registrationPda]` modal

### QR modal (`(modals)/qr/[registrationPda]`)

- Full-screen dark
- QR code centered (registration PDA encoded)
- Animated lime scan line sweeping across: 2s ease-in-out infinite
- "Tap to dismiss" caption in DM Sans secondary

### Create tab (`create/index`)

- **If no org:** prompt card "Create your organization to start hosting events" + "CREATE ORG" lime button → inline form (name, description, image upload)
- **If org exists:** event creation form:
  - Title, description, image upload
  - Date picker, start/end time
  - Capacity (number input)
  - Stake amount + token selector (SOL default, SPL token option)
  - Gatekeeper wallet address (optional, defaults to organizer)
- "MINT ON SOLANA" lime submit button
- **Success screen:** "TICKETS MINTED" heading, event name, tx hash in Geist Mono, scanned/capacity stats, "OPEN SCANNER" + "SHARE" CTAs

### Scanner tab (`scanner/index`)

- Camera viewfinder full-screen
- Lime corner markers on scan frame
- Animated lime scan line: 1.6s ease-in-out infinite
- Top chip: active event name being scanned (if set)
- Stats bar: `SCANNED 12 / REMAINING 38 / CAPACITY 50` in Geist Mono
- Event selector: tap chip to choose which event to scan for

### Scan Result (`scanner/result`)

- **Valid:** Full-screen lime background, large "✓", "CHECK-IN CONFIRMED" (Clash Grotesk), holder wallet (Geist Mono), timestamp
- **Already used:** Full-screen red (#FF3B30) background, large "✗", "ALREADY USED", original check-in timestamp, "USED" badge

---

## Component Architecture

```
components/
  ui/
    Button.tsx          # variant: primary (lime) | secondary | ghost | danger
    Badge.tsx           # variant: valid | used | upcoming | onchain | chain
    Card.tsx            # surface card wrapper (4px radius)
    TicketArtifact.tsx  # perforated-edge ticket card
    ScanFrame.tsx       # corner markers + animated scan line
    TokenAmount.tsx     # amount + symbol, handles SOL vs SPL display
    InfoGrid.tsx        # mono-font key/value grid rows
    SolanaStatusBadge.tsx  # purple "ON-CHAIN VERIFIED" badge
  event/
    EventCard.tsx       # featured (tall) + compact (row) variants
    EventStatusChip.tsx # AVAILABLE / ONGOING / ENDED etc.
    StakeChip.tsx       # lime (SOL) or purple (SPL) stake display
  wallet/
    WalletBalance.tsx   # current balance for a token mint
  layout/
    ScreenHeader.tsx    # tab headers (Clash Grotesk label + actions)
```

---

## Design Tokens Applied in Code

```ts
const colors = {
  bg: '#0A0A0A',
  surface: '#111111',
  surface2: '#161616',
  border: '#1E1E1E',
  border2: '#2A2A2A',
  accent: '#CAFF00',
  text1: '#FFFFFF',
  text2: '#888888',
  text3: '#444444',
  error: '#FF3B30',
  warning: '#FFB800',
  chain: '#9945FF',
}

const fonts = {
  display: 'ClashGrotesk-Semibold',
  body: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',
  mono: 'GeistMono-Regular',
  monoMedium: 'GeistMono-Medium',
}
```

---

## Key Decisions

| Decision                            | Rationale                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| 4-tab nav, all roles always visible | Hackathon demo benefits from all flows being immediately accessible                        |
| Buy Ticket as dedicated screen      | Staking is a significant financial action — needs explicit confirmation with balance check |
| Scanner calls REST only             | On-chain check_in requires gatekeeper server wallet; mobile app doesn't hold that key      |
| Register Event = on-chain + REST    | On-chain tx is the source of truth; REST indexes it for fast querying                      |
| Create Event = on-chain + REST      | Same pattern — program is authoritative, backend indexes metadata                          |
| JWT via nonce/verify                | Backend needs authenticated identity separate from on-chain signing                        |
