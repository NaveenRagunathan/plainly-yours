-- Plainly Email Platform Database Schema

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'lifetime')),
    subscriber_limit INTEGER DEFAULT 5000,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Subscribers Table
CREATE TABLE public.subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    current_sequence_id UUID, -- References sequences table (added later)
    current_sequence_step INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, email)
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscribers" ON public.subscribers
    USING (auth.uid() = user_id);

CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_subscribers_status ON public.subscribers(status);

-- 3. Sequences Table
CREATE TABLE public.sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
    enrolled_count INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sequences" ON public.sequences
    USING (auth.uid() = user_id);

CREATE INDEX idx_sequences_user_id ON public.sequences(user_id);

-- 4. Sequence Steps Table
CREATE TABLE public.sequence_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_id UUID REFERENCES public.sequences(id) ON DELETE CASCADE NOT NULL,
    "order" INTEGER NOT NULL,
    delay_hours INTEGER DEFAULT 0,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage steps in their sequences" ON public.sequence_steps
    USING (EXISTS (
        SELECT 1 FROM public.sequences 
        WHERE sequences.id = sequence_steps.sequence_id 
        AND sequences.user_id = auth.uid()
    ));

CREATE INDEX idx_sequence_steps_sequence_id ON public.sequence_steps(sequence_id);

-- 5. Broadcasts Table
CREATE TABLE public.broadcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipient_filter JSONB DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "unsubscribed": 0, "bounced": 0}'::jsonb,
    -- A/B Testing fields
    is_ab_test BOOLEAN DEFAULT FALSE,
    subject_b TEXT,
    test_size_percent INTEGER, -- 10, 20, 30
    winner_metric TEXT, -- 'open_rate', 'click_rate'
    wait_time_hours INTEGER, -- 2, 4, 6
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own broadcasts" ON public.broadcasts
    USING (auth.uid() = user_id);

CREATE INDEX idx_broadcasts_user_id ON public.broadcasts(user_id);
CREATE INDEX idx_broadcasts_status ON public.broadcasts(status);

-- 6. Landing Pages Table
CREATE TABLE public.landing_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    template TEXT DEFAULT 'minimal' CHECK (template IN ('minimal', 'side-by-side', 'hero', 'two-column', 'video')),
    headline TEXT NOT NULL,
    subheadline TEXT,
    button_text TEXT DEFAULT 'Subscribe',
    image_url TEXT,
    show_first_name BOOLEAN DEFAULT TRUE,
    assign_tag TEXT,
    assign_sequence_id UUID REFERENCES public.sequences(id) ON DELETE SET NULL,
    success_message TEXT DEFAULT 'You''re in! Check your inbox.',
    redirect_url TEXT,
    views INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Auth policy for management
CREATE POLICY "Users can manage their own landing pages" ON public.landing_pages
    USING (auth.uid() = user_id);

-- Public policy for viewing published pages
CREATE POLICY "Public can view published landing pages" ON public.landing_pages
    FOR SELECT USING (status = 'published');

CREATE INDEX idx_landing_pages_user_id ON public.landing_pages(user_id);
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);

-- 7. Email Events Table (for internal tracking)
CREATE TABLE public.email_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE NOT NULL,
    broadcast_id UUID REFERENCES public.broadcasts(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES public.sequences(id) ON DELETE CASCADE,
    step_id UUID REFERENCES public.sequence_steps(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'unsubscribed', 'bounced')),
    link_url TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email events" ON public.email_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_email_events_user_id ON public.email_events(user_id);
CREATE INDEX idx_email_events_broadcast_id ON public.email_events(broadcast_id);
CREATE INDEX idx_email_events_subscriber_id ON public.email_events(subscriber_id);

-- 8. Functions & Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_subscribers_updated_at BEFORE UPDATE ON public.subscribers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_sequences_updated_at BEFORE UPDATE ON public.sequences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_sequence_steps_updated_at BEFORE UPDATE ON public.sequence_steps FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_broadcasts_updated_at BEFORE UPDATE ON public.broadcasts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Profile creation on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Email Jobs Queue (for scheduled sending)
CREATE TABLE public.email_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    broadcast_id UUID REFERENCES public.broadcasts(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES public.sequences(id) ON DELETE CASCADE,
    step_id UUID REFERENCES public.sequence_steps(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email jobs" ON public.email_jobs
    USING (auth.uid() = user_id);

CREATE INDEX idx_email_jobs_status_scheduled ON public.email_jobs(status, scheduled_at);
CREATE INDEX idx_email_jobs_broadcast_id ON public.email_jobs(broadcast_id);
