# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React Native / Expo mobile app. Blockchain ticketing on Solana devnet. Three roles: Fan, Organizer, Venue door staff. Hackathon demo scope.

## Commands

```bash
bun run dev          # Start Expo dev server
bun run android      # Run on Android device/emulator
bun run ios          # Run on iOS simulator
bun run lint         # ESLint with auto-fix
bun run lint:check   # ESLint check only
bun run fmt          # Prettier format all files
bun run fmt:check    # Prettier check only
bun run build        # tsc --noEmit + Android prebuild
bun run ci           # Full CI: tsc + lint + fmt + build
```

## Design System

Always read `DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

Key tokens to apply in code:

- Accent: `#CAFF00` (lime)
- Background: `#0A0A0A`
- Surface: `#111111`
- Text: `#FFFFFF` / `#888888`
- Error: `#FF3B30`
- Display font: Clash Grotesk (Fontshare)
- Body font: DM Sans
- Mono font: Geist Mono

## Architecture

### Routing

Expo Router with file-based routing under `app/`.

- `app/(tabs)/` — four tabs: Explore, Tickets, Create, Scanner
- `app/(modals)/` — modal overlays pushed over tabs (event detail, buy ticket, QR, profile)
- `app/_layout.tsx` — root layout; uses `Stack.Protected` to guard authenticated routes
- `app/sign-in.tsx` / `app/onboarding.tsx` — unauthenticated screens

Navigation is driven entirely by auth state from `AuthContext` — no manual `router.push` for auth gating.

### Provider Stack

Providers wrap the app in this order (`components/app-providers.tsx`):

```
AppTheme → QueryClientProvider → ClusterProvider → MobileWalletProvider → AuthProvider
```

### Auth Flow

1. Wallet connect via MWA (`walletSignIn`)
2. `POST /v1/auth/nonce` → returns `{ nonce, message }` — **always use the backend-generated message, never construct it on the client**
3. Sign `message` bytes with wallet
4. `POST /v1/auth/verify` → returns `{ accessToken }` stored in SecureStore
5. No refresh token — on 401, clear token and trigger logout

`apiClient` (`lib/api/client.ts`) attaches `Authorization: Bearer <token>` to every request via request interceptor. On 401 response, tokens are cleared and `_onLogout` callback fires.

### Solana / Blockchain

- **Anchor program**: `lib/solana/program.ts` — initializes the Anchor `Program` instance and exposes PDA derivation helpers
- **Program ID**: `2MxgNvaBj3UQJrKqJbmjbXDyWRjgE3XLmmofofgX7SME` (Devnet)
- **IDL**: `lib/solana/idl.json`
- **PDA seeds**: `organization` → `event` → `registration` / `escrow`

Transaction pattern used in hooks:

1. Build instruction with Anchor
2. Create `VersionedTransaction`
3. Sign with `signTransaction` from MWA
4. Send + confirm on-chain
5. Sync record to backend REST API

### API Layer

All API calls go through `lib/api/client.ts` (Axios, `https://dev-api.tizzle.app`).
Modules: `auth.ts`, `events.ts`, `registrations.ts`, `organizations.ts`, `users.ts`.

Data fetching uses **TanStack React Query** hooks in `hooks/api/`. Mutations for write operations (register, create event, create org, check-in) live in the same directory.

### Storage

`lib/storage.ts` wraps `expo-secure-store`. Only access token is stored (`tizzle_access_token`).

## Code Style

- No semicolons, single quotes, trailing commas, print width 120 (Prettier `.prettierrc`)
- Absolute imports via `@/*` alias (maps to repo root)
- Path aliases: always use `@/` not relative imports across directories

<!-- rtk-instructions v2 -->

@RTK.md
