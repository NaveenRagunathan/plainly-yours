-- Restructure pricing tiers: Add Free, update Starter to $19, update Pro to $49
-- Safe to run since no production users exist yet

-- 1. Drop old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- 2. Add new constraint with updated plan values
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check 
    CHECK (plan IN ('free', 'starter', 'pro'));

-- 3. Update default plan to 'free'
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free';

-- 4. Update subscriber limits function (if needed in future)
-- For now, limits are enforced in application code

-- 5. Migrate existing data (if any users exist - currently none)
-- Map old values to new values:
-- 'starter' (was $19) -> 'free' (now $0)
-- 'growth' (was $39) -> 'starter' (now $19)
-- 'lifetime' (was $49 one-time) -> 'pro' (now $49/mo) with is_lifetime flag

UPDATE public.profiles SET plan = 'free' WHERE plan = 'starter';
UPDATE public.profiles SET plan = 'starter' WHERE plan = 'growth';
UPDATE public.profiles SET plan = 'pro', is_lifetime = TRUE WHERE plan = 'lifetime';

-- 6. Update subscriber limits per plan
UPDATE public.profiles SET subscriber_limit = 100 WHERE plan = 'free';
UPDATE public.profiles SET subscriber_limit = 25000 WHERE plan = 'starter';
UPDATE public.profiles SET subscriber_limit = 100000 WHERE plan = 'pro';
