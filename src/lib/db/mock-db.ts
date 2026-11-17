// SARVONAYA In-Memory Database Store (Clean state with no dummy data)
import {
  Profile,
  AcademicBranch,
  Category,
  Course,
  CourseSection,
  Lesson,
  Enrollment,
  SubscriptionPlan,
  Subscription,
  Payment,
  Coupon,
  Quiz,
  Assignment,
  Certificate,
  SupportTicket,
  AuditLog,
  NotificationRecord,
  PromotionalBanner,
} from '@/types/database';

class SarvonayaDataStore {
  public branches: AcademicBranch[] = [];
  public categories: Category[] = [];
  public profiles: Profile[] = [];
  public courses: Course[] = [];
  public sections: CourseSection[] = [];
  public lessons: Lesson[] = [];
  public subscriptionPlans: SubscriptionPlan[] = [];
  public subscriptions: Subscription[] = [];
  public enrollments: Enrollment[] = [];
  public payments: Payment[] = [];
  public coupons: Coupon[] = [];
  public quizzes: Quiz[] = [];
  public assignments: Assignment[] = [];
  public certificates: Certificate[] = [];
  public supportTickets: SupportTicket[] = [];
  public auditLogs: AuditLog[] = [];
  public notifications: NotificationRecord[] = [];
  public banners: PromotionalBanner[] = [];

  public platformSettings = {
    general: {
      platform_name: 'SARVONAYA',
      contact_email: 'support@sarvonaya.edu',
      support_phone: '+91 98401 12345',
      platform_status: 'operational',
      student_portal_url: 'https://saronaya.vercel.app',
    },
    branding: {
      primary_color: '#0B3473',
      secondary_color: '#1455A0',
      gold_color: '#F5BD24',
      logo_text: 'SARVONAYA',
      tagline: 'Enterprise Online Education Platform',
    },
    payments: {
      currency: 'INR',
      tax_name: 'GST',
      tax_percentage: 18,
      razorpay_account_name: 'SARVONAYA EDUTECH PVT LTD',
      razorpay_test_mode: true,
      auto_refund_window_days: 7,
    },
    learning: {
      min_video_completion_pct: 80,
      quiz_pass_pct: 70,
      enable_watermarking: true,
      allow_preview_lessons: true,
    },
    security: {
      session_timeout_minutes: 120,
      enforce_mfa_for_admins: true,
      ip_whitelist_enabled: false,
    },
  };
}

// Global singleton instance so mutations persist across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __sarvonaya_db__: SarvonayaDataStore | undefined;
}

export const mockDb = global.__sarvonaya_db__ || new SarvonayaDataStore();
if (process.env.NODE_ENV !== 'production') {
  global.__sarvonaya_db__ = mockDb;
}
