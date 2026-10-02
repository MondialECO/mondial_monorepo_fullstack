# MONDIAL BUSINESS CREATION (MBC)
## Simple AI Credit Purchase System (V1) — Operations & Architecture

---

### 1. Canonical Flow

```
[ User clicks "+ Buy" ]
       │
       ▼
[ BuyCreditsModal (100, 250, 500 packs) ]
       │
       ▼ POST /api/ai/credits/checkout { packageId }
[ Backend validates config & creates Pending CreditPurchase ]
       │
       ▼ Stripe SessionService.CreateAsync()
[ Browser redirects to Stripe Hosted Checkout URL ]
       │
       ▼ User pays with Credit/Debit Card
[ Stripe Webhook: checkout.session.completed (signed HMAC) ]
       │
       ▼ Backend verifies Stripe-Signature & payment_status == "paid"
[ MongoDB Transaction: Status=Succeeded AND Balance += credits ]
       │
       ▼ Browser returns to /dashboard/creator?creditPurchase=success
[ React Query invalidates creditKeys.balance -> New balance appears ]
```

---

### 2. Core Business & Architecture Rules

1. **One-Balance Rule:**
   - There is only one AI credit balance stored in the authoritative MongoDB collection `AICredits` (`AiCreditLedger.Balance`).
   - No separate wallets (no starter vs. purchased wallet).
   - No recurring allowances, monthly resets, subscriptions, or credit expirations.

2. **200 Starter Credits Unchanged:**
   - Existing starter credit behavior (`StarterCredits = 200`) is preserved.
   - Lazy initialization via `AiCreditLedgerRepository.TryGrantInitialAsync(userId, 200)` runs as before.
   - If a brand-new user purchases credits prior to viewing their dashboard, the starter ledger is guaranteed first (`200 starter + purchased credits`).

3. **Three One-Time Packs:**
   - `pack_100`: 100 AI credits
   - `pack_250`: 250 AI credits (Featured / Popular)
   - `pack_500`: 500 AI credits (Pro)

4. **Server-Authoritative Pricing & Fail-Closed Design:**
   - In tracked `appsettings.json` and `appsettings.Development.json`, package `AmountInCents` is set to `null` and `Enabled` is `false`.
   - Prices and keys must be injected via environment variables or secret management.
   - Unpriced or disabled packages are excluded from `GET /api/ai/credits/packages` and rejected by `POST /api/ai/credits/checkout`.
   - Frontend never controls credit quantities, currency, or prices.

5. **Stripe Hosted Checkout (No Frontend Stripe SDK):**
   - Implemented backend-only using the official `Stripe.net` NuGet package.
   - Zero frontend Stripe dependencies (`@stripe/stripe-js` is not installed).
   - Card details never touch Mondial servers; payments are processed entirely within Stripe Hosted Checkout.

6. **Crash-Safe MongoDB Transaction:**
   - Payment fulfillment uses a single MongoDB transaction:
     - Compare-and-swap on `CreditPurchase`: `Status == Pending -> Succeeded`.
     - Increment `AICredits`: `Balance += credits`, `LifetimeGranted += credits`.
   - Either both operations succeed and commit, or neither executes.

7. **Idempotency & Duplicate Protection:**
   - Unique sparse indexes on `ProviderSessionId`, `ProviderPaymentIntentId`, and `ProviderEventId`.
   - Duplicate webhook delivery or concurrent retries acknowledge with HTTP 200 but never grant credits twice.

8. **Durable Purchase History Collection:**
   - `CreditPurchases` is a durable purchase history / audit collection (not fully immutable because records undergo compare-and-swap status transitions: `Pending` → `Succeeded` / `Failed` / `Expired`).
   - `GET /api/ai/credits/purchases` returns authenticated user's records sorted newest first.
   - Displays package, credit count, amount, currency, status, and timestamps.

9. **Payment Refund & Dispute Scope (V1 Limitation):**
   - AI generation failure refunds (`IAiCreditService.RefundForJobAsync`) remain strictly for failed LLM generations.
   - Automatic Stripe monetary refund handling is not implemented in V1; Stripe refunds do not automatically reverse granted AI credits.
   - Payment disputes and chargebacks do not automatically modify `AICredits.Balance`.
   - Manual administrative reconciliation is currently required for refunded, disputed, or charged-back transactions in V1.

---

### 3. Required Environment Configuration

To enable credit purchases in a deployed environment, set the following environment variables:

```bash
# Enable Stripe Credit Purchasing
Stripe__Enabled=true

# Stripe Secret API Key (from Stripe Dashboard)
Stripe__SecretKey=sk_live_... (or sk_test_...)

# Stripe Webhook Signing Secret (from Stripe Webhooks Dashboard)
Stripe__WebhookSecret=whsec_...

# Package Pricing (in Euro cents)
Stripe__Packages__pack_100__AmountInCents=1000   # e.g., €10.00
Stripe__Packages__pack_250__AmountInCents=2000   # e.g., €20.00
Stripe__Packages__pack_500__AmountInCents=3500   # e.g., €35.00
```
