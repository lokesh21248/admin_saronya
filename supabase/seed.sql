-- SARVONAYA Seed Data
-- Migration: supabase/seed.sql

-- 1. Academic Branches
INSERT INTO public.academic_branches (id, code, name, description, is_active) VALUES
('b1000000-0000-0000-0000-000000000001', 'CSE', 'Computer Science and Engineering', 'Software systems, algorithms, computing architectures', true),
('b1000000-0000-0000-0000-000000000002', 'ECE', 'Electronics & Communication Engineering', 'Microprocessors, VLSI, signal processing, communication', true),
('b1000000-0000-0000-0000-000000000003', 'EEE', 'Electrical & Electronics Engineering', 'Power systems, circuits, energy engineering', true),
('b1000000-0000-0000-0000-000000000004', 'IT', 'Information Technology', 'Web systems, networks, database administration', true),
('b1000000-0000-0000-0000-000000000005', 'AIML', 'Artificial Intelligence & Machine Learning', 'Neural networks, computer vision, NLP, deep learning', true),
('b1000000-0000-0000-0000-000000000006', 'MECH', 'Mechanical Engineering', 'Thermodynamics, CAD/CAM, robotics, materials', true),
('b1000000-0000-0000-0000-000000000007', 'CIVIL', 'Civil Engineering', 'Structural analysis, geotechnical, construction engineering', true),
('b1000000-0000-0000-0000-000000000008', 'BCA', 'Bachelor of Computer Applications', 'Application software, programming fundamentals', true),
('b1000000-0000-0000-0000-000000000009', 'MCA', 'Master of Computer Applications', 'Advanced software engineering, enterprise architecture', true),
('b1000000-0000-0000-0000-000000000010', 'OTHER', 'Other Engineering Disciplines', 'Interdisciplinary and allied engineering fields', true)
ON CONFLICT (code) DO NOTHING;

-- 2. Initial Categories
INSERT INTO public.categories (id, name, slug, description, icon, display_order, is_active) VALUES
('c1000000-0000-0000-0000-000000000001', 'Programming', 'programming', 'Core software development and computer science concepts', 'Code2', 1, true),
('c1000000-0000-0000-0000-000000000002', 'Python', 'python', 'Python for development, data and automation', 'Terminal', 2, true),
('c1000000-0000-0000-0000-000000000003', 'Java', 'java', 'Enterprise Java, Spring Boot, Microservices', 'Coffee', 3, true),
('c1000000-0000-0000-0000-000000000004', 'Full Stack Development', 'full-stack-development', 'Modern end-to-end full stack web applications', 'Layers', 4, true),
('c1000000-0000-0000-0000-000000000005', 'React', 'react', 'Modern React, hooks, state management, ecosystem', 'Component', 5, true),
('c1000000-0000-0000-0000-000000000006', 'Next.js', 'nextjs', 'Next.js App Router, SSR, Server Actions, Turbopack', 'Globe', 6, true),
('c1000000-0000-0000-0000-000000000007', 'Data Analytics', 'data-analytics', 'Data analysis, SQL, PowerBI, statistical modeling', 'BarChart3', 7, true),
('c1000000-0000-0000-0000-000000000008', 'Artificial Intelligence', 'artificial-intelligence', 'Generative AI, Large Language Models, AI ethics', 'Cpu', 8, true),
('c1000000-0000-0000-0000-000000000009', 'Machine Learning', 'machine-learning', 'Supervised/unsupervised learning, scikit-learn, PyTorch', 'Brain', 9, true),
('c1000000-0000-0000-0000-000000000010', 'Cloud Computing', 'cloud-computing', 'Multi-cloud architectures, serverless, storage', 'Cloud', 10, true),
('c1000000-0000-0000-0000-000000000011', 'AWS', 'aws', 'Amazon Web Services, solutions architect, DevOps on AWS', 'Server', 11, true),
('c1000000-0000-0000-0000-000000000012', 'DevOps', 'devops', 'CI/CD, Docker, Kubernetes, Terraform, monitoring', 'GitMerge', 12, true),
('c1000000-0000-0000-0000-000000000013', 'Embedded Systems', 'embedded-systems', 'Microcontrollers, ARM, RTOS, IoT development', 'CircuitBoard', 13, true),
('c1000000-0000-0000-0000-000000000014', 'VLSI', 'vlsi', 'Verilog, FPGA, digital IC design, ASIC fabrication', 'Zap', 14, true),
('c1000000-0000-0000-0000-000000000015', 'Electrical Engineering', 'electrical-engineering', 'Power electronics, smart grid, motor drives', 'Activity', 15, true),
('c1000000-0000-0000-0000-000000000016', 'Mechanical Engineering', 'mechanical-engineering', 'Ansys, SolidWorks, mechatronics, finite element analysis', 'Settings', 16, true),
('c1000000-0000-0000-0000-000000000017', 'Civil Engineering', 'civil-engineering', 'AutoCAD, STAAD Pro, construction project management', 'Building', 17, true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Subscription Plans (Monthly, Quarterly, Annual)
INSERT INTO public.subscription_plans (id, name, slug, description, interval, duration_days, price, discount_price, is_active, features) VALUES
('d1000000-0000-0000-0000-000000000001', 'Monthly Pass', 'monthly-pass', 'Full access to all eligible engineering courses for 30 days', 'monthly', 30, 1499.00, 999.00, true, '["Unlimited access to 50+ courses", "HD Mux video streaming", "Interactive quizzes & assignments", "Certificate of completion", "Standard community support"]'::jsonb),
('d1000000-0000-0000-0000-000000000002', 'Quarterly Pro', 'quarterly-pro', 'Accelerated learning pass for 90 days with mentor reviews', 'quarterly', 90, 3999.00, 2499.00, true, '["Unlimited access to all courses", "Priority assignment grading", "Direct instructor Q&A", "Verified digital certificate with QR code", "Downloadable source code & notes"]'::jsonb),
('d1000000-0000-0000-0000-000000000003', 'Annual Mastermind', 'annual-mastermind', 'Complete year-round enterprise engineering curriculum pass', 'annual', 365, 12999.00, 7999.00, true, '["All course categories included", "1-on-1 career & resume review", "Placement preparation kit", "Unlimited certificate verifications", "VIP 24/7 support channel"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 4. Platform Settings
INSERT INTO public.platform_settings (key, value, category, description) VALUES
('general', '{"platform_name": "SARVONAYA", "contact_email": "support@sarvonaya.edu", "support_phone": "+91 98765 43210", "platform_status": "operational"}'::jsonb, 'general', 'General platform configuration'),
('branding', '{"primary_color": "#0B3473", "secondary_color": "#1455A0", "gold_color": "#F5BD24", "logo_url": "/logo.svg"}'::jsonb, 'branding', 'Brand visual identity'),
('payments', '{"currency": "INR", "tax_percentage": 18, "tax_name": "GST", "razorpay_enabled": true}'::jsonb, 'payments', 'Payment processing and GST parameters'),
('learning', '{"min_video_completion_pct": 80, "quiz_pass_pct": 70, "allow_preview": true}'::jsonb, 'learning', 'Learning completion rules')
ON CONFLICT (key) DO NOTHING;

