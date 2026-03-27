# Ticket Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full ticket lifecycle — refund/stake reclaim, no-show display, cancellation locked state, and organizer earnings withdrawal — across fan and organizer flows.

**Architecture:** A central `useTicketLifecycle` hook owns fan-side state derivation and the `claimRefund` on-chain action. A separate `useWithdrawEarnings` hook owns the organizer withdrawal. A pure `deriveTicketStatus` utility is shared between both hooks and the tickets list. All UI changes live within existing screens — no new routes.

**Tech Stack:** React Native / Expo Router, TanStack React Query, Anchor (`@coral-xyz/anchor`), Solana Web3.js, Mobile Wallet Adapter (`@wallet-ui/react-native-web3js`)

---

### Task 1: Pure ticket status utility

**Files:**
- Create: `lib/ticket-status.ts`

- [ ] **Step 1: Create `lib/ticket-status.ts`**

```ts
import type { Registration } from '@/lib/api/registrations'
import type { Event } from '@/lib/api/events'

export type TicketStatus = 'valid' | 'used' | 'claimable' | 'refunded' | 'no-show' | 'cancelled'

export function deriveTicketStatus(
  registration: Pick<Registration, 'checkedIn' | 'refunded'>,
  event: Pick<Event, 'endTime' | 'unlockTime'>,
  now: number = Date.now(),
): TicketStatus {
  if (registration.refunded) return 'refunded'
  const unlockMs = new Date(event.unlockTime).getTime()
  const endMs = new Date(event.endTime).getTime()
  if (registration.checkedIn && now >= unlockMs) return 'claimable'
  if (registration.checkedIn) return 'used'
  if (now >= endMs) return 'no-show'
  return 'valid'
}
```

- [ ] **Step 2: Lint and verify**

```bash
bun run lint:check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add lib/ticket-status.ts
rtk git commit -m "feat: add deriveTicketStatus pure utility"
```

---

### Task 2: Extend Badge variants

**Files:**
- Modify: `components/ui/Badge.tsx`

