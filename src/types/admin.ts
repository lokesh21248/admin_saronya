// SARVONAYA Admin System Types & Interfaces
import { UserRole } from './database';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  permissions: string[];
  avatarUrl?: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  publishedCourses: number;
  totalInstructors: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingPayments: number;
  studentGrowthPct: number;
  revenueGrowthPct: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface EnrollmentDataPoint {
  date: string;
  enrollments: number;
  completions: number;
}

export interface PopularCourse {
  id: string;
  title: string;
  category: string;
  enrolledCount: number;
  revenue: number;
  rating: number;
}

export type DashboardDateFilter = 'today' | '7days' | '30days' | '90days' | 'custom';

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

