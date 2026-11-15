-- ============================================================================
-- ALL-IN-ONE FIX & SEED MIGRATION
-- Run this directly in your Supabase SQL Editor tab
-- ============================================================================

-- Step 1: Add missing lesson columns safely
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(10,2);
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_duration NUMERIC(10,2);
ALTER TABLE public.lessons ALTER COLUMN slug DROP NOT NULL;

-- Step 2: Ensure prerequisite Category exists
INSERT INTO public.categories (id, name, slug, description, is_active, display_order)
VALUES (
    'c1000000-0000-0000-0000-000000000006',
    'Next.js & React',
    'nextjs',
    'Next.js App Router, SSR, Server Actions and Turbopack',
    true,
    6
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Ensure prerequisite Instructor Profile exists
INSERT INTO public.profiles (id, email, full_name, phone, bio, status)
VALUES (
    'a1000000-0000-0000-0000-000000000003',
    'priya.sen@sarvonaya.edu',
    'Priya Sen',
    '+91 98222 33445',
    'Principal Cloud & Next.js Architect',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Ensure Course exists before creating its sections
INSERT INTO public.courses (
    id, title, slug, short_description, full_description, thumbnail_url,
    category_id, primary_instructor_id, difficulty_level, duration_hours,
    language, price, discount_price, is_subscription_eligible, access_duration_days,
    status, published_at
)
VALUES (
    'e1000000-0000-0000-0000-000000000001',
    'Full-Stack Next.js 15 & Supabase Enterprise Architecture',
    'nextjs-supabase-architecture',
    'Build high-throughput, secure multi-tenant SaaS platforms with Server Actions, Turbopack, and PostgreSQL RLS.',
    'Master modern web engineering using Next.js 15 App Router, React 19, Supabase PostgreSQL, edge caching, and automated deployment pipelines.',
    'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80',
    'c1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000003',
    'advanced',
    36.5,
    'English',
    3999.00,
    2499.00,
    true,
    365,
    'published',
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Insert Course Sections (Linked to Course)
INSERT INTO public.course_sections (id, course_id, title, sort_order, is_published)
VALUES
('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Module 1: Next.js 15 Foundations & SSR Internals', 1, true),
('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Module 2: Server Actions & Supabase Integration', 2, true)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Insert Lessons (Linked to Sections)
INSERT INTO public.lessons (
    id, section_id, title, slug, sort_order, mux_asset_id, mux_playback_id,
    duration_minutes, video_duration, duration_seconds, is_preview, is_published
)
VALUES
('d3000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', '1.1 Architecture Overview & High-Concurrency Patterns', 'architecture-overview-patterns', 1, 'mux_asset_demo_01', 'A3VXy02TYbg2ux8Kx43w758', 21, 1240, 1240, true, true),
('d3000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', '1.2 Turbopack vs Webpack: Performance Profiling', 'turbopack-vs-webpack-profiling', 2, 'mux_asset_demo_02', 'B4WZy02TYbg2ux8Kx43w759', 28, 1680, 1680, false, true),
('d3000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000002', '2.1 Direct SQL vs ORMs: Achieving Sub-10ms Queries', 'direct-sql-vs-orms', 1, 'mux_asset_demo_03', 'C5XZy02TYbg2ux8Kx43w760', 32, 1950, 1950, false, true)
ON CONFLICT (id) DO NOTHING;