- [ ] **Step 1: Read the current `components/ui/Badge.tsx`** (verify it hasn't changed)

- [ ] **Step 2: Add 4 new variants to `BadgeVariant` type and `CONFIG`**

Replace the `BadgeVariant` type declaration:
```ts
type BadgeVariant =
  | 'valid'
  | 'used'
  | 'upcoming'
  | 'onchain'
  | 'ended'
  | 'available'
  | 'ongoing'
  | 'settlement'
  | 'closed'
  | 'claimable'
  | 'refunded'
  | 'no-show'
  | 'cancelled'
```

Add to `CONFIG` after the `closed` entry:
```ts
claimable: { bg: Colors.accent, color: Colors.bg, label: 'CLAIMABLE' },
refunded: { bg: Colors.success, color: Colors.bg, label: 'REFUNDED' },
'no-show': { bg: Colors.error, color: Colors.text1, label: 'NO-SHOW' },
cancelled: { bg: Colors.surface2, color: Colors.text3, label: 'CANCELLED' },
```

- [ ] **Step 3: Lint and verify**

```bash
bun run lint:check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
rtk git add components/ui/Badge.tsx
rtk git commit -m "feat: add claimable, refunded, no-show, cancelled badge variants"
```

---

### Task 3: API layer additions

**Files:**
- Modify: `lib/api/registrations.ts`
- Modify: `lib/api/events.ts`

- [ ] **Step 1: Add `updateRegistrationRefunded` to `lib/api/registrations.ts`**

Append after `checkInRegistration`:
```ts
export async function updateRegistrationRefunded(registrationPda: string): Promise<Registration> {
  const { data } = await apiClient.put(`/v1/registrations/${registrationPda}`, {
    refunded: true,
  })
  return data
}
```

- [ ] **Step 2: Extend the `Event` interface in `lib/api/events.ts`**

Add these two fields to the `Event` interface after `totalCheckedIn`:
```ts
  organizerAddress: string
  organizerWithdrawn: boolean
```

- [ ] **Step 3: Lint and verify**

```bash
bun run lint:check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
rtk git add lib/api/registrations.ts lib/api/events.ts
rtk git commit -m "feat: add updateRegistrationRefunded and extend Event type"
```

---

### Task 4: `useTicketLifecycle` hook

**Files:**
- Create: `hooks/api/use-ticket-lifecycle.ts`

This hook derives the current `TicketStatus` and owns the `refund_stake` on-chain transaction (Anchor method name: `refundStake`).

- [ ] **Step 1: Create `hooks/api/use-ticket-lifecycle.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PublicKey, TransactionMessage, VersionedTransaction, SystemProgram } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { updateRegistrationRefunded } from '@/lib/api/registrations'
import { registrationKeys } from './use-my-registrations'
import { deriveRegistrationPda, deriveEscrowVaultPda } from '@/lib/solana/program'
import { deriveTicketStatus, type TicketStatus } from '@/lib/ticket-status'
import { SOL_MINT } from '@/components/ui/TokenAmount'
import type { Registration } from '@/lib/api/registrations'
import type { Event } from '@/lib/api/events'

export function useTicketLifecycle(registration: Registration | undefined, event: Event | undefined) {
  const { connection, accounts, signAndSendTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  const status: TicketStatus =
    registration && event ? deriveTicketStatus(registration, event) : 'valid'

  const { mutateAsync: claimRefund, isPending: isClaimingRefund } = useMutation({
    mutationFn: async () => {
      if (!registration || !event) throw new Error('Missing registration or event')
      const walletAddress = accounts?.[0]?.address?.toString()
      if (!walletAddress) throw new Error('Wallet not connected')

      const attendeePubkey = new PublicKey(walletAddress)
      const eventPdaPubkey = new PublicKey(event.eventPda)
      const registrationPda = deriveRegistrationPda(eventPdaPubkey, attendeePubkey)
      const escrowVault = deriveEscrowVaultPda(eventPdaPubkey)
      const organizationTreasury = new PublicKey(event.organizerAddress)
      const isSOL = event.stakeTokenMint === SOL_MINT

      const ixAccounts = {
        event: eventPdaPubkey,
        registration: registrationPda,
        escrowVault,
        attendeeTokenAccount: isSOL ? attendeePubkey : attendeePubkey,
        escrowTokenAccount: escrowVault,
        organizationTreasuryTokenAccount: organizationTreasury,
        tokenMint: isSOL ? SystemProgram.programId : new PublicKey(event.stakeTokenMint),
        attendee: attendeePubkey,
        organizationTreasury,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      }

      const ix = await (program as any).methods.refundStake().accounts(ixAccounts).instruction()

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: attendeePubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToLegacyMessage()

      const tx = new VersionedTransaction(message)
      const signature = await signAndSendTransactions(tx, minContextSlot)
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      await updateRegistrationRefunded(registration.registrationPda)
      return { signature }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registrationKeys.my })
    },
  })

  return { status, claimRefund, isClaimingRefund }
}
```

- [ ] **Step 2: Lint and verify**

```bash
bun run lint:check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add hooks/api/use-ticket-lifecycle.ts
rtk git commit -m "feat: add useTicketLifecycle hook with refundStake on-chain action"
```

---

### Task 5: `useWithdrawEarnings` hook

**Files:**
- Create: `hooks/api/use-withdraw-earnings.ts`

This hook owns the organizer's `withdraw_earnings` on-chain transaction (Anchor method name: `withdrawEarnings`). No backend sync needed — the organizer wallet signs and the on-chain state is the source of truth.

- [ ] **Step 1: Create `hooks/api/use-withdraw-earnings.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PublicKey, TransactionMessage, VersionedTransaction, SystemProgram } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { useTizzleProgram } from '@/hooks/solana/use-tizzle-program'
import { eventKeys } from './use-events'
import { deriveEscrowVaultPda } from '@/lib/solana/program'
import { SOL_MINT } from '@/components/ui/TokenAmount'
import type { Event } from '@/lib/api/events'

export function useWithdrawEarnings(event: Event | undefined) {
  const { connection, accounts, signAndSendTransactions } = useMobileWallet()
  const program = useTizzleProgram()
  const queryClient = useQueryClient()

  const canWithdraw =
    !!event &&
    !event.organizerWithdrawn &&
    Date.now() >= new Date(event.unlockTime).getTime()

  const { mutateAsync: withdrawEarnings, isPending: isWithdrawing } = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('Missing event')
      const walletAddress = accounts?.[0]?.address?.toString()
      if (!walletAddress) throw new Error('Wallet not connected')

      const organizerPubkey = new PublicKey(walletAddress)
      const eventPdaPubkey = new PublicKey(event.eventPda)
      const escrowVault = deriveEscrowVaultPda(eventPdaPubkey)
      const organizationTreasury = new PublicKey(event.organizerAddress)
      const isSOL = event.stakeTokenMint === SOL_MINT

      const ixAccounts = {
        event: eventPdaPubkey,
        escrowVault,
        escrowTokenAccount: escrowVault,
        organizationTreasuryTokenAccount: organizationTreasury,
        tokenMint: isSOL ? SystemProgram.programId : new PublicKey(event.stakeTokenMint),
        organizer: organizerPubkey,
        organizationTreasury,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      }

      const ix = await (program as any).methods.withdrawEarnings().accounts(ixAccounts).instruction()

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await connection.getLatestBlockhashAndContext()

      const message = new TransactionMessage({
        payerKey: organizerPubkey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToLegacyMessage()

      const tx = new VersionedTransaction(message)
      const signature = await signAndSendTransactions(tx, minContextSlot)
      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      return { signature }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(event!.eventPda) })
    },
  })

  return { canWithdraw, withdrawEarnings, isWithdrawing }
}
```

- [ ] **Step 2: Lint and verify**

```bash
bun run lint:check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add hooks/api/use-withdraw-earnings.ts
rtk git commit -m "feat: add useWithdrawEarnings hook for organizer no-show settlement"
```

---

### Task 6: Update tickets list

**Files:**
- Modify: `app/(tabs)/tickets/index.tsx`

Replace the hardcoded `ticketBadgeVariant` function with `deriveTicketStatus`. The tickets list doesn't have event data per row (only registration data), so derive status from registration fields only — events are not fetched on the list screen. Use a simplified inline derivation that works without `event`.

- [ ] **Step 1: Update `app/(tabs)/tickets/index.tsx`**

Replace the import block at the top. Add the `deriveTicketStatus` import and `TicketStatus` type:
```ts
import { deriveTicketStatus, type TicketStatus } from '@/lib/ticket-status'
import type { Event } from '@/lib/api/events'
```

Replace the `ticketBadgeVariant` function with a version that works without a full event object. On the list, we don't have `endTime` / `unlockTime`, so derive a best-effort status using sentinel dates:

```ts
function ticketBadgeVariant(reg: Registration): TicketStatus {
  // Without event timing data, fall back to checked-in/refunded flags only
  if (reg.refunded) return 'refunded'
  if (reg.checkedIn) return 'used'
  return 'valid'
}
```

Update `TicketRow` to accept `TicketStatus` from `Badge`:
```ts
function TicketRow({ registration }: { registration: Registration }) {
  const badgeVariant = ticketBadgeVariant(registration)
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(tabs)/tickets/${registration.registrationPda}`)}
      activeOpacity={0.8}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.rowPda} numberOfLines={1} ellipsizeMode="middle">
          {registration.registrationPda}
        </Text>
        <Text style={styles.rowDate}>
          {new Date(registration.registeredAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
      <Badge variant={badgeVariant} />
    </TouchableOpacity>
  )
}
```

Remove the unused `Event` import if it was added in this step.

- [ ] **Step 2: Lint and verify**

```bash
bun run lint:check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add app/(tabs)/tickets/index.tsx
rtk git commit -m "feat: update ticket list badge to use TicketStatus type"
```

---

### Task 7: Update ticket detail screen

**Files:**
- Modify: `app/(tabs)/tickets/[registrationPda].tsx`

Consume `useTicketLifecycle`. Replace the hardcoded `badgeVariant` computation. Show contextual CTAs per state.

- [ ] **Step 1: Replace `app/(tabs)/tickets/[registrationPda].tsx`** with the following full file:

```tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TicketArtifact } from '@/components/ui/TicketArtifact'
import { SolanaStatusBadge } from '@/components/ui/SolanaStatusBadge'
import { Badge } from '@/components/ui/Badge'
import { InfoGrid } from '@/components/ui/InfoGrid'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { useEventDetail } from '@/hooks/api/use-event-detail'
import { useTicketLifecycle } from '@/hooks/api/use-ticket-lifecycle'

