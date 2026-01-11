# Stripe Setup Guide

This guide will walk you through setting up Stripe payments for Plainly. **These steps must be completed before the payment integration will work in production.**

## Prerequisites

- A Stripe account ([Sign up here](https://dashboard.stripe.com/register))
- Supabase CLI installed (`npm install -g supabase`)
- Access to your Supabase project

---

## Step 1: Create Stripe Products and Prices

### 1.1 Log into Stripe Dashboard
Navigate to [Stripe Dashboard](https://dashboard.stripe.com)

### 1.2 Create Products
Go to **Products** → **Add Product**

#### Starter Plan Product
- **Name**: `Starter Plan`
- **Description**: `Up to 25,000 subscribers with priority support`
- **Pricing**: 
  - Set to **Recurring**
  - **Price**: `$19 USD`
  - **Billing period**: `Monthly`
- Click **Save product**
- **Copy the Price ID** (format: `price_xxxxxxxxxxxxxx`)

#### Pro Plan Product
- **Name**: `Pro Plan`
- **Description**: `Up to 100,000 subscribers with dedicated support`
- **Pricing**:
  - Set to **Recurring**
  - **Price**: `$49 USD`
  - **Billing period**: `Monthly`
- Click **Save product**
- **Copy the Price ID** (format: `price_xxxxxxxxxxxxxx`)

### 1.3 Update Stripe Checkout Function

Edit `supabase/functions/stripe-checkout/index.ts` and replace the placeholder Price IDs:

```typescript
const plans = {
    'free': null,
    'starter': {
        price: 'price_YOUR_ACTUAL_STARTER_PRICE_ID', // Replace this!
        name: 'Starter Plan',
    },
    'pro': {
        price: 'price_YOUR_ACTUAL_PRO_PRICE_ID', // Replace this!
        name: 'Pro Plan',
    },
}
```

---

## Step 2: Configure Environment Variables

### 2.1 Get Your Stripe Secret Key
1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. For production, use the **Live mode** secret key (starts with `sk_live_`)

### 2.2 Set Supabase Secrets

Run these commands from your project root:

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Set Resend API key (for emails)
supabase secrets set RESEND_API_KEY=re_YOUR_KEY_HERE

# Set email configuration
supabase secrets set FROM_EMAIL=hello@yourdomain.com
supabase secrets set FROM_NAME="Plainly"
```

### 2.3 Update Local .env File

Create/update `.env` in your project root:

```bash
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

RESEND_API_KEY="re_xxxxxxxxxxxx"
FROM_EMAIL="hello@yourdomain.com"
FROM_NAME="Plainly"

STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"  # We'll get this in Step 3
```

---

## Step 3: Set Up Stripe Webhook

Webhooks allow Stripe to notify your app when events occur (e.g., successful payment, subscription canceled).

### 3.1 Deploy Webhook Function First

```bash
# Deploy the webhook function to get the URL
supabase functions deploy stripe-webhook
```

The URL will be: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`

### 3.2 Create Webhook in Stripe

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Click **Select events** and choose:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Click **Add endpoint**
6. **Copy the Signing secret** (starts with `whsec_`)

### 3.3 Add Webhook Secret to Supabase

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

---

## Step 4: Run Database Migration

The subscription tracking migration adds required columns to your `profiles` table.

```bash
# Apply all pending migrations
supabase db push
```

This will run `20240111_add_subscription_tracking.sql` which adds:
- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_status`
- `subscription_current_period_end`
- `is_lifetime`

---

## Step 5: Deploy Supabase Functions

Deploy all three Edge Functions:

```bash
# Deploy stripe checkout function
supabase functions deploy stripe-checkout

# Deploy webhook handler (if not done in Step 3.1)
supabase functions deploy stripe-webhook

# Deploy email queue processor
supabase functions deploy process-email-queue
```

---

## Step 6: Test the Integration

### 6.1 Test with Stripe Test Cards

Use Stripe's test card numbers in **test mode**:

- **Successful payment**: `4242 4242 4242 4242`
- **Payment requires authentication**: `4000 0025 0000 3155`
- **Payment declined**: `4000 0000 0000 9995`

Use any future expiry date, any 3-digit CVC, and any postal code.

### 6.2 Test Checkout Flow

1. Start your local dev server: `npm run dev`
2. Log in to your app
3. Go to **Settings** page
4. Click "Upgrade to Starter" or "Upgrade to Pro"
5. You should be redirected to Stripe Checkout
6. Complete payment with test card: `4242 4242 4242 4242`
7. After successful payment, you should be redirected back
8. Verify your plan updated in Settings page

### 6.3 Verify Database Updates

Check your Supabase `profiles` table:
```sql
SELECT 
  email, 
  plan, 
  subscription_status, 
  stripe_customer_id 
FROM profiles 
WHERE email = 'your-test-email@example.com';
```

You should see:
- `plan`: `'starter'` or `'pro'`
- `subscription_status`: `'active'`
- `stripe_customer_id`: `cus_xxxxx`

### 6.4 Test Webhook Events

Use Stripe CLI to forward webhook events to your local function:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhook events
stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Then trigger test events:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

Check your Supabase function logs to verify events are being processed.

---

## Step 7: Go to Production

### 7.1 Switch to Live Mode

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Create the same products/prices in Live mode
3. Update Price IDs in `stripe-checkout/index.ts`
4. Update webhook endpoint URL to use Live mode
5. Get Live mode API keys and webhook secret

### 7.2 Update Environment Variables

```bash
# Use live mode keys
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

### 7.3 Final Deployment

```bash
# Redeploy with updated Price IDs
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
```

---

## Troubleshooting

### Checkout session fails with "No such price"
- Verify Price IDs in `stripe-checkout/index.ts` match your Stripe Dashboard
- Make sure you're using the correct mode (test vs live)

### Webhook signature verification fails
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook endpoint URL matches exactly

### User plan doesn't update after payment
- Check Supabase function logs: `supabase functions logs stripe-webhook`
- Verify database migration was applied: `supabase db pull`
- Ensure webhook events are being sent from Stripe

### "CORS error" when creating checkout session
- Verify `config.toml` has `verify_jwt = false` for stripe-checkout function
- Check function is deployed: `supabase functions list`

---

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stripe Test Cards](https://stripe.com/docs/testing)
