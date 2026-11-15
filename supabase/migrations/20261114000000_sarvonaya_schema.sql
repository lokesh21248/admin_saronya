-- ============================================================================
-- SARVONAYA Enterprise Online Education Platform
-- Production PostgreSQL Database Migration & Seed Script
-- Compatible with Supabase SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 0. CLEAN RESET (Safely drop conflicting prior tables if any exist)
-- ============================================================================
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.platform_settings CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.coupon_redemptions CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.refunds CASCADE;
DROP TABLE IF EXISTS public.payment_events CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.quiz_answers CASCADE;
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.quiz_options CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.lesson_completions CASCADE;
DROP TABLE IF EXISTS public.watch_progress CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.lesson_resources CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.course_sections CASCADE;
DROP TABLE IF EXISTS public.instructor_courses CASCADE;
DROP TABLE IF EXISTS public.course_branch_mapping CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.academic_qualifications CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.academic_branches CASCADE;

-- ============================================================================
-- 1. IDENTITY, ROLES & ACADEMIC BRANCHES
-- ============================================================================

-- Academic Branches Table
CREATE TABLE public.academic_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Profiles Table (Linked to Clerk/Supabase Auth UUID)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- User Roles Table (Supports multi-role RBAC: super_admin, admin, course_manager, instructor, finance_manager, support_manager, student)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'course_manager', 'instructor', 'finance_manager', 'support_manager', 'student')),
    granted_by UUID REFERENCES public.profiles(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, role)
);

-- Role Permissions Matrix
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(role, permission)
);

-- Academic Qualifications Table (Student-specific verified details)
CREATE TABLE public.academic_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.academic_branches(id) ON DELETE SET NULL,
    college_name VARCHAR(255),
    degree VARCHAR(100),
    passed_out_year INTEGER,
    roll_number VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id)
);

-- ============================================================================
-- 2. COURSES, CATEGORIES & CURRICULUM
-- ============================================================================

-- Course Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    thumbnail_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Courses Table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    full_description TEXT,
    thumbnail_url TEXT,
    preview_video_url TEXT,
    preview_mux_playback_id VARCHAR(255),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    primary_instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    difficulty_level VARCHAR(50) NOT NULL DEFAULT 'all_levels' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
    duration_hours NUMERIC(6,2) DEFAULT 0,
    language VARCHAR(50) NOT NULL DEFAULT 'English',
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_price NUMERIC(10,2),
    is_subscription_eligible BOOLEAN NOT NULL DEFAULT true,
    access_duration_days INTEGER DEFAULT 365,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Course Academic Branch Mapping (One course to multiple or all branches)
CREATE TABLE public.course_branch_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.academic_branches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(course_id, branch_id)
);

-- Instructor Course Assignment
CREATE TABLE public.instructor_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    can_edit_curriculum BOOLEAN NOT NULL DEFAULT true,
    can_grade_assignments BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(instructor_id, course_id)
);

-- Course Sections Table
CREATE TABLE public.course_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Lessons Table
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    lesson_type VARCHAR(50) NOT NULL DEFAULT 'video' CHECK (lesson_type IN ('video', 'article', 'quiz', 'assignment')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    is_preview BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    mux_asset_id VARCHAR(255),
    mux_playback_id VARCHAR(255),
    video_duration NUMERIC(10,2),
    duration_seconds NUMERIC(10,2),
    video_status VARCHAR(50) DEFAULT 'ready' CHECK (video_status IN ('uploading', 'processing', 'ready', 'errored', 'archived')),
    video_resolution VARCHAR(50),
    article_content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Lesson Resources Table
CREATE TABLE public.lesson_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL DEFAULT 'pdf' CHECK (resource_type IN ('pdf', 'code', 'link', 'document')),
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 3. LEARNING, PROGRESS, ASSESSMENTS & CERTIFICATES
-- ============================================================================

-- Enrollments Table
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('individual_purchase', 'subscription_monthly', 'subscription_quarterly', 'subscription_annual', 'complimentary')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ,
    granted_by UUID REFERENCES public.profiles(id),
    grant_reason TEXT,
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT,
    UNIQUE(student_id, course_id)
);

-- Watch Progress Table
CREATE TABLE public.watch_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    total_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    last_position_seconds INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, lesson_id)
);

-- Lesson Completions Table
CREATE TABLE public.lesson_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, lesson_id)
);

-- Quizzes Table
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    pass_percentage NUMERIC(5,2) NOT NULL DEFAULT 70.0,
    time_limit_minutes INTEGER DEFAULT 30,
    max_retakes INTEGER DEFAULT 3,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Quiz Questions Table
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'multiple_select', 'true_false', 'short_answer')),
    marks INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Quiz Options Table
CREATE TABLE public.quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Quiz Attempts Table
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_marks INTEGER NOT NULL DEFAULT 0,
    is_passed BOOLEAN NOT NULL DEFAULT false,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- Quiz Answers Table
CREATE TABLE public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.quiz_options(id),
    text_answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    marks_awarded NUMERIC(5,2) DEFAULT 0
);

-- Assignments Table
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    reference_file_url TEXT,
    max_marks INTEGER NOT NULL DEFAULT 100,
    due_date TIMESTAMPTZ,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Assignment Submissions Table
CREATE TABLE public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_file_url TEXT NOT NULL,
    submission_notes TEXT,
    marks_awarded NUMERIC(5,2),
    feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'graded', 'resubmission_requested')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(assignment_id, student_id)
);

-- Certificates Table
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_code VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    issue_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    pdf_url TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revocation_reason TEXT,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, course_id)
);

-- ============================================================================
-- 4. COMMERCE, PAYMENTS, SUBSCRIPTIONS & COUPONS
-- ============================================================================

