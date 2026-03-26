# Design System — Tizzle Ticket

## Product Context
- **What this is:** A mobile ticketing app where the QR scan is on-chain verification — no backend, no trust gap
- **Who it's for:** Event organizers (create + issue), fans (hold + show ticket), venue door staff (scan + verify)
- **Space/industry:** Event ticketing × Web3, Solana devnet
- **Project type:** React Native / Expo mobile app (iOS + Android), hackathon demo scope

## Aesthetic Direction
- **Direction:** Editorial / Brutalist
- **Decoration level:** Minimal — typography and contrast do all the work
- **Mood:** Concert poster meets command line. High contrast, zero decoration, electric lime as a single hard signal. Looks nothing like a crypto app.

## Typography
- **Display / UI:** Clash Grotesk — geometric grotesque, confident, no-nonsense; font-weight 600; letter-spacing -0.03em to -0.04em; loaded via Fontshare CDN
- **Body / Labels:** DM Sans — clean, legible at small sizes; font-weight 400/500; line-height 1.65
- **Data / Tables:** Geist Mono — tabular-nums, wallet addresses, ticket IDs, hashes; font-weight 400/500
- **Loading:** Fontshare (Clash Grotesk) + Google Fonts (DM Sans, Geist Mono)
- **Scale:**
  - Hero: 48–96px / 600 / −0.04em
  - Section title: 28–44px / 600 / −0.03em
  - Card title: 16–18px / 600 / −0.02em
  - Body: 15–16px / 400 / 1.65
  - Label/mono: 9–11px / 500 / 0.08–0.12em uppercase

## Color
- **Approach:** Restrained — one accent, maximum signal
- **Primary accent:** #CAFF00 (electric lime) — valid states, CTAs, scan line, active indicators; used sparingly
- **Background:** #0A0A0A — near black, the stage
- **Surface:** #111111 — cards, panels
- **Surface 2:** #161616 — nested elements
- **Border:** #1E1E1E / #2A2A2A — subtle separation
- **Text 1:** #FFFFFF — primary text
- **Text 2:** #888888 — secondary / metadata
- **Text 3:** #444444 — placeholder / disabled
- **Semantic:**
  - success: #CAFF00 (same as accent — valid ticket)
  - error: #FF3B30 — invalid / already used
  - warning: #FFB800 — edge states
  - chain: #9945FF — Solana on-chain status
- **Light mode:** #F5F5F5 bg, #0A0A0A text, #8FB800 accent (desaturated lime)
- **Dark mode strategy:** Default; accent at full #CAFF00 saturation

## Spacing
- **Base unit:** 8px
- **Density:** Compact (mobile-first, information-dense)
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined (strict columns, predictable alignment)
- **Mobile grid:** Single column, 16px horizontal padding
- **Max content width:** 1200px (desktop preview only)
- **Border radius:**
  - sm: 2px (buttons, badges, inputs)
  - md: 4px (cards, panels)
  - lg: 8px (ticket artifact, bottom sheets)
  - full: 9999px (pill chips)
- **Phone frame:** 36px border-radius, 1.5px border #2A2A2A

## Motion
- **Approach:** Minimal-functional — motion earns its place or gets cut
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:**
  - micro: 50–100ms (hover states)
  - short: 150ms (transitions, theme toggle)
  - medium: 250ms (screen transitions)
- **Specific animations:**
  - QR scan line: 2s ease-in-out infinite — lime sweep across QR frame
  - Venue scanner line: 1.6s ease-in-out infinite — faster urgency
  - Active event dot: 2s ease-in-out infinite pulse
  - Theme toggle: 300ms background/color

## Screen Map

**Fan flow:**
- Welcome — onboarding splash, Connect Wallet CTA
- Explore — browse events list (featured card + upcoming rows), search
- Event Detail — event hero poster, info grid, ticket tiers (GA / VIP), pinned "Get Ticket" CTA
- My Tickets — wallet list of held tickets, validity badges
- Ticket Detail — ticket artifact with perforated edge, event info grid, on-chain badge, Show QR CTA
- Show QR — full-screen QR with animated lime scan line

**Organizer flow:**
- Create Event — form (name, date, time, venue, capacity), "Mint Tickets on Solana" submit
- Event Created — success state: tickets minted count, Solana tx hash, Open Scanner / Share CTAs

**Venue / Door flow:**
- Scanner — live camera viewfinder with lime corner markers + scan line, active event chip, scanned/remaining/capacity stats
- Scan Result Valid — green ✓, confirmed on-chain, holder wallet, timestamp
- Scan Result Already Used — red ✗, original scan time, USED badge

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-20 | Chose Editorial/Brutalist aesthetic | Product is about trust + verification, not collectibles. Hard contrast signals reliability. Needs to look nothing like a DeFi app. |
| 2026-03-20 | Single accent color #CAFF00 | One signal = maximum signal. Lime = "valid". Everything else is black or white. |
| 2026-03-20 | Clash Grotesk for display | Geometric confidence. Not overused. Pairs with the brutalist direction without feeling like a template. |
| 2026-03-20 | Geist Mono for data | Wallet addresses, ticket IDs, hashes all need tabular-nums and legibility at 9–11px. |
| 2026-03-20 | Solana purple #9945FF for chain status | Borrowing brand recognition. Users familiar with Solana ecosystem will read "purple = on-chain confirmed" instantly. |
| 2026-03-20 | Added Explore + Event Detail screens | Fan discovery flow (browse → event detail → get ticket) is core to the product. Without it the app starts at "My Tickets" with nothing in it. |
| 2026-03-20 | Bottom nav: Explore / Tickets / Profile | Explore is the entry point for new fans; Tickets is the return destination after purchase. Three tabs keeps it simple. |