export default function TicketDetail() {
  const { registrationPda } = useLocalSearchParams<{ registrationPda: string }>()
  const { data: registrations, isLoading: regLoading } = useMyRegistrations()
  const registration = registrations?.find((r) => r.registrationPda === registrationPda)

  const { data: event, isLoading: eventLoading } = useEventDetail(registration?.eventPda ?? '')
  const { status, claimRefund, isClaimingRefund } = useTicketLifecycle(registration, event)

  if (regLoading || eventLoading || !registration) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  const onChainRows = [
    { label: 'Registration PDA', value: registration.registrationPda, mono: true },
    { label: 'Tx Hash', value: registration.transactionSignature, mono: true },
    {
      label: 'Staked',
      value: event
        ? `${Number(registration.stakeAmount) / Math.pow(10, event.stakeTokenDecimals)} ${event.stakeTokenSymbol}`
        : registration.stakeAmount,
    },
    {
      label: 'Registered',
      value: new Date(registration.registeredAt).toLocaleString(),
    },
    ...(registration.checkedInAt
      ? [{ label: 'Checked In', value: new Date(registration.checkedInAt).toLocaleString() }]
      : []),
    ...(registration.refundedAt
      ? [{ label: 'Refunded', value: new Date(registration.refundedAt).toLocaleString() }]
      : []),
  ]

  async function handleClaimRefund() {
    try {
      await claimRefund()
    } catch (e: any) {
      Alert.alert('Claim Failed', e?.message ?? 'Something went wrong')
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← TICKETS</Text>
          </TouchableOpacity>
          <Badge variant={status} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <TicketArtifact
          eventTitle={event?.title ?? 'Loading…'}
          eventDate={
            event
              ? new Date(event.startTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                })
              : ''
          }
          location={event?.location ?? ''}
          registrationPda={registrationPda}
        >
          <SolanaStatusBadge />
        </TicketArtifact>

        <Card>
          <InfoGrid rows={onChainRows} />
        </Card>

        {status === 'valid' && (
          <>
            <Button onPress={() => router.push(`/(modals)/qr/${registrationPda}`)}>Show QR</Button>
            <View style={styles.cancelNote}>
              <Text style={styles.cancelText}>
                Tickets cannot be cancelled — your stake is locked on-chain until the event ends.
              </Text>
            </View>
          </>
        )}

        {status === 'claimable' && (
          <Button onPress={handleClaimRefund} loading={isClaimingRefund}>
            {isClaimingRefund ? 'Claiming on Solana…' : 'Claim Stake'}
          </Button>
        )}

        {status === 'no-show' && (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              You did not check in to this event. Your staked amount has been forfeited.
            </Text>
          </Card>
        )}

        {status === 'refunded' && (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeText}>Your stake has been successfully returned to your wallet.</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: ls(11, LS.labelNarrow),
    textTransform: 'uppercase',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  cancelNote: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs ?? 6,
  },
  cancelText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text3,
    textAlign: 'center',
    lineHeight: 20,
  },
  noticeCard: { padding: Spacing.md },
  noticeText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    lineHeight: 22,
    textAlign: 'center',
  },
})
```

> **Note:** `Spacing.xs` may not exist — check `constants/spacing.ts`. If missing, replace `Spacing.xs ?? 6` with `6`.

- [ ] **Step 2: Verify `Spacing.xs` exists in `constants/spacing.ts`**

Run:
```bash
rtk grep "xs" constants/spacing.ts
```

If it does not exist, replace `Spacing.xs ?? 6` with `6` in the file.

- [ ] **Step 3: Lint and verify**

```bash
bun run lint:check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
rtk git add "app/(tabs)/tickets/[registrationPda].tsx"
rtk git commit -m "feat: add full ticket lifecycle UI with contextual CTAs"
```

---

### Task 8: Organizer withdrawal section in event detail modal

**Files:**
- Modify: `app/(modals)/event/[eventPda].tsx`

Add an organizer-only section at the bottom of the event detail modal. Visible when `walletAddress === event.organizerAddress` and `now >= event.unlockTime`. Shows no-show count and a "Withdraw Earnings" button.

- [ ] **Step 1: Add imports at the top of `app/(modals)/event/[eventPda].tsx`**

Add after existing imports:
```ts
import { useAuth } from '@/components/auth/auth-provider'
import { useWithdrawEarnings } from '@/hooks/api/use-withdraw-earnings'
```

- [ ] **Step 2: Add hook calls inside `EventDetailModal`, after the `isRegistered` line**

```ts
const { walletAddress } = useAuth()
const { canWithdraw, withdrawEarnings, isWithdrawing } = useWithdrawEarnings(event)

