// SARVONAYA Database TypeScript Definitions
export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'course_manager'
  | 'instructor'
  | 'finance_manager'
  | 'support_manager'
  | 'student';

export type UserStatus = 'active' | 'suspended' | 'inactive';

export interface Profile {
  id: string;
  clerk_id?: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  roles?: UserRole[];
  academic_qualification?: any;
  enrolled_courses_count?: number;
  completed_courses_count?: number;
  total_spent?: number;
  subscription_status?: string;
  assigned_courses_count?: number;
  active_students_count?: number;
  rating?: number;
}

export interface PlatformSetting {
  id?: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicBranch {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  courses_count?: number;
  students_count?: number;
}

export interface AcademicQualification {
  id: string;
  student_id: string;
  branch_id?: string;
  college_name?: string;
  degree?: string;
  passed_out_year?: number;
  roll_number?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  branch?: AcademicBranch;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  thumbnail_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  courses_count?: number;
}

export type CourseStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';

export interface Course {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  full_description?: string;
  thumbnail_url?: string;
  preview_video_url?: string;
  preview_mux_playback_id?: string;
  category_id?: string;
  primary_instructor_id?: string;
  difficulty_level: DifficultyLevel;
  duration_hours: number;
  language: string;
  price: number;
  discount_price?: number;
  is_subscription_eligible: boolean;
  access_duration_days: number;
  status: CourseStatus;
  published_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  primary_instructor?: Profile;
  branches?: AcademicBranch[];
  sections_count?: number;
  lessons_count?: number;
  enrollments_count?: number;
  enrolled_count?: number;
  average_rating?: number;
  reviews_count?: number;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
}

export type LessonType = 'video' | 'article' | 'quiz' | 'assignment';
export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'errored' | 'archived';

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  slug: string;
  description?: string;
  lesson_type: LessonType;
  sort_order: number;
  duration_minutes: number;
  is_preview: boolean;
  is_published: boolean;
  mux_asset_id?: string;
  mux_playback_id?: string;
  video_duration?: number;
  video_status?: VideoStatus;
  video_resolution?: string;
  article_content?: string;
  created_at: string;
  updated_at: string;
  resources?: LessonResource[];
}

export interface LessonResource {
  id: string;
  lesson_id: string;
  title: string;
  resource_type: 'pdf' | 'code' | 'link' | 'document';
  file_url: string;
  file_size_bytes?: number;
  sort_order: number;
  created_at: string;
}

export type AccessType = 
  | 'individual_purchase'
  | 'subscription_monthly'
  | 'subscription_quarterly'
  | 'subscription_annual'
  | 'complimentary';

export type EnrollmentStatus = 'active' | 'expired' | 'revoked' | 'suspended';

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  access_type: AccessType;
  status: EnrollmentStatus;
  enrolled_at: string;
  expires_at?: string;
  granted_by?: string;
  grant_reason?: string;
  revoked_at?: string;
  revoke_reason?: string;
  student?: Profile;
  course?: Course;
  progress_percentage?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  interval: 'monthly' | 'quarterly' | 'annual';
  duration_days: number;
  price: number;
  discount_price?: number;
  razorpay_plan_id?: string;
  is_active: boolean;
  features: string[];
  created_at: string;
  updated_at: string;
  active_subscribers_count?: number;
}

export type SubscriptionStatus = 
  | 'created'
  | 'pending'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'refunded';

export interface Subscription {
  id: string;
  student_id: string;
  plan_id: string;
  razorpay_subscription_id?: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
  plan?: SubscriptionPlan;
}

export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  order_id: string;
  student_id: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  payment_method?: string;
  payment_email?: string;
  payment_contact?: string;
  captured_at?: string;
  error_code?: string;
  error_description?: string;
  tax_amount?: number;
  created_at: string;
  student?: Profile;
  order?: any;
  course_title?: string;
}

export interface Refund {
  id: string;
  payment_id: string;
  razorpay_refund_id?: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  initiated_by?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  min_order_value?: number;
  max_discount_amount?: number;
  max_discount?: number;
  start_date: string;
  expiry_date?: string;
  valid_from?: string;
  valid_until?: string;
  max_uses?: number;
  used_count: number;
  current_uses?: number;
  per_student_limit: number;
  eligible_course_id?: string;
  eligible_branch_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  description?: string;
  pass_percentage: number;
  time_limit_minutes: number;
  max_retakes: number;
  is_published: boolean;
  questions_count?: number;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface Assignment {
  id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  instructions: string;
  reference_file_url?: string;
  max_marks: number;
  due_date?: string;
  is_published: boolean;
  submissions_count?: number;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface Certificate {
  id: string;
  certificate_code: string;
  student_id: string;
  course_id: string;
  issue_date: string;
  pdf_url?: string;
  is_revoked: boolean;
  revocation_reason?: string;
  student?: Profile;
  course?: Course;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  student_id: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_student' | 'resolved' | 'closed';
  assigned_staff_id?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
  assigned_staff?: Profile;
  messages_count?: number;
  messages?: any[];
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  audience: 'all_students' | 'branch_specific' | 'individual';
  target_branch_id?: string;
  target_student_id?: string;
  channel: 'in_app' | 'email' | 'both';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  sent_count: number;
  failed_count: number;
  scheduled_at?: string;
  sent_at: string;
  created_at: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  mobile_image_url?: string;
  button_text?: string;
  button_link?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type Banner = HeroBanner;

export interface PromotionalBanner {
  id: string;
  title: string;
  badge_text?: string;
  callout_text?: string;
  description?: string;
  cta_text?: string;
  cta_url?: string;
  background_color?: string;
  text_color?: string;
  image_url?: string;
  mobile_image_url?: string;
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

