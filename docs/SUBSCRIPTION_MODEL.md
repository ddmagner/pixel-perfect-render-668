# Time In Subscription Model

## Overview

Time In uses a **14-day free trial** model with automatic conversion to paid subscription. There is no free tier after the trial period ends.

## Pricing Model

- **Free Trial**: 14 days from account creation
- **Monthly**: $7.99/month
- **Yearly**: $4.99/month (billed annually at $59.88)

## Billing Platforms

All billing is handled through native app stores:
- **iOS**: Apple App Store (via RevenueCat)
- **Android**: Google Play Store (via RevenueCat)

No web-based payments are supported.

## Subscription States

| Status | Description | App Access |
|--------|-------------|------------|
| `trialing` | User is within 14-day trial period | ✅ Full access |
| `active` | User has an active paid subscription | ✅ Full access |
| `cancelled` | Subscription cancelled but not expired | ✅ Access until expiration |
| `expired` | Trial or subscription has ended | ❌ No access |
| `paused` | Subscription is paused | ❌ No access |
| `billing_issue` | Payment failed | ⚠️ Limited grace period |

## Database Schema

The `subscriptions` table includes:

```sql
- id: UUID (primary key)
- user_id: UUID (unique, references auth.users)
- status: TEXT ('trialing', 'active', 'cancelled', 'expired', 'paused', 'billing_issue')
- plan_id: TEXT (RevenueCat product ID)
- transaction_id: TEXT (RevenueCat transaction ID)
- expires_at: TIMESTAMP (subscription expiration)
- trial_started_at: TIMESTAMP (when trial began)
- trial_ends_at: TIMESTAMP (when trial ends)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Trial Initialization

Trials are automatically initialized via database trigger when a new user signs up:
- `trial_started_at` = account creation time
- `trial_ends_at` = creation time + 14 days
- `status` = 'trialing'

For existing users without a subscription record, the app creates one on first load.

## RevenueCat Integration

### Webhook Events

The `revenuecat-webhook` edge function handles:

| Event | Action |
|-------|--------|
| `INITIAL_PURCHASE` | Set status to `active` |
| `RENEWAL` | Update expiration, maintain `active` |
| `CANCELLATION` | Set status to `cancelled` |
| `EXPIRATION` | Set status to `expired` |
| `UNCANCELLATION` | Set status back to `active` |
| `BILLING_ISSUE` | Set status to `billing_issue` |

### Webhook URL

Configure in RevenueCat dashboard:
```
https://umvhwbshppchbkgqhepk.supabase.co/functions/v1/revenuecat-webhook
```

### Authentication Header

Set the `REVENUECAT_WEBHOOK_AUTH_HEADER` secret in Supabase to match your RevenueCat webhook configuration.

## Despia Native Integration

The app uses Despia for native functionality. RevenueCat purchases are triggered via:

```typescript
import despia from 'despia-native';
despia(`revenuecat://launchPaywall?external_id=${userId}&offering=default`);
```

## App Store / Google Play Setup

### Required RevenueCat Products

Create these products in your app stores and configure in RevenueCat:

| Product ID | Description | Price |
|------------|-------------|-------|
| `premium_monthly` | Monthly subscription | $7.99 |
| `premium_yearly` | Annual subscription | $59.88 |

### RevenueCat Entitlements

Configure a `premium` entitlement that grants access to:
- Unlimited time entries
- Export to PDF & Excel
- Invoice generation
- Client management
- Advanced reporting
- Priority support

## Frontend Access Control

Use the `useSubscription` hook to check access:

```typescript
const { hasAccess, isTrialing, isPremium, trialDaysRemaining } = useSubscription();

// Check if user can use the app
if (!hasAccess) {
  // Show paywall
}

// Show trial days remaining
if (isTrialing && trialDaysRemaining !== null) {
  console.log(`${trialDaysRemaining} days left in trial`);
}
```

## Paywall Behavior

- **During Trial**: Paywall can be dismissed, shows days remaining
- **After Trial Expires**: Paywall cannot be dismissed, user must subscribe
- **Web**: Shows "Available in native app" message
- **Native**: Launches RevenueCat paywall