const isOrganizer = !!walletAddress && !!event && walletAddress === event.organizerAddress
const noShowCount = event ? event.totalRegistered - event.totalCheckedIn : 0
```

- [ ] **Step 3: Add the withdrawal section inside the `<View style={styles.content}>` block, after the `<Card style={styles.infoCard}>` closing tag**

```tsx
{isOrganizer && (
  <Card>
    <Text style={styles.sectionLabel}>ORGANIZER SETTLEMENT</Text>
    <View style={styles.settlementRow}>
      <Text style={styles.settlementKey}>No-shows</Text>
      <Text style={styles.settlementValue}>{noShowCount}</Text>
    </View>
    {canWithdraw ? (
      <Button
        onPress={async () => {
          try {
            await withdrawEarnings()
          } catch (e: any) {
            Alert.alert('Withdrawal Failed', e?.message ?? 'Something went wrong')
          }
        }}
        loading={isWithdrawing}
      >
        {isWithdrawing ? 'Withdrawing…' : 'Withdraw Earnings'}
      </Button>
    ) : event?.organizerWithdrawn ? (
      <Text style={styles.settlementNote}>Earnings already withdrawn.</Text>
    ) : (
      <Text style={styles.settlementNote}>
        Available after{' '}
        {event ? new Date(event.unlockTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
      </Text>
    )}
  </Card>
)}
```

- [ ] **Step 4: Add `Alert` to the React Native import list at the top of the file**

The existing import is:
```ts
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
```

Change to:
```ts
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
```

- [ ] **Step 5: Add new styles to the `StyleSheet.create` call**

Append after the last style entry (`registeredBadge`):
```ts
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  settlementKey: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
  },
  settlementValue: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.text1,
  },
  settlementNote: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text3,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
