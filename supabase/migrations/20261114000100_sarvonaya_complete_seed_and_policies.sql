-- ============================================================================
-- SARVONAYA Complete Seed & Dev Access Policies Migration
-- Version: 20261114000100
-- Compatible with Supabase SQL Editor
-- ============================================================================

-- 1. Enable Full Access Policies for anon & authenticated roles across all tables
-- This ensures the web application using the publishable key can read & write cleanly
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Dev full anon access on %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Dev full anon access on %I" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Dev full auth access on %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Dev full auth access on %I" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;

-- 2. User Profiles (Admins, Instructors, Students)
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, bio, status) VALUES
('a1000000-0000-0000-0000-000000000001', 'admin@sarvonaya.edu', 'Dr. Rajesh Sharma', '+91 98765 43210', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', 'Dean of Engineering & Platform Chief Architect', 'active'),
('a1000000-0000-0000-0000-000000000002', 'dr.ramesh@sarvonaya.edu', 'Dr. Ramesh Babu', '+91 98111 22334', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', 'Senior VLSI & Microelectronics Research Fellow', 'active'),
('a1000000-0000-0000-0000-000000000003', 'priya.sen@sarvonaya.edu', 'Priya Sen', '+91 98222 33445', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80', 'Principal Cloud & Next.js Architect', 'active'),
('a1000000-0000-0000-0000-000000000004', 'amit.v@sarvonaya.edu', 'Amit Verma', '+91 98333 44556', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', 'AI Research Scientist & PyTorch Specialist', 'active'),
('a1000000-0000-0000-0000-000000000005', 'sneha.k@sarvonaya.edu', 'Sneha Kulkarni', '+91 98444 55667', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80', 'Embedded Systems Firmware Director', 'active'),
('a1000000-0000-0000-0000-000000000006', 'aditi.rao@gmail.com', 'Aditi Rao', '+91 91234 56780', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', 'Final Year CSE student passionate about distributed systems', 'active'),
('a1000000-0000-0000-0000-000000000007', 'rohan.mehta@yahoo.com', 'Rohan Mehta', '+91 92345 67891', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80', 'ECE student focusing on digital IC implementation and FPGA', 'active'),
('a1000000-0000-0000-0000-000000000008', 'kavya.patel@outlook.com', 'Kavya Patel', '+91 93456 78902', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', 'AIML student researching multimodal LLMs', 'active'),
('a1000000-0000-0000-0000-000000000009', 'vikram.reddy@gmail.com', 'Vikram Reddy', '+91 94567 89013', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80', 'MECH undergraduate working on smart automation and PLC', 'active'),
('a1000000-0000-0000-0000-000000000010', 'neha.gupta@gmail.com', 'Neha Gupta', '+91 95678 90124', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80', 'Civil engineering scholar with STAAD Pro focus', 'active'),
('a1000000-0000-0000-0000-000000000011', 'sid.nair@gmail.com', 'Siddharth Nair', '+91 96789 01235', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80', 'EEE student passionate about renewable microgrids', 'active'),
('a1000000-0000-0000-0000-000000000012', 'ananya.j@gmail.com', 'Ananya Joshi', '+91 97890 12346', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', 'IT student exploring cloud native microservices', 'active')
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, avatar_url = EXCLUDED.avatar_url;

-- 3. User Roles
INSERT INTO public.user_roles (user_id, role) VALUES
('a1000000-0000-0000-0000-000000000001', 'super_admin'),
('a1000000-0000-0000-0000-000000000002', 'instructor'),
('a1000000-0000-0000-0000-000000000003', 'instructor'),
('a1000000-0000-0000-0000-000000000004', 'instructor'),
('a1000000-0000-0000-0000-000000000005', 'instructor'),
('a1000000-0000-0000-0000-000000000006', 'student'),
('a1000000-0000-0000-0000-000000000007', 'student'),
('a1000000-0000-0000-0000-000000000008', 'student'),
('a1000000-0000-0000-0000-000000000009', 'student'),
('a1000000-0000-0000-0000-000000000010', 'student'),
('a1000000-0000-0000-0000-000000000011', 'student'),
('a1000000-0000-0000-0000-000000000012', 'student')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Academic Qualifications
INSERT INTO public.academic_qualifications (student_id, branch_id, college_name, degree, passed_out_year, roll_number, is_verified) VALUES
('a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'National Institute of Technology', 'B.Tech', 2026, '22CS042', true),
('a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 'Birla Institute of Technology', 'B.Tech', 2025, '21EC108', true),
('a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000005', 'Indian Institute of Information Technology', 'B.Tech', 2026, '22AI019', true),
('a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000006', 'College of Engineering, Guindy', 'B.E', 2024, '20ME077', false),
('a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000007', 'Delhi Technological University', 'B.Tech', 2025, '21CE033', true),
('a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000003', 'RV College of Engineering', 'B.E', 2025, '21EE054', true),
('a1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000004', 'Vellore Institute of Technology', 'B.Tech', 2026, '22IT112', true)
ON CONFLICT (student_id) DO UPDATE SET college_name = EXCLUDED.college_name, degree = EXCLUDED.degree, passed_out_year = EXCLUDED.passed_out_year;

-- 5. Production Courses
INSERT INTO public.courses (id, title, slug, short_description, full_description, thumbnail_url, category_id, primary_instructor_id, difficulty_level, duration_hours, language, price, discount_price, is_subscription_eligible, access_duration_days, status, published_at) VALUES
('e1000000-0000-0000-0000-000000000001', 'Full-Stack Next.js 15 & Supabase Enterprise Architecture', 'nextjs-supabase-architecture', 'Build high-throughput, secure multi-tenant SaaS platforms with Server Actions, Turbopack, and PostgreSQL RLS.', 'Master modern web engineering using Next.js 15 App Router, React 19, Supabase PostgreSQL, edge caching, and automated deployment pipelines.', 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80', 'c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'advanced', 36.5, 'English', 3999.00, 2499.00, true, 365, 'published', now()),
('e1000000-0000-0000-0000-000000000002', 'VLSI Design & Verilog Digital IC Implementation', 'vlsi-verilog-ic-implementation', 'From logic synthesis to physical layout: Complete RTL-to-GDSII ASIC design flow with modern EDA tools.', 'Deep dive into semiconductor design, Verilog HDL synthesis, timing analysis, clock tree synthesis, and FPGA implementation.', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80', 'c1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000002', 'intermediate', 42.0, 'English', 4499.00, 2999.00, true, 365, 'published', now()),
('e1000000-0000-0000-0000-000000000003', 'Deep Learning & Large Language Models in Production', 'deep-learning-llms-production', 'Train, fine-tune, quantize and deploy custom generative AI models and RAG pipelines using PyTorch and vLLM.', 'Comprehensive curriculum covering Transformer architectures, RLHF, vector embeddings, high-throughput inference, and model evaluation.', 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80', 'c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000004', 'advanced', 48.0, 'English', 4999.00, 3499.00, true, 365, 'published', now()),
('e1000000-0000-0000-0000-000000000004', 'Embedded Systems & ARM Cortex-M Firmware', 'embedded-systems-arm-firmware', 'Bare-metal C and RTOS programming for automotive and IoT industrial hardware platforms.', 'Learn embedded firmware development on STM32 microcontrollers, FreeRTOS task scheduling, DMA transfers, and CAN bus protocols.', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80', 'c1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000005', 'intermediate', 34.0, 'English', 3499.00, 2299.00, true, 365, 'published', now()),
('e1000000-0000-0000-0000-000000000005', 'Structural Earthquake Engineering & STAAD Pro Masterclass', 'structural-earthquake-engineering', 'Seismic analysis, dynamic loading simulations, and multi-story reinforced concrete structural design.', 'Industry certified civil engineering workflows for building frame analysis, Eurocode/IS-1893 compliance, and foundation detailing.', 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80', 'c1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000001', 'all_levels', 28.0, 'English', 2999.00, 1999.00, true, 365, 'published', now()),
('e1000000-0000-0000-0000-000000000006', 'Industrial Robotics, PLC & Mechatronics Control', 'industrial-robotics-plc-mechatronics', 'Siemens & Allen-Bradley ladder logic, SCADA integration, and kinematic robot arm path planning.', 'Design automated factory cells, integrate servomotors with safety interlocks, and master industrial communications protocols.', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80', 'c1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000002', 'intermediate', 38.0, 'English', 3799.00, 2699.00, true, 365, 'published', now()),
('e1000000-0000-0000-0000-000000000007', 'Cloud DevOps Engineering: Kubernetes & AWS', 'devops-kubernetes-aws', 'Production container orchestration, GitOps with ArgoCD, Terraform IaC, and zero-downtime blue/green deployments.', 'Hands-on enterprise cloud operations on Amazon EKS, Helm charting, Prometheus observability, and SOC2 compliant architectures.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', 'c1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000003', 'advanced', 44.0, 'English', 4299.00, 3199.00, true, 365, 'published', now()),
('e1000000-0000-0000-0000-000000000008', 'Modern Data Analytics: Python, SQL & PowerBI', 'modern-data-analytics-python-sql', 'Extract, transform, and visualize multi-terabyte datasets into actionable enterprise executive dashboards.', 'Master SQL window functions, pandas data cleaning, statistical significance testing, and interactive PowerBI executive stories.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80', 'c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000004', 'beginner', 32.0, 'English', 2999.00, 1899.00, true, 365, 'draft', null)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, price = EXCLUDED.price, discount_price = EXCLUDED.discount_price, status = EXCLUDED.status;

-- 6. Course Academic Branch Mapping
INSERT INTO public.course_branch_mapping (course_id, branch_id) VALUES
('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004'),
('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000008'),
('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000009'),
('e1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002'),
('e1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003'),
('e1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001'),
('e1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005'),
('e1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002'),
('e1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003'),
('e1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000007'),
('e1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006'),
('e1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001'),
('e1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000004'),
('e1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001'),
('e1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- 7. Course Sections & Lessons
-- Ensure lessons table supports duration_seconds, video_duration and duration_minutes cleanly
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(10,2);
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_duration NUMERIC(10,2);
ALTER TABLE public.lessons ALTER COLUMN slug DROP NOT NULL;

INSERT INTO public.course_sections (id, course_id, title, sort_order, is_published) VALUES
('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Module 1: Next.js 15 Foundations & SSR Internals', 1, true),
('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Module 2: Server Actions & Supabase Integration', 2, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.lessons (
    id, section_id, title, slug, sort_order, mux_asset_id, mux_playback_id, duration_minutes, video_duration, duration_seconds, is_preview, is_published
) VALUES
('d3000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', '1.1 Architecture Overview & High-Concurrency Patterns', 'architecture-overview-patterns', 1, 'mux_asset_demo_01', 'A3VXy02TYbg2ux8Kx43w758', 21, 1240, 1240, true, true),
('d3000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', '1.2 Turbopack vs Webpack: Performance Profiling', 'turbopack-vs-webpack-profiling', 2, 'mux_asset_demo_02', 'B4WZy02TYbg2ux8Kx43w759', 28, 1680, 1680, false, true),
('d3000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000002', '2.1 Direct SQL vs ORMs: Achieving Sub-10ms Queries', 'direct-sql-vs-orms', 1, 'mux_asset_demo_03', 'C5XZy02TYbg2ux8Kx43w760', 32, 1950, 1950, false, true)
ON CONFLICT DO NOTHING;

-- 8. Enrollments
INSERT INTO public.enrollments (id, student_id, course_id, access_type, status, progress_percentage, enrolled_at) VALUES
('e2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000001', 'purchased', 'active', 72.5, now() - interval '25 days'),
('e2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000007', 'subscription', 'active', 45.0, now() - interval '14 days'),
('e2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000002', 'purchased', 'active', 88.0, now() - interval '40 days'),
('e2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000003', 'subscription', 'active', 30.0, now() - interval '7 days'),
('e2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000006', 'complimentary', 'active', 100.0, now() - interval '60 days')
ON CONFLICT (student_id, course_id) DO NOTHING;

-- 9. Orders & Payments
INSERT INTO public.orders (id, order_number, student_id, item_type, course_id, total_amount, currency, status) VALUES
('d5000000-0000-0000-0000-000000000001', 'ORD-2026-0891', 'a1000000-0000-0000-0000-000000000006', 'course', 'e1000000-0000-0000-0000-000000000001', 2499.00, 'INR', 'paid'),
('d5000000-0000-0000-0000-000000000002', 'ORD-2026-0892', 'a1000000-0000-0000-0000-000000000007', 'course', 'e1000000-0000-0000-0000-000000000002', 2999.00, 'INR', 'paid'),
('d5000000-0000-0000-0000-000000000003', 'ORD-2026-0893', 'a1000000-0000-0000-0000-000000000008', 'subscription', null, 7999.00, 'INR', 'paid')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO public.payments (id, order_id, razorpay_payment_id, amount, currency, status, payment_method, tax_amount) VALUES
('d6000000-0000-0000-0000-000000000001', 'd5000000-0000-0000-0000-000000000001', 'pay_Ox8j3K9Lm2N1', 2499.00, 'INR', 'captured', 'upi', 381.20),
('d6000000-0000-0000-0000-000000000002', 'd5000000-0000-0000-0000-000000000002', 'pay_Pz9k4M8Ln3O2', 2999.00, 'INR', 'captured', 'netbanking', 457.47),
('d6000000-0000-0000-0000-000000000003', 'd5000000-0000-0000-0000-000000000003', 'pay_Qa0l5N7Lo4P3', 7999.00, 'INR', 'captured', 'card', 1220.18)
ON CONFLICT (razorpay_payment_id) DO NOTHING;

-- 10. Coupons
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_value, max_discount, max_uses, current_uses, is_active, valid_from, valid_until) VALUES
('d7000000-0000-0000-0000-000000000001', 'SARVONAYA25', '25% Launch Special Discount across all masterclasses', 'percentage', 25.00, 1000.00, 1000.00, 500, 142, true, now() - interval '30 days', now() + interval '60 days'),
('d7000000-0000-0000-0000-000000000002', 'GATE2026', 'Flat ₹500 discount for verified engineering students', 'fixed', 500.00, 1500.00, null, 1000, 318, true, now() - interval '15 days', now() + interval '90 days')
ON CONFLICT (code) DO NOTHING;

-- 11. Support Tickets
INSERT INTO public.support_tickets (id, student_id, ticket_number, subject, priority, status, category) VALUES
('d8000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 'TICK-901', 'Question regarding Next.js 15 Server Actions optimization', 'medium', 'open', 'academic'),
('d8000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', 'TICK-902', 'Invoice download request for college reimbursement', 'low', 'resolved', 'billing')
ON CONFLICT (ticket_number) DO NOTHING;

-- 12. Audit Logs
INSERT INTO public.audit_logs (id, actor_id, actor_name, action, target_type, target_id, target_name, details, ip_address) VALUES
('d9000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dr. Rajesh Sharma', 'course.publish', 'course', 'e1000000-0000-0000-0000-000000000001', 'Full-Stack Next.js 15 & Supabase Enterprise Architecture', '{"status": "published"}'::jsonb, '127.0.0.1'),
('d9000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Dr. Rajesh Sharma', 'branch.create', 'branch', 'b1000000-0000-0000-0000-000000000001', 'CSE', '{"code": "CSE"}'::jsonb, '127.0.0.1')
ON CONFLICT DO NOTHING;