-- Subscription Plans Table
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    interval VARCHAR(50) NOT NULL CHECK (interval IN ('monthly', 'quarterly', 'annual')),
    duration_days INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    discount_price NUMERIC(10,2),
    razorpay_plan_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Subscriptions Table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    razorpay_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'active', 'past_due', 'cancelled', 'expired', 'refunded')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Orders Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    order_type VARCHAR(50) NOT NULL CHECK (order_type IN ('course_purchase', 'subscription')),
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    subscription_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    coupon_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
    razorpay_order_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Payments Table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
    method VARCHAR(50),
    payment_email VARCHAR(255),
    payment_contact VARCHAR(50),
    captured_at TIMESTAMPTZ,
    error_code VARCHAR(100),
    error_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Immutable Payment Events Table
CREATE TABLE public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Refunds Table
CREATE TABLE public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    razorpay_refund_id VARCHAR(255) UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'failed')),
    initiated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Coupons Table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL,
    min_order_amount NUMERIC(10,2) DEFAULT 0,
    max_discount_amount NUMERIC(10,2),
    start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expiry_date TIMESTAMPTZ,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    per_student_limit INTEGER NOT NULL DEFAULT 1,
    eligible_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    eligible_branch_id UUID REFERENCES public.academic_branches(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Coupon Redemptions Table
CREATE TABLE public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_applied NUMERIC(10,2) NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 5. NOTIFICATIONS, SUPPORT & COMMUNICATIONS
-- ============================================================================

-- Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    audience VARCHAR(50) NOT NULL DEFAULT 'all_students' CHECK (audience IN ('all_students', 'branch_specific', 'individual')),
    target_branch_id UUID REFERENCES public.academic_branches(id) ON DELETE SET NULL,
    target_student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'both')),
    status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Support Tickets Table
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_student', 'resolved', 'closed')),
    assigned_staff_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Support Messages Table
CREATE TABLE public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachment_url TEXT,
    is_internal_note BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 6. PLATFORM SETTINGS & AUDIT LOGS
-- ============================================================================

-- Platform Settings Table
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Immutable Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- INDEXES FOR HIGH PERFORMANCE
-- ============================================================================

CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_category ON public.courses(category_id);
CREATE INDEX idx_lessons_section ON public.lessons(section_id, sort_order);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_subscriptions_student ON public.subscriptions(student_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.academic_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_branch_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public / Anonymous Read Policies
CREATE POLICY "Public can view active branches" ON public.academic_branches FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view published courses" ON public.courses FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view published sections" ON public.course_sections FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view preview lessons" ON public.lessons FOR SELECT USING (is_published = true AND is_preview = true);
CREATE POLICY "Public can view active subscription plans" ON public.subscription_plans FOR SELECT USING (is_active = true);

-- Authenticated Users Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Users can view own progress" ON public.watch_progress FOR ALL TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = student_id);

-- Service Role Full Admin Operations
CREATE POLICY "Service role full access on branches" ON public.academic_branches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_roles" ON public.user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on courses" ON public.courses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on sections" ON public.course_sections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on lessons" ON public.lessons FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on enrollments" ON public.enrollments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on payments" ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on audit_logs" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on settings" ON public.platform_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on tickets" ON public.support_tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on certificates" ON public.certificates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. INITIAL PRODUCTION SEED RECORDS
-- ============================================================================

-- Academic Branches
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

-- Initial 17 Subject Categories
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

-- Subscription Plans
INSERT INTO public.subscription_plans (id, name, slug, description, interval, duration_days, price, discount_price, is_active, features) VALUES
('d1000000-0000-0000-0000-000000000001', 'Monthly Pass', 'monthly-pass', 'Full access to all eligible engineering courses for 30 days', 'monthly', 30, 1499.00, 999.00, true, '["Unlimited access to 50+ courses", "HD Mux video streaming", "Interactive quizzes & assignments", "Certificate of completion", "Standard community support"]'::jsonb),
('d1000000-0000-0000-0000-000000000002', 'Quarterly Pro', 'quarterly-pro', 'Accelerated learning pass for 90 days with mentor reviews', 'quarterly', 90, 3999.00, 2499.00, true, '["Unlimited access to all courses", "Priority assignment grading", "Direct instructor Q&A", "Verified digital certificate with QR code", "Downloadable source code & notes"]'::jsonb),
('d1000000-0000-0000-0000-000000000003', 'Annual Mastermind', 'annual-mastermind', 'Complete year-round enterprise engineering curriculum pass', 'annual', 365, 12999.00, 7999.00, true, '["All course categories included", "1-on-1 career & resume review", "Placement preparation kit", "Unlimited certificate verifications", "VIP 24/7 support channel"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Platform Settings
INSERT INTO public.platform_settings (key, value, category, description) VALUES
('general', '{"platform_name": "SARVONAYA", "contact_email": "support@sarvonaya.edu", "support_phone": "+91 98765 43210", "platform_status": "operational"}'::jsonb, 'general', 'General platform configuration'),
('branding', '{"primary_color": "#0B3473", "secondary_color": "#1455A0", "gold_color": "#F5BD24", "logo_url": "/logo.svg"}'::jsonb, 'branding', 'Brand visual identity'),
('payments', '{"currency": "INR", "tax_percentage": 18, "tax_name": "GST", "razorpay_enabled": true}'::jsonb, 'payments', 'Payment processing and GST parameters'),
('learning', '{"min_video_completion_pct": 80, "quiz_pass_pct": 70, "allow_preview": true}'::jsonb, 'learning', 'Learning completion rules')
ON CONFLICT (key) DO NOTHING;