```

- [ ] **Step 6: Lint and verify**

```bash
bun run lint:check
```

Expected: no errors.

- [ ] **Step 7: Full type check**

```bash
bun run build
```

Expected: exits cleanly (tsc reports 0 errors).

- [ ] **Step 8: Commit**

```bash
rtk git add "app/(modals)/event/[eventPda].tsx"
rtk git commit -m "feat: add organizer withdrawal section to event detail modal"
```

---

## Self-Review

**Spec coverage:**
- [x] Refund/stake reclaim → Task 4 (`useTicketLifecycle`) + Task 7 (Claim Stake button)
- [x] Unlock flow after event completion → `deriveTicketStatus` gates `claimable` on `unlockTime`
- [x] Cancellation locked state → Task 7 (disabled "Cannot Cancel" note under `valid`)
- [x] No-show handling → Task 7 (notice card under `no-show`)
- [x] Post-event settlement state → Task 2 (badge variants) + Task 7 (all states displayed)
- [x] Organizer withdrawal → Task 5 (`useWithdrawEarnings`) + Task 8 (event modal section)
- [x] Full 6-variant badge system → Task 2

**Type consistency:**
- `TicketStatus` defined in `lib/ticket-status.ts` (Task 1), used in Tasks 4, 6, 7 — consistent
- `updateRegistrationRefunded` defined in `lib/api/registrations.ts` (Task 3), used in Task 4 — consistent
- `organizerAddress` / `organizerWithdrawn` added to `Event` (Task 3), used in Tasks 5 and 8 — consistent
- `eventKeys.detail` from `hooks/api/use-events.ts` used in Task 5 — matches existing export
- `registrationKeys.my` from `hooks/api/use-my-registrations.ts` used in Task 4 — matches existing export
