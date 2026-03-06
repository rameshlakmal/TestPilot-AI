# Feature Requirement: Subscription Billing & Plan Management

## 1. Overview

The platform offers a SaaS subscription billing system where users can sign up for a plan, upgrade/downgrade between plans, manage payment methods, and receive invoices. The system handles trial periods, proration, discount codes, usage limits, and automatic renewal with retry logic for failed payments.

---

## 2. Subscription Plans

| Plan       | Monthly Price | Annual Price | Storage Limit | API Calls/Month | Max Team Members | Support Level |
|------------|--------------|--------------|---------------|-----------------|------------------|---------------|
| Free       | $0           | $0           | 500 MB        | 1,000           | 1                | Community     |
| Starter    | $12/mo       | $120/yr      | 10 GB         | 25,000          | 5                | Email (48h)   |
| Pro        | $49/mo       | $490/yr      | 100 GB        | 250,000         | 25               | Email (12h)   |
| Enterprise | $199/mo      | $1,990/yr    | Unlimited     | Unlimited       | Unlimited        | Dedicated CSM |

- Annual billing gives a **2 months free** discount (10 months price for 12 months).
- Enterprise plan also available as a custom quote via sales contact.
- Free plan users cannot access: custom domains, SSO, audit logs, priority support.

---

## 3. Subscription Lifecycle (State Machine)

### States:
- **No Subscription** — user has no active plan (new user or fully cancelled)
- **Trial** — 14-day free trial of any paid plan (no payment method required)
- **Active** — valid paid subscription with successful payment
- **Past Due** — payment failed, grace period active (7 days)
- **Cancelled** — user or system cancelled the subscription
- **Expired** — trial ended without conversion to paid

### Transitions:
1. `No Subscription` → `Trial`: User selects a paid plan and clicks "Start free trial"
2. `Trial` → `Active`: User adds payment method before trial ends (charged immediately or at trial end based on setting)
3. `Trial` → `Expired`: 14 days pass without adding a payment method
4. `Active` → `Active`: Successful automatic renewal at billing cycle end
5. `Active` → `Past Due`: Automatic renewal payment fails
6. `Active` → `Cancelled`: User clicks "Cancel subscription" (access continues until period end)
7. `Past Due` → `Active`: Retry payment succeeds (automatic retries on day 1, 3, and 7)
8. `Past Due` → `Cancelled`: All 3 retry attempts fail after 7-day grace period
9. `Cancelled` → `Active`: User resubscribes (within 30 days, data is preserved; after 30 days, starts fresh)
10. `Expired` → `Trial`: Not allowed — user must subscribe to a paid plan directly
11. `Expired` → `Active`: User selects a plan and adds payment method

### Invalid Transitions (must be blocked):
- `Trial` → `Past Due` (no payment method on file during trial)
- `Cancelled` → `Trial` (trial is one-time only per account)
- `Expired` → `Trial` (trial is one-time only)
- `No Subscription` → `Active` without payment method
- `Past Due` → `Trial` (cannot restart trial)

---

## 4. Trial Period Rules

- Each account gets exactly **one trial**, ever. Even if the user cancels and creates a new subscription later, no second trial is offered.
- Trial duration: exactly **14 calendar days** from activation. Not business days.
- Trial includes full features of the selected plan (no feature restrictions during trial).
- At day 12, send a reminder email: "Your trial ends in 2 days."
- At day 14 (trial end):
  - If payment method is on file: charge the user and transition to `Active`.
  - If no payment method: transition to `Expired` and send a "Trial expired" email.
- During trial, user can cancel at any time — this transitions to `Cancelled` immediately (no end-of-period grace).

---

## 5. Payment Processing

### Accepted Payment Methods:
- Credit/debit cards: Visa, Mastercard, American Express (validated via Stripe)
- Stored card tokens (PCI-compliant, card numbers never stored directly)
- PayPal (redirect flow)

### Payment Validation Rules:
- Card number must pass Luhn algorithm check
- Expiry date must be in the future (at least current month)
- CVV: 3 digits for Visa/Mastercard, 4 digits for Amex
- Billing address required for cards (street, city, state/province, postal code, country)
- Postal code format validated per country (e.g., US: 5 digits or 5+4, UK: alphanumeric, CA: A1A 1A1)

### Retry Logic for Failed Payments:
- Attempt 1: Immediately at renewal time
- Attempt 2: 1 day after first failure (day 1 of grace period)
- Attempt 3: 3 days after first failure (day 3)
- Attempt 4 (final): 7 days after first failure (day 7)
- Each retry sends an email: "Payment failed — please update your payment method"
- If all 4 attempts fail → subscription transitions to `Cancelled`

---

## 6. Plan Changes (Upgrade / Downgrade)

### Upgrade:
- Takes effect **immediately**.
- Proration: user is charged the prorated difference for the remainder of the current billing cycle.
- Example: User on Starter ($12/mo) upgrades to Pro ($49/mo) on day 15 of a 30-day cycle. Charge = ($49 - $12) × (15/30) = $18.50 immediately. Next full cycle charges $49.
- Usage limits increase immediately upon upgrade.

