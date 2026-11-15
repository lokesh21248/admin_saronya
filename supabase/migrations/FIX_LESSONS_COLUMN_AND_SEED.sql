-- ============================================================================
-- QUICK FIX: Add duration_seconds to lessons & complete seed migration
-- Run this directly in your Supabase SQL Editor
-- ============================================================================

-- 1. Safely add missing columns to public.lessons if they do not exist
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(10,2);
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_duration NUMERIC(10,2);
ALTER TABLE public.lessons ALTER COLUMN slug DROP NOT NULL;

-- 2. Insert initial sections
INSERT INTO public.course_sections (id, course_id, title, sort_order, is_published) VALUES
('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Module 1: Next.js 15 Foundations & SSR Internals', 1, true),
('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Module 2: Server Actions & Supabase Integration', 2, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert initial lessons
INSERT INTO public.lessons (
    id, section_id, title, slug, sort_order, mux_asset_id, mux_playback_id, duration_minutes, video_duration, duration_seconds, is_preview, is_published
) VALUES
('d3000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', '1.1 Architecture Overview & High-Concurrency Patterns', 'architecture-overview-patterns', 1, 'mux_asset_demo_01', 'A3VXy02TYbg2ux8Kx43w758', 21, 1240, 1240, true, true),
('d3000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', '1.2 Turbopack vs Webpack: Performance Profiling', 'turbopack-vs-webpack-profiling', 2, 'mux_asset_demo_02', 'B4WZy02TYbg2ux8Kx43w759', 28, 1680, 1680, false, true),
('d3000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000002', '2.1 Direct SQL vs ORMs: Achieving Sub-10ms Queries', 'direct-sql-vs-orms', 1, 'mux_asset_demo_03', 'C5XZy02TYbg2ux8Kx43w760', 32, 1950, 1950, false, true)
ON CONFLICT (id) DO NOTHING;
