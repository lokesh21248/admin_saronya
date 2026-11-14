// SARVONAYA Role-Based Access Control (RBAC) System
import { UserRole } from '@/types/database';

export const PERMISSIONS = {
  // System & Settings
  ALL_ACCESS: 'all:access',
  MANAGE_ADMINS: 'admins:manage',
  MANAGE_SETTINGS: 'settings:manage',
  VIEW_AUDIT_LOGS: 'audit_logs:view',

  // Students
  VIEW_STUDENTS: 'students:view',
  MANAGE_STUDENTS: 'students:manage',
  EXPORT_STUDENTS: 'students:export',
  GRANT_COMPLIMENTARY_ACCESS: 'students:grant_access',

  // Branches
  MANAGE_BRANCHES: 'branches:manage',

  // Courses & Curriculum
  VIEW_COURSES: 'courses:view',
  MANAGE_COURSES: 'courses:manage',
  PUBLISH_COURSES: 'courses:publish',
  MANAGE_CURRICULUM: 'curriculum:manage',
  MANAGE_VIDEOS: 'videos:manage',

  // Instructors
  MANAGE_INSTRUCTORS: 'instructors:manage',
  VIEW_ASSIGNED_COURSES: 'assigned_courses:view',
  GRADE_ASSIGNMENTS: 'assignments:grade',

  // Finance & Commerce
  VIEW_PAYMENTS: 'payments:view',
  MANAGE_REFUNDS: 'refunds:manage',
  VIEW_SUBSCRIPTIONS: 'subscriptions:view',
  MANAGE_SUBSCRIPTIONS: 'subscriptions:manage',
  MANAGE_COUPONS: 'coupons:manage',
  VIEW_FINANCIAL_REPORTS: 'financial_reports:view',

  // Support
  VIEW_SUPPORT_TICKETS: 'support:view',
  MANAGE_SUPPORT_TICKETS: 'support:manage',

  // Reports
  VIEW_REPORTS: 'reports:view',
  EXPORT_REPORTS: 'reports:export',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    PERMISSIONS.ALL_ACCESS,
    PERMISSIONS.MANAGE_ADMINS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.EXPORT_STUDENTS,
    PERMISSIONS.GRANT_COMPLIMENTARY_ACCESS,
    PERMISSIONS.MANAGE_BRANCHES,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.PUBLISH_COURSES,
    PERMISSIONS.MANAGE_CURRICULUM,
    PERMISSIONS.MANAGE_VIDEOS,
    PERMISSIONS.MANAGE_INSTRUCTORS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.MANAGE_REFUNDS,
    PERMISSIONS.VIEW_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_COUPONS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_SUPPORT_TICKETS,
    PERMISSIONS.MANAGE_SUPPORT_TICKETS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.GRADE_ASSIGNMENTS,
  ],
  admin: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.EXPORT_STUDENTS,
    PERMISSIONS.GRANT_COMPLIMENTARY_ACCESS,
    PERMISSIONS.MANAGE_BRANCHES,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.PUBLISH_COURSES,
    PERMISSIONS.MANAGE_CURRICULUM,
    PERMISSIONS.MANAGE_VIDEOS,
    PERMISSIONS.MANAGE_INSTRUCTORS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_COUPONS,
    PERMISSIONS.VIEW_SUPPORT_TICKETS,
    PERMISSIONS.MANAGE_SUPPORT_TICKETS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.GRADE_ASSIGNMENTS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  course_manager: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.PUBLISH_COURSES,
    PERMISSIONS.MANAGE_CURRICULUM,
    PERMISSIONS.MANAGE_VIDEOS,
    PERMISSIONS.VIEW_REPORTS,
  ],
  instructor: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_ASSIGNED_COURSES,
    PERMISSIONS.MANAGE_CURRICULUM,
    PERMISSIONS.GRADE_ASSIGNMENTS,
  ],
  finance_manager: [
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.MANAGE_REFUNDS,
    PERMISSIONS.VIEW_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_COUPONS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
  ],
  support_manager: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_SUPPORT_TICKETS,
    PERMISSIONS.MANAGE_SUPPORT_TICKETS,
  ],
  student: [],
};

export function hasPermission(userRoles: UserRole[], requiredPermission: Permission): boolean {
  if (userRoles.includes('super_admin')) return true;
  for (const role of userRoles) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    if (permissions.includes(requiredPermission) || permissions.includes(PERMISSIONS.ALL_ACCESS)) {
      return true;
    }
  }
  return false;
}

export function hasAnyRole(userRoles: UserRole[], allowedRoles: UserRole[]): boolean {
  if (userRoles.includes('super_admin')) return true;
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'admin': return 'Admin';
    case 'course_manager': return 'Course Manager';
    case 'instructor': return 'Instructor';
    case 'finance_manager': return 'Finance Manager';
    case 'support_manager': return 'Support Manager';
    case 'student': return 'Student';
    default: return role;
  }
}