### Downgrade:
- Takes effect **at the end of the current billing cycle** (user keeps current plan features until then).
- If current usage exceeds the lower plan's limits (e.g., 50 GB storage, downgrading to Starter's 10 GB), the system shows a warning: "You must reduce your storage to under 10 GB before the downgrade takes effect."
- If usage is not reduced by cycle end, the downgrade is **blocked** and the current plan auto-renews. User is notified via email.

### Billing Cycle Change (Monthly ↔ Annual):
- Monthly → Annual: charged the annual price immediately, prorated credit for remaining monthly period applied as a discount.
- Annual → Monthly: takes effect at annual renewal date. No mid-cycle refund.

---

## 7. Discount Codes

### Rules:
- Discount codes are alphanumeric, 4-20 characters, case-insensitive.
- Each code has: percentage (5%-100%) OR fixed amount ($1-$500), valid date range, max redemptions, eligible plans.
- A code can be used **once per account** (tracked by account ID, not email).
- Discount applies to the **first billing cycle only** (not recurring).
- Stacking: only **one discount code** can be applied per subscription at a time.
- If discount = 100%, first month is free but payment method is still required.
- Expired or maxed-out codes show error: "This discount code is no longer valid."
- Codes not valid for Enterprise plan unless explicitly flagged.

### Validation Order:
1. Check code exists
2. Check code is within valid date range
3. Check code has remaining redemptions
4. Check code is eligible for selected plan
5. Check account hasn't already used this code
6. Apply discount and show updated price

---

## 8. Invoice & Receipt

- Invoice generated at each successful payment (initial, renewal, upgrade proration).
- Invoice contains: invoice number (INV-YYYYMMDD-XXXX), date, plan name, billing period, amount, tax (if applicable), discount applied, payment method (last 4 digits).
- PDF download available from billing history page.
- Email sent with invoice attached for payments > $0.
- Free plan users do not receive invoices.
- Tax calculation: US sales tax applied based on billing address state. EU VAT applied based on user's country. No tax for other regions.
- Tax rate lookup via external tax API (TaxJar integration). If API is unavailable, default to 0% tax with a flag for manual review.

---

## 9. Cancellation & Data Retention

- User can cancel at any time from the billing settings page.
- Cancellation is effective at the **end of the current billing period** (user retains access until then).
- Exception: trial cancellation is **immediate** (no end-of-period grace).
- After cancellation:
  - 0-30 days: data preserved, user can resubscribe and regain access instantly.
  - 30-90 days: data preserved but account is read-only. User can export data or resubscribe.
  - After 90 days: data is **permanently deleted** (GDPR compliance). User notified at day 60 and day 85.
- Cancellation reason survey shown (optional): too expensive, missing features, switching to competitor, temporary pause, other.
- If user has remaining team members on the account, show warning: "Cancelling will remove access for X team members."

---

## 10. Permissions & Roles

- **Account Owner**: can manage subscription, billing, payment methods, and team members.
- **Admin**: can view billing info but cannot change subscription or payment methods.
- **Member**: no access to billing pages at all (sees "Contact your account owner" message).
- Role checks enforced on both frontend (hide/disable UI) and backend (API returns 403).

---

## 11. Notifications

| Event                        | Channel | Timing               |
|------------------------------|---------|----------------------|
| Trial started                | Email   | Immediately          |
| Trial ending soon            | Email   | Day 12 of trial      |
| Trial expired                | Email   | Day 14 (end of trial)|
| Payment successful           | Email   | Immediately          |
| Payment failed (retry)       | Email   | Each retry attempt   |
| Subscription cancelled       | Email   | Immediately          |
| Upcoming renewal             | Email   | 3 days before cycle end |
| Plan upgraded                | Email   | Immediately          |
| Plan downgraded (scheduled)  | Email   | Immediately          |
| Data deletion warning        | Email   | Day 60 and day 85 after cancellation |
| Discount code applied        | In-app  | Immediately          |

---

## 12. API Rate Limits & Performance

- Billing API endpoints: max 30 requests/minute per account.
- Payment processing: must complete within 15 seconds or timeout with "Payment processing delayed, please try again."
- Invoice PDF generation: max 10 seconds, async if over 5 seconds (user sees "Generating..." with polling).
- Concurrent plan changes: if two admins attempt plan change simultaneously, the first request wins and the second receives a conflict error (HTTP 409).

---

## 13. Edge Cases to Consider

- User signs up at 11:59 PM on Jan 31 — when does the 14-day trial end? (Feb 14, regardless of month length)
- User in a timezone ahead of UTC — trial end time should be based on UTC, not local time.
- Annual subscriber upgrades mid-year — proration calculated on exact days remaining.
- Payment method expires between billing cycles — treated as a failed payment (enters Past Due).
- User deletes their only payment method while on an active subscription — allowed, but warned: "Your next renewal will fail without a payment method."
- Currency: all prices in USD. International users see USD amounts. No multi-currency support in v1.
- Downgrade to Free plan: treated as cancellation of paid subscription + activation of Free plan.
