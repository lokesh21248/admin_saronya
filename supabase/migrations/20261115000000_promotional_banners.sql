-- SARVONAYA Promotional Banners Schema & Policies
-- Powers customer website hero/promotional carousel banners (e.g. saronya.vercel.app)

CREATE TABLE IF NOT EXISTS public.promotional_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    badge_text VARCHAR(100),
    callout_text VARCHAR(100),
    description TEXT,
    cta_text VARCHAR(100) DEFAULT 'Explore Now',
    cta_url VARCHAR(500) DEFAULT '/subscriptions',
    background_color VARCHAR(50) DEFAULT '#0B3473',
    text_color VARCHAR(50) DEFAULT '#FFFFFF',
    image_url TEXT,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for ordering active banners on customer site
CREATE INDEX IF NOT EXISTS idx_banners_active_order ON public.promotional_banners (is_active, display_order);

-- Enable RLS
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Allow anyone (students & anonymous visitors) to read active banners
CREATE POLICY "Public can view active promotional banners"
    ON public.promotional_banners
    FOR SELECT
    USING (is_active = true);

-- 2. Staff Policy: Admins & Staff have full control
CREATE POLICY "Admins full management for promotional banners"
    ON public.promotional_banners
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Seed initial banner matching customer website saronya.vercel.app
INSERT INTO public.promotional_banners (
    id, title, badge_text, callout_text, description, cta_text, cta_url, background_color, text_color, display_order, is_active
) VALUES (
    'f1000000-0000-0000-0000-000000000001',
    'Unlock Unlimited Learning',
    'ALL-ACCESS PASS',
    'Save 45% This Month',
    'Get full access to all 500+ premium courses, live mentor doubt clearing, and verified certificates.',
    'Explore All-Access Passes',
    '/subscriptions',
    '#0B3473',
    '#FFFFFF',
    1,
    true
) ON CONFLICT (id) DO NOTHING;
