# Production Deployment Guide

This document contains step-by-step instructions for deploying all the fixes to production.

## Prerequisites

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Stripe account with test mode enabled
- [ ] Resend account with API key
- [ ] Access to production database

---

## Phase 1: Database Migrations

### 1.1 Apply Subscription Tracking Migration

```bash
cd /home/letbu/Plainly

# Connect to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push
```

Alternative (Manual via Supabase Dashboard):
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/20240111_add_subscription_tracking.sql`
3. Run the SQL

### 1.2 Apply Pricing Restructure Migration

```bash
# Already included in supabase db push above
```

Alternative (Manual):
1. Copy content from `supabase/migrations/20240111_restructure_pricing.sql`
2. Run in SQL Editor

### 1.3 Verify Migrations

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'is_lifetime');

-- Check plan constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'profiles_plan_check';
```

---

## Phase 2: Stripe Configuration

### 2.1 Create Products in Stripe Dashboard

1. Log into [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Click "Create product"

**Starter Plan**:
- Name: `Plainly Starter`
- Description: `Up to 25,000 subscribers with priority support`
- Pricing: `$19.00 USD` / `Recurring monthly`
- Copy the **Price ID** (starts with `price_`)

**Pro Plan**:
- Name: `Plainly Pro`
- Description: `Up to 100,000 subscribers with dedicated support`
- Pricing: `$49.00 USD` / `Recurring monthly`
- Copy the **Price ID**

### 2.2 Update Edge Function with Real Price IDs

```bash
# Edit the file
nano supabase/functions/stripe-checkout/index.ts

# Replace placeholders:
# price_1XX_REPLACE_WITH_REAL_STARTER_PRICE_ID -> price_xxxxxxxxxxxxx (your actual Starter price ID)
# price_1YY_REPLACE_WITH_REAL_PRO_PRICE_ID -> price_xxxxxxxxxxxxx (your actual Pro price ID)
```

### 2.3 Configure Stripe Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Description: `Plainly subscription events`
5. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
6. Click "Add endpoint"
7. Copy the **Signing secret** (starts with `whsec_`)

### 2.4 Update Environment Variables

In Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Phase 3: Deploy Edge Functions

### 3.1 Deploy Stripe Webhook Handler

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 3.2 Deploy Updated Stripe Checkout

```bash
supabase functions deploy stripe-checkout
```

### 3.3 Deploy Email Queue Processor

```bash
supabase functions deploy process-email-queue --no-verify-jwt
```

### 3.4 Verify Deployments

```bash
# Test webhook handler
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Expected: 400 (signature verification failed - this is correct!)

# Test email queue processor  
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-email-queue
# Expected: 200 with {"success": true, "processed": 0, "sent": 0, "failed": 0}
```

---

## Phase 4: Resend Email Configuration

### 4.1 Verify Domain (Recommended for Production)

1. Log into [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add these DNS records to your DNS provider:

**Required Records**:
- **TXT (SPF)**: `v=spf1 include:_spf.resend.com ~all`
- **CNAME (DKIM)**: Provided by Resend (e.g., `resend._domainkey`)
- **TXT (DMARC)**: `v=DMARC1; p=none; rua=mailto:your-email@yourdomain.com`

5. Wait for verification (up to 24-48 hours)
6. Update environment variable: `FROM_EMAIL=noreply@yourdomain.com`

### 4.2 Temporary: Use Sandbox Mode

If you can't wait for domain verification:

1. Update `.env` and Supabase Edge Function secrets:
   ```
   FROM_EMAIL=onboarding@resend.dev
   ```
2. **Important**: You can only send to your own verified email in sandbox mode

### 4.3 Set Up Email Queue Cron

**Option A: Supabase Cron (Recommended)**

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Click "Create a new cron job"
3. Name: `process-email-queue`
4. Schedule: `*/1 * * * *` (every minute)
5. Command:
   ```sql
   SELECT
     net.http_post(
       url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-email-queue',
       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
       body:='{}'::jsonb
     ) as request_id;
   ```

**Option B: External Cron Service**

Use [cron-job.org](https://cron-job.org) or similar:
1. Create account
2. Add job: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-email-queue`
3. Schedule: Every 1 minute
4. Add header: `Authorization: Bearer YOUR_ANON_KEY`

---

## Phase 5: Frontend Deployment

### 5.1 Build Production Bundle

```bash
cd /home/letbu/Plainly
npm install
npm run build
```

### 5.2 Deploy to Netlify

```bash
# If using Netlify CLI
netlify deploy --prod --dir=dist

# Or use Git-based deployment (push to main branch)
git add .
git commit -m "fix: restructure pricing, complete Stripe integration, fix email delivery"
git push origin main
```

### 5.3 Verify Frontend

Visit your production URL and check:
- [ ] Pricing page shows 3 tiers: Free ($0), Starter ($19), Pro ($49)
- [ ] Clicking "Get Started" on Free tier → redirects to auth (no Stripe checkout)
- [ ] Clicking "Get Started" on Starter → opens Stripe checkout with $19 price
- [ ] Clicking "Get Started" on Pro → opens Stripe checkout with $49 price

---

## Phase 6: End-to-End Testing

### 6.1 Test Payment Flow

1. **Create Test Account**:
   - Sign up with test email
   - Verify you're on `free` plan in database

2. **Test Checkout**:
   - Click "Get Started" on Starter plan
   - Use Stripe test card: `4242 4242 4242 4242`, any future date, any CVC
   - Complete checkout

3. **Verify Webhook**:
   ```sql
   SELECT email, plan, subscription_status, stripe_customer_id, stripe_subscription_id
   FROM profiles
   WHERE email = 'your-test-email@example.com';
   ```
   - Expected: `plan = 'starter'`, `subscription_status = 'active'`

### 6.2 Test Email Delivery

1. **Create Test Broadcast**:
   - Log into dashboard
   - Create broadcast with subject "Test Email"
   - Schedule for immediate send
   - Add 1 test subscriber (use your verified email if in sandbox mode)

2. **Trigger Queue Processor**:
   ```bash
   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-email-queue
   ```

3. **Verify Email Sent**:
   ```sql
   SELECT id, status, error_message, processed_at
   FROM email_jobs
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - Expected: `status = 'sent'`

4. **Check Inbox**: Email should arrive within 1-2 minutes

### 6.3 Test Subscription Lifecycle

**Test Failed Payment**:
1. In Stripe Dashboard → Subscriptions → Select test subscription
2. Click "..." → "Update subscription" → "Simulate payment failure"
3. Verify database:
   ```sql
   SELECT subscription_status FROM profiles WHERE stripe_subscription_id = 'sub_xxxxx';
   ```
   - Expected: `subscription_status = 'past_due'`

**Test Cancellation**:
1. In Stripe Dashboard → Cancel subscription
2. Verify database:
   ```sql
   SELECT plan, subscription_status FROM profiles WHERE stripe_subscription_id = 'sub_xxxxx';
   ```
   - Expected: `plan = 'free'`, `subscription_status = 'canceled'`

---

## Rollback Procedures

### If Pricing Changes Break Checkout

```sql
-- Revert database
BEGIN;
ALTER TABLE profiles DROP COLUMN is_lifetime;
ALTER TABLE profiles DROP CONSTRAINT profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check 
  CHECK (plan IN ('starter', 'growth', 'lifetime'));
UPDATE profiles SET plan = 'starter' WHERE plan = 'free';
COMMIT;
```

Then redeploy previous frontend version via Netlify.

### If Webhook Handler Causes Issues

1. Remove webhook URL from Stripe Dashboard
2. Manually update subscriptions:
   ```sql
   UPDATE profiles SET subscription_status = 'active' 
   WHERE stripe_subscription_id IS NOT NULL;
   ```

### If Email Worker Overloads

1. Delete cron job from Supabase Dashboard
2. Reset failed jobs:
   ```sql
   UPDATE email_jobs SET status = 'pending', attempts = 0 
   WHERE status = 'failed' AND attempts < 3;
   ```

---

## Post-Deployment Verification Checklist

- [ ] Database migrations applied successfully
- [ ] Stripe products created with correct prices
- [ ] Webhook endpoint configured and receiving events
- [ ] All 3 edge functions deployed and healthy
- [ ] Environment variables set in Supabase
- [ ] Resend domain verified (or sandbox mode working)
- [ ] Email queue cron job running every minute
- [ ] Frontend deployed with new pricing
- [ ] Test payment completed successfully
- [ ] Webhook updated database correctly
- [ ] Test email delivered to inbox
- [ ] Failed payment handling works
- [ ] Subscription cancellation works

---

## Monitoring & Maintenance

### Check Email Queue Health

```sql
-- View queue status
SELECT status, COUNT(*), MAX(created_at) as latest
FROM email_jobs
GROUP BY status;

-- Check for stuck jobs
SELECT * FROM email_jobs
WHERE status = 'processing' AND created_at < NOW() - INTERVAL '10 minutes';
```

### Check Stripe Webhook Logs

Supabase Dashboard → Edge Functions → stripe-webhook → Logs

### Check Email Deliverability

Use [Mail-Tester](https://www.mail-tester.com):
1. Send broadcast to `test-xxxxx@srv1.mail-tester.com`
2. Check spam score (should be >8/10)

---

## Support & Troubleshooting

**Stripe Issues**: [Stripe Support](https://support.stripe.com)  
**Resend Issues**: [Resend Support](https://resend.com/support)  
**Supabase Issues**: [Supabase Support](https://supabase.com/support)

### Common Issues

**"Webhook signature verification failed"**  
→ Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

**"Emails stuck in pending"**  
→ Verify cron job is running, check edge function logs

**"Cannot send to this email"**  
→ Verify domain in Resend or use sandbox mode with your verified email
