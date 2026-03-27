# Ticket Lifecycle — Design Spec
Date: 2026-03-27

## Background

The current ticket flows cover registration, QR display, and check-in. The on-chain Anchor program (`2MxgNvaBj3UQJrKqJbmjbXDyWRjgE3XLmmofofgX7SME`) already exposes `refund_stake` and `withdraw_earnings` instructions, and the `Registration` model already carries `refunded` / `refundedAt` fields. The UI does not yet surface any post-event state or actions.

## Scope

- Fan-side: stake reclaim flow, no-show display, cancellation locked state, full badge lifecycle
- Organizer-side: withdraw no-show earnings from event detail modal
- No new screens or routes — everything lives within existing screens

## State Machine

`TicketStatus` is a pure derivation from `registration + event + Date.now()`:

```
if refunded                              → 'refunded'
if checkedIn && now >= unlockTime        → 'claimable'
if checkedIn && now < unlockTime         → 'used'
if !checkedIn && now >= endTime          → 'no-show'
if !checkedIn && now < endTime           → 'valid'
// 'cancelled' reserved as badge variant for future organizer cancellation
```

Precedence matters: `refunded` is always checked first.

A pure utility function `deriveTicketStatus(registration, event, now)` is shared between the hook and the tickets list. It has no side effects and can be used anywhere.

## Hook Architecture

### `useTicketLifecycle(registration, event)`
Fan-side hook. Returns:
```ts
{
  status: TicketStatus
  claimRefund: () => Promise<void>
  isClaimingRefund: boolean
}
```

`claimRefund` executes the full transaction pattern:
1. Build `refund_stake` instruction via Anchor
2. Create `VersionedTransaction`
3. `signAndSendTransactions` via MWA
4. `confirmTransaction` on-chain
5. `PUT /v1/registrations/:pda` with `{ refunded: true }` to sync backend
6. Invalidate `registrationKeys.my`

### `useWithdrawEarnings(event)`
Organizer-side hook. Returns:
```ts
{
  canWithdraw: boolean  // now >= unlockTime && !event.organizerWithdrawn
  withdrawEarnings: () => Promise<void>
  isWithdrawing: boolean
}
```

`withdrawEarnings` executes:
1. Build `withdraw_earnings` instruction via Anchor
2. Create `VersionedTransaction`
3. `signAndSendTransactions` via MWA
4. `confirmTransaction` on-chain
5. No backend sync (organizer wallet signs, no registration record to update)

## API Layer Changes

**`lib/api/registrations.ts`** — add:
```ts
updateRegistrationRefunded(registrationPda: string): Promise<Registration>
// PUT /v1/registrations/:pda  →  { refunded: true }
```

**`lib/api/events.ts`** — extend `Event` type with:
```ts
organizerWithdrawn: boolean
organizerAddress: string
```

No other backend changes. The backend already tracks `refunded` / `refundedAt` on `Registration`.

## UI Changes

### `components/ui/Badge.tsx`
Add 4 new variants:
| Variant | Color | Meaning |
|---------|-------|---------|
| `claimable` | `#CAFF00` (accent) | Checked in, unlock window open, not yet claimed |
| `refunded` | `#4CAF50` (muted green) | Stake successfully claimed |
| `no-show` | `#FF3B30` (error) | Event ended, attendee did not check in |
| `cancelled` | `#888888` (grey) | Reserved — not reachable in current flows |

### `app/(tabs)/tickets/index.tsx`
Replace `ticketBadgeVariant` with `deriveTicketStatus`. The list now shows all 6 badge states.

### `app/(tabs)/tickets/[registrationPda].tsx`
Consume `useTicketLifecycle`. Replace hardcoded `badgeVariant` logic.

Contextual bottom actions per state:
| Status | Action |
|--------|--------|
| `valid` | "Show QR" button + disabled "Cannot Cancel" note explaining the contract locks the ticket |
| `used` | No action. Show check-in timestamp. |
| `claimable` | Primary "Claim Stake" button |
| `refunded` | No action. Show refunded timestamp. |
| `no-show` | No action. Text: "You did not check in. Your stake was forfeited." |
| `cancelled` | No action. Reserved. |

### `app/(modals)/event/[eventPda].tsx`
Add organizer-only section at bottom of event detail, visible when:
- `walletAddress === event.organizerAddress`
- `now >= event.unlockTime`

Shows:
- No-show count (`totalRegistered - totalCheckedIn`)
- Estimated claimable amount (no-shows × `stakeAmount`, accounting for `hostFeePercent`)
- "Withdraw Earnings" button (disabled if `event.organizerWithdrawn`)
- Loading/success state after withdrawal

## Files Created / Modified

| File | Change |
|------|--------|
| `hooks/api/use-ticket-lifecycle.ts` | New — state machine + claimRefund |
| `hooks/api/use-withdraw-earnings.ts` | New — organizer withdrawal |
| `lib/ticket-status.ts` | New — pure `deriveTicketStatus` util |
| `lib/api/registrations.ts` | Add `updateRegistrationRefunded` |
| `lib/api/events.ts` | Add `organizerWithdrawn`, `organizerAddress` to `Event` type |
| `components/ui/Badge.tsx` | Add 4 new variants |
| `app/(tabs)/tickets/index.tsx` | Use `deriveTicketStatus` |
| `app/(tabs)/tickets/[registrationPda].tsx` | Consume `useTicketLifecycle`, contextual CTAs |
| `app/(modals)/event/[eventPda].tsx` | Organizer withdrawal section |
