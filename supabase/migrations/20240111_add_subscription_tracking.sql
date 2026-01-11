-- Add subscription tracking columns to profiles table
-- This enables proper Stripe subscription management

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT 
    CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE;

-- Create index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
