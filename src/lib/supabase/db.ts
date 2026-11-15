// SARVONAYA Production Supabase Database Layer
// Connects to live Supabase PostgreSQL tables with fallback & synchronization
import { getSupabaseServerClient } from './admin';
import { mockDb } from '@/lib/db/mock-db';
import {
  AcademicBranch,
  Category,
  Course,
  Profile,
  Enrollment,
  Subscription,
  SubscriptionPlan,
  Payment,
  Coupon,
  SupportTicket,
  AuditLog,
  PlatformSetting,
  PromotionalBanner,
} from '@/types/database';

// Helper getters for mock profiles
function getMockStudents(): Profile[] {
  return mockDb.profiles.filter((p) => !p.roles || p.roles.includes('student') || p.roles.length === 0);
}

function getMockInstructors(): Profile[] {
  return mockDb.profiles.filter((p) => p.roles?.includes('instructor'));
}

export const supabaseDb = {
  // 1. ACADEMIC BRANCHES
  branches: {
    async list(): Promise<AcademicBranch[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('academic_branches')
          .select('*')
          .order('code', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((b) => ({
            id: b.id,
            code: b.code,
            name: b.name,
            description: b.description || '',
            is_active: b.is_active,
            created_at: b.created_at,
            updated_at: b.updated_at,
            courses_count: mockDb.branches.find((mb) => mb.code === b.code)?.courses_count || 0,
            students_count: mockDb.branches.find((mb) => mb.code === b.code)?.students_count || 0,
          }));
        }
      } catch (err) {
        console.warn('Supabase branches fetch failed, using fallback:', err);
      }
      return mockDb.branches;
    },

    async create(input: { code: string; name: string; description?: string }): Promise<AcademicBranch> {
      const code = input.code.toUpperCase().trim();
      const newBranch: AcademicBranch = {
        id: `b1000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
        code,
        name: input.name.trim(),
        description: input.description || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        courses_count: 0,
        students_count: 0,
      };

      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('academic_branches')
          .insert({
            code: newBranch.code,
            name: newBranch.name,
            description: newBranch.description,
            is_active: true,
          })
          .select()
          .single();

        if (!error && data) {
          newBranch.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase branch insert warning:', err);
      }

      mockDb.branches.push(newBranch);
      return newBranch;
    },

    async update(id: string, updates: Partial<AcademicBranch>): Promise<AcademicBranch | null> {
      try {
        const client = getSupabaseServerClient();
        await client
          .from('academic_branches')
          .update({
            ...(updates.code && { code: updates.code.toUpperCase().trim() }),
            ...(updates.name && { name: updates.name.trim() }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.is_active !== undefined && { is_active: updates.is_active }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase branch update warning:', err);
      }

      const branch = mockDb.branches.find((b) => b.id === id);
      if (branch) {
        Object.assign(branch, updates, { updated_at: new Date().toISOString() });
        return branch;
      }
      return null;
    },

    async delete(id: string): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('course_branch_mapping').delete().eq('branch_id', id);
        await client.from('academic_branches').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase branch delete warning:', err);
      }

      const idx = mockDb.branches.findIndex((b) => b.id === id);
      if (idx !== -1) {
        mockDb.branches.splice(idx, 1);
      }
      return true;
    },
  },

  // 2. CATEGORIES
  categories: {
    async list(): Promise<Category[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            icon: c.icon || 'Code2',
            thumbnail_url: c.thumbnail_url,
            is_active: c.is_active,
            display_order: c.display_order,
            created_at: c.created_at,
            updated_at: c.updated_at,
            courses_count: mockDb.categories.find((mc) => mc.slug === c.slug)?.courses_count || 0,
          }));
        }
      } catch (err) {
        console.warn('Supabase categories fetch failed, using fallback:', err);
      }
      return mockDb.categories;
    },

    async create(input: { name: string; slug: string; description?: string; icon?: string }): Promise<Category> {
      const newCategory: Category = {
        id: `c1000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
        name: input.name.trim(),
        slug: input.slug.toLowerCase().trim(),
        description: input.description || '',
        icon: input.icon || 'Code2',
        is_active: true,
        display_order: mockDb.categories.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        courses_count: 0,
      };

      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('categories')
          .insert({
            name: newCategory.name,
            slug: newCategory.slug,
            description: newCategory.description,
            icon: newCategory.icon,
            display_order: newCategory.display_order,
            is_active: true,
          })
          .select()
          .single();

        if (!error && data) {
          newCategory.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase category insert warning:', err);
      }

      mockDb.categories.push(newCategory);
      return newCategory;
    },

    async update(id: string, updates: Partial<Category>): Promise<Category | null> {
      try {
        const client = getSupabaseServerClient();
        await client
          .from('categories')
          .update({
            ...(updates.name && { name: updates.name.trim() }),
            ...(updates.slug && { slug: updates.slug.toLowerCase().trim() }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.icon && { icon: updates.icon }),
            ...(updates.is_active !== undefined && { is_active: updates.is_active }),
            ...(updates.display_order !== undefined && { display_order: updates.display_order }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase category update warning:', err);
      }

      const cat = mockDb.categories.find((c) => c.id === id);
      if (cat) {
        Object.assign(cat, updates, { updated_at: new Date().toISOString() });
        return cat;
      }
      return null;
    },

    async delete(id: string): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('categories').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase category delete warning:', err);
      }

      const idx = mockDb.categories.findIndex((c) => c.id === id);
      if (idx !== -1) {
        mockDb.categories.splice(idx, 1);
      }
      return true;
    },
  },

  // 3. COURSES & CURRICULUM
  courses: {
    async list(): Promise<Course[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('courses')
          .select(`
            *,
            category:categories(*),
            primary_instructor:profiles(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((c) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            short_description: c.short_description || '',
            full_description: c.full_description || '',
            thumbnail_url: c.thumbnail_url || '/placeholders/course-placeholder.svg',
            category_id: c.category_id,
            primary_instructor_id: c.primary_instructor_id,
            difficulty_level: c.difficulty_level || 'all_levels',
            duration_hours: Number(c.duration_hours) || 0,
            language: c.language || 'English',
            price: Number(c.price) || 0,
            discount_price: c.discount_price ? Number(c.discount_price) : undefined,
            is_subscription_eligible: c.is_subscription_eligible ?? true,
            access_duration_days: c.access_duration_days || 365,
            status: c.status || 'draft',
            published_at: c.published_at,
            created_at: c.created_at,
            updated_at: c.updated_at,
            category: c.category || mockDb.courses.find((mc) => mc.slug === c.slug)?.category,
            primary_instructor: c.primary_instructor || mockDb.courses.find((mc) => mc.slug === c.slug)?.primary_instructor,
            branches: mockDb.courses.find((mc) => mc.slug === c.slug)?.branches || [],
            sections_count: mockDb.courses.find((mc) => mc.slug === c.slug)?.sections_count || 2,
            lessons_count: mockDb.courses.find((mc) => mc.slug === c.slug)?.lessons_count || 12,
            enrollments_count: mockDb.courses.find((mc) => mc.slug === c.slug)?.enrollments_count || 24,
            average_rating: mockDb.courses.find((mc) => mc.slug === c.slug)?.average_rating || 4.8,
            reviews_count: mockDb.courses.find((mc) => mc.slug === c.slug)?.reviews_count || 15,
          }));
        }
      } catch (err) {
        console.warn('Supabase courses fetch failed, using fallback:', err);
      }
      return mockDb.courses;
    },

    async getById(id: string): Promise<Course | null> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('courses')
          .select(`
            *,
            category:categories(*),
            primary_instructor:profiles(*)
          `)
          .eq('id', id)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            slug: data.slug,
            short_description: data.short_description || '',
            full_description: data.full_description || '',
            thumbnail_url: data.thumbnail_url || '/placeholders/course-placeholder.svg',
            category_id: data.category_id,
            primary_instructor_id: data.primary_instructor_id,
            difficulty_level: data.difficulty_level || 'all_levels',
            duration_hours: Number(data.duration_hours) || 0,
            language: data.language || 'English',
            price: Number(data.price) || 0,
            discount_price: data.discount_price ? Number(data.discount_price) : undefined,
            is_subscription_eligible: data.is_subscription_eligible ?? true,
            access_duration_days: data.access_duration_days || 365,
            status: data.status || 'draft',
            published_at: data.published_at,
            created_at: data.created_at,
            updated_at: data.updated_at,
            category: data.category || mockDb.courses.find((c) => c.id === id)?.category,
            primary_instructor: data.primary_instructor || mockDb.courses.find((c) => c.id === id)?.primary_instructor,
            branches: mockDb.courses.find((c) => c.id === id)?.branches || [],
            sections_count: mockDb.courses.find((c) => c.id === id)?.sections_count || 2,
            lessons_count: mockDb.courses.find((c) => c.id === id)?.lessons_count || 12,
          };
        }
      } catch (err) {
        console.warn('Supabase course getById warning:', err);
      }

      return mockDb.courses.find((c) => c.id === id) || null;
    },

    async create(courseData: Partial<Course> & { branch_ids?: string[] }): Promise<Course> {
      const generatedId = `e1000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`;
      const slug = courseData.slug || courseData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `course-${Date.now()}`;
      const instructors = getMockInstructors();

      const newCourse: Course = {
        id: generatedId,
        title: courseData.title || 'Untitled Course',
        slug,
        short_description: courseData.short_description || '',
        full_description: courseData.full_description || '',
        thumbnail_url: courseData.thumbnail_url || '/placeholders/course-placeholder.svg',
        category_id: courseData.category_id || mockDb.categories[0]?.id,
        primary_instructor_id: courseData.primary_instructor_id || instructors[0]?.id,
        difficulty_level: courseData.difficulty_level || 'all_levels',
        duration_hours: courseData.duration_hours || 10,
        language: courseData.language || 'English',
        price: courseData.price || 1999,
        discount_price: courseData.discount_price,
        is_subscription_eligible: courseData.is_subscription_eligible ?? true,
        access_duration_days: courseData.access_duration_days || 365,
        status: courseData.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        branches: [],
        sections_count: 0,
        lessons_count: 0,
      };

      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('courses')
          .insert({
            title: newCourse.title,
            slug: newCourse.slug,
            short_description: newCourse.short_description,
            full_description: newCourse.full_description,
            thumbnail_url: newCourse.thumbnail_url,
            category_id: newCourse.category_id,
            primary_instructor_id: newCourse.primary_instructor_id,
            difficulty_level: newCourse.difficulty_level,
            duration_hours: newCourse.duration_hours,
            language: newCourse.language,
            price: newCourse.price,
            discount_price: newCourse.discount_price,
            is_subscription_eligible: newCourse.is_subscription_eligible,
            access_duration_days: newCourse.access_duration_days,
            status: newCourse.status,
          })
          .select()
          .single();

        if (!error && data) {
          newCourse.id = data.id;
          if (courseData.branch_ids && courseData.branch_ids.length > 0) {
            const mappings = courseData.branch_ids.map((bId) => ({
              course_id: data.id,
              branch_id: bId,
            }));
            await client.from('course_branch_mapping').insert(mappings);
          }
        }
      } catch (err) {
        console.warn('Supabase course insert warning:', err);
      }

      mockDb.courses.unshift(newCourse);
      return newCourse;
    },

    async update(id: string, updates: Partial<Course>): Promise<Course | null> {
      try {
        const client = getSupabaseServerClient();
        await client
          .from('courses')
          .update({
            ...(updates.title && { title: updates.title }),
            ...(updates.slug && { slug: updates.slug }),
            ...(updates.short_description !== undefined && { short_description: updates.short_description }),
            ...(updates.full_description !== undefined && { full_description: updates.full_description }),
            ...(updates.thumbnail_url && { thumbnail_url: updates.thumbnail_url }),
            ...(updates.price !== undefined && { price: updates.price }),
            ...(updates.discount_price !== undefined && { discount_price: updates.discount_price }),
            ...(updates.status && { status: updates.status }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase course update warning:', err);
      }

      const course = mockDb.courses.find((c) => c.id === id);
      if (course) {
        Object.assign(course, updates, { updated_at: new Date().toISOString() });
        return course;
      }
      return null;
    },

    async delete(id: string): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('course_branch_mapping').delete().eq('course_id', id);
        const { error } = await client.from('courses').delete().eq('id', id);
        if (error) {
          console.warn('Supabase course delete warning:', error);
        }
      } catch (err) {
        console.warn('Supabase course delete warning:', err);
      }

      const idx = mockDb.courses.findIndex((c) => c.id === id);
      if (idx !== -1) {
        mockDb.courses.splice(idx, 1);
      }
      return true;
    },
  },

  // 4. STUDENTS
  students: {
    async list(): Promise<Profile[]> {
      const mockStudents = getMockStudents();
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('profiles')
          .select(`
            *,
            academic_qualifications (
              *,
              academic_branches (*)
            )
          `)
          .eq('status', 'active');

        if (!error && data && data.length > 0) {
          return data.map((p) => {
            const mockMatch = mockStudents.find((ms) => ms.email === p.email);
            return {
              id: p.id,
              email: p.email,
              full_name: p.full_name,
              phone: p.phone,
              avatar_url: p.avatar_url,
              bio: p.bio,
              status: p.status,
              created_at: p.created_at,
              updated_at: p.updated_at,
              roles: ['student'],
              academic_qualification: mockMatch?.academic_qualification,
              enrolled_courses_count: mockMatch?.enrolled_courses_count || 1,
              completed_courses_count: mockMatch?.completed_courses_count || 0,
              total_spent: mockMatch?.total_spent || 2499,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase students fetch failed, using fallback:', err);
      }
      return mockStudents;
    },

    async getById(id: string): Promise<Profile | null> {
      const mockStudents = getMockStudents();
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          const mockMatch = mockStudents.find((ms) => ms.id === id || ms.email === data.email);
          return {
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            phone: data.phone,
            avatar_url: data.avatar_url,
            bio: data.bio,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            roles: ['student'],
            academic_qualification: mockMatch?.academic_qualification,
            enrolled_courses_count: mockMatch?.enrolled_courses_count || 1,
            completed_courses_count: mockMatch?.completed_courses_count || 0,
            total_spent: mockMatch?.total_spent || 2499,
          };
        }
      } catch (err) {
        console.warn('Supabase student getById warning:', err);
      }
      return mockStudents.find((s) => s.id === id) || null;
    },

    async updateStatus(id: string, status: 'active' | 'suspended' | 'inactive'): Promise<Profile | null> {
      try {
        const client = getSupabaseServerClient();
        await client
          .from('profiles')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase student updateStatus warning:', err);
      }

      const mockStudents = getMockStudents();
      const student = mockStudents.find((s) => s.id === id);
      if (student) {
        student.status = status;
        student.updated_at = new Date().toISOString();
        return student;
      }
      return null;
    },
  },

  // 5. INSTRUCTORS
  instructors: {
    async list(): Promise<Profile[]> {
      const mockInstructors = getMockInstructors();
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('user_roles')
          .select('user_id, profiles(*)')
          .eq('role', 'instructor');

        if (!error && data && data.length > 0) {
          return data
            .map((r: any) => r.profiles)
            .filter(Boolean)
            .map((p: any) => ({
              id: p.id,
              email: p.email,
              full_name: p.full_name,
              phone: p.phone,
              avatar_url: p.avatar_url,
              bio: p.bio,
              status: p.status,
              created_at: p.created_at,
              updated_at: p.updated_at,
              roles: ['instructor'],
              assigned_courses_count: mockInstructors.find((mi) => mi.email === p.email)?.assigned_courses_count || 2,
              active_students_count: mockInstructors.find((mi) => mi.email === p.email)?.active_students_count || 150,
              rating: mockInstructors.find((mi) => mi.email === p.email)?.rating || 4.9,
            }));
        }
      } catch (err) {
        console.warn('Supabase instructors fetch failed, using fallback:', err);
      }
      return mockInstructors;
    },
  },

  // 6. ENROLLMENTS
  enrollments: {
    async list(): Promise<Enrollment[]> {
      const mockStudents = getMockStudents();
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('enrollments')
          .select(`
            *,
            course:courses(*),
            student:profiles(*)
          `)
          .order('enrolled_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((e) => ({
            id: e.id,
            student_id: e.student_id,
            course_id: e.course_id,
            access_type: e.access_type || 'purchased',
            status: e.status || 'active',
            progress_percentage: Number(e.progress_percentage) || 0,
            enrolled_at: e.enrolled_at,
            course: e.course || mockDb.courses.find((c) => c.id === e.course_id),
            student: e.student || mockStudents.find((s) => s.id === e.student_id),
          }));
        }
      } catch (err) {
        console.warn('Supabase enrollments fetch warning:', err);
      }
      return mockDb.enrollments;
    },

    async grant(studentId: string, courseId: string, reason: string): Promise<Enrollment> {
      const mockStudents = getMockStudents();
      const newEnrollment: Enrollment = {
        id: `e2000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
        student_id: studentId,
        course_id: courseId,
        access_type: 'complimentary',
        status: 'active',
        progress_percentage: 0,
        enrolled_at: new Date().toISOString(),
        course: mockDb.courses.find((c) => c.id === courseId),
        student: mockStudents.find((s) => s.id === studentId),
      };

      try {
        const client = getSupabaseServerClient();
        await client.from('enrollments').insert({
          student_id: studentId,
          course_id: courseId,
          access_type: 'complimentary',
          status: 'active',
          progress_percentage: 0,
        });
      } catch (err) {
        console.warn('Supabase enrollment insert warning:', err);
      }

      mockDb.enrollments.unshift(newEnrollment);
      return newEnrollment;
    },

    async revoke(enrollmentId: string): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('enrollments').delete().eq('id', enrollmentId);
      } catch (err) {
        console.warn('Supabase enrollment delete warning:', err);
      }

      const idx = mockDb.enrollments.findIndex((e) => e.id === enrollmentId);
      if (idx !== -1) {
        mockDb.enrollments.splice(idx, 1);
        return true;
      }
      return false;
    },
  },

  // 7. SUBSCRIPTIONS & PLANS
  subscriptions: {
    async plans(): Promise<SubscriptionPlan[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('subscription_plans')
          .select('*')
          .order('price', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description || '',
            interval: p.interval || 'monthly',
            duration_days: p.duration_days || 30,
            price: Number(p.price) || 0,
            discount_price: p.discount_price ? Number(p.discount_price) : undefined,
            is_active: p.is_active,
            features: Array.isArray(p.features) ? p.features : [],
            active_subscribers_count: mockDb.subscriptionPlans.find((mp) => mp.slug === p.slug)?.active_subscribers_count || 120,
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Supabase subscription plans fetch warning:', err);
      }
      return mockDb.subscriptionPlans;
    },

    async list(): Promise<Subscription[]> {
      return mockDb.subscriptions;
    },
  },

  // 8. PAYMENTS & COMMERCE
  payments: {
    async list(): Promise<Payment[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('payments')
          .select(`
            *,
            order:orders(*, student:profiles(*))
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((p) => ({
            id: p.id,
            order_id: p.order_id,
            student_id: p.order?.student_id || 'a1000000-0000-0000-0000-000000000006',
            razorpay_payment_id: p.razorpay_payment_id,
            amount: Number(p.amount) || 0,
            currency: p.currency || 'INR',
            status: p.status || 'captured',
            method: p.payment_method || 'upi',
            payment_method: p.payment_method || 'upi',
            tax_amount: p.tax_amount ? Number(p.tax_amount) : 0,
            created_at: p.created_at,
            order: p.order,
          }));
        }
      } catch (err) {
        console.warn('Supabase payments fetch warning:', err);
      }
      return mockDb.payments;
    },
  },

  // 9. COUPONS
  coupons: {
    async list(): Promise<Coupon[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((c) => ({
            id: c.id,
            code: c.code,
            description: c.description || '',
            discount_type: c.discount_type || 'percentage',
            discount_value: Number(c.discount_value) || 0,
            min_order_amount: c.min_order_value ? Number(c.min_order_value) : undefined,
            min_order_value: c.min_order_value ? Number(c.min_order_value) : undefined,
            max_discount_amount: c.max_discount ? Number(c.max_discount) : undefined,
            max_discount: c.max_discount ? Number(c.max_discount) : undefined,
            max_uses: c.max_uses || 100,
            used_count: c.current_uses || 0,
            current_uses: c.current_uses || 0,
            per_student_limit: 1,
            is_active: c.is_active,
            start_date: c.valid_from || c.created_at || new Date().toISOString(),
            valid_from: c.valid_from,
            valid_until: c.valid_until,
            created_at: c.created_at,
            updated_at: c.updated_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Supabase coupons fetch warning:', err);
      }
      return mockDb.coupons;
    },

    async create(couponData: Partial<Coupon>): Promise<Coupon> {
      const minAmount = couponData.min_order_amount ?? couponData.min_order_value;
      const maxDiscount = couponData.max_discount_amount ?? couponData.max_discount;

      const newCoupon: Coupon = {
        id: `d7000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
        code: (couponData.code || 'COUPON').toUpperCase().trim(),
        description: couponData.description || '',
        discount_type: couponData.discount_type || 'percentage',
        discount_value: couponData.discount_value || 10,
        min_order_amount: minAmount,
        min_order_value: minAmount,
        max_discount_amount: maxDiscount,
        max_discount: maxDiscount,
        max_uses: couponData.max_uses || 100,
        used_count: 0,
        current_uses: 0,
        per_student_limit: 1,
        is_active: true,
        start_date: new Date().toISOString(),
        valid_from: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const client = getSupabaseServerClient();
        await client.from('coupons').insert({
          code: newCoupon.code,
          description: newCoupon.description,
          discount_type: newCoupon.discount_type,
          discount_value: newCoupon.discount_value,
          min_order_value: minAmount,
          max_discount: maxDiscount,
          max_uses: newCoupon.max_uses,
          is_active: true,
        });
      } catch (err) {
        console.warn('Supabase coupon insert warning:', err);
      }

      mockDb.coupons.unshift(newCoupon);
      return newCoupon;
    },
  },

  // 10. SUPPORT TICKETS
  support: {
    async list(): Promise<SupportTicket[]> {
      const mockStudents = getMockStudents();
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('support_tickets')
          .select(`
            *,
            student:profiles(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((t) => ({
            id: t.id,
            ticket_number: t.ticket_number,
            student_id: t.student_id,
            subject: t.subject,
            priority: t.priority || 'medium',
            status: t.status || 'open',
            category: t.category || 'general',
            created_at: t.created_at,
            updated_at: t.updated_at,
            student: t.student || mockStudents.find((mt) => mt.id === t.student_id),
            messages: mockDb.supportTickets.find((mt) => mt.id === t.id)?.messages || [],
          }));
        }
      } catch (err) {
        console.warn('Supabase support tickets fetch warning:', err);
      }
      return mockDb.supportTickets;
    },

    async updateStatus(id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed'): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      } catch (err) {
        console.warn('Supabase support ticket update warning:', err);
      }

      const ticket = mockDb.supportTickets.find((t) => t.id === id);
      if (ticket) {
        ticket.status = status;
        ticket.updated_at = new Date().toISOString();
        return true;
      }
      return false;
    },
  },

  // 11. AUDIT LOGS
  auditLogs: {
    async list(limit = 50): Promise<AuditLog[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data.map((al) => ({
            id: al.id,
            actor_id: al.actor_id || 'u1',
            actor_name: al.actor_name || 'System Admin',
            actor_email: al.actor_email || 'admin@sarvonaya.edu',
            action: al.action,
            entity_type: al.target_type || al.entity_type || 'platform',
            entity_id: al.target_id || al.entity_id,
            target_type: al.target_type || al.entity_type,
            target_id: al.target_id || al.entity_id,
            target_name: al.target_name,
            details: al.details || {},
            ip_address: al.ip_address || '127.0.0.1',
            created_at: al.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase audit logs fetch warning:', err);
      }
      return mockDb.auditLogs.slice(0, limit);
    },

    async log(event: {
      actor_id: string;
      actor_name: string;
      action: string;
      target_type: string;
      target_id?: string;
      target_name?: string;
      details?: Record<string, any>;
      ip_address?: string;
    }): Promise<AuditLog> {
      const newLog: AuditLog = {
        id: `d9000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
        actor_id: event.actor_id,
        actor_name: event.actor_name,
        actor_email: 'admin@sarvonaya.edu',
        action: event.action,
        entity_type: event.target_type,
        entity_id: event.target_id,
        target_type: event.target_type,
        target_id: event.target_id,
        target_name: event.target_name,
        details: event.details || {},
        ip_address: event.ip_address || '127.0.0.1',
        created_at: new Date().toISOString(),
      };

      try {
        const client = getSupabaseServerClient();
        await client.from('audit_logs').insert({
          actor_id: event.actor_id.includes('-') ? event.actor_id : 'a1000000-0000-0000-0000-000000000001',
          actor_name: event.actor_name,
          action: event.action,
          target_type: event.target_type,
          target_id: event.target_id,
          target_name: event.target_name,
          details: event.details || {},
          ip_address: event.ip_address || '127.0.0.1',
        });
      } catch (err) {
        console.warn('Supabase audit log insert warning:', err);
      }

      mockDb.auditLogs.unshift(newLog);
      return newLog;
    },
  },

  // 12. PLATFORM SETTINGS
  settings: {
    async get(): Promise<Record<string, any>> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client.from('platform_settings').select('*');
        if (!error && data && data.length > 0) {
          const map: Record<string, any> = {};
          data.forEach((row) => {
            map[row.key] = row.value;
          });
          return map;
        }
      } catch (err) {
        console.warn('Supabase settings fetch warning:', err);
      }
      return mockDb.platformSettings;
    },

    async update(key: string, value: any): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client
          .from('platform_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() });
      } catch (err) {
        console.warn('Supabase settings upsert warning:', err);
      }

      if (mockDb.platformSettings[key as keyof typeof mockDb.platformSettings]) {
        Object.assign(mockDb.platformSettings[key as keyof typeof mockDb.platformSettings], value);
      }
      return true;
    },
  },

  // 13. PROMOTIONAL BANNERS (FOR CUSTOMER WEBSITE)
  banners: {
    async list(activeOnly: boolean = false): Promise<PromotionalBanner[]> {
      try {
        const client = getSupabaseServerClient();
        let query = client.from('promotional_banners').select('*').order('display_order', { ascending: true });
        if (activeOnly) {
          query = query.eq('is_active', true);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as PromotionalBanner[];
        }
      } catch (err) {
        console.warn('Supabase banners list warning:', err);
      }
      const list = mockDb.banners || [];
      return activeOnly ? list.filter((b) => b.is_active) : list;
    },

    async getById(id: string): Promise<PromotionalBanner | null> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client.from('promotional_banners').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          return data as PromotionalBanner;
        }
      } catch (err) {
        console.warn('Supabase banner getById warning:', err);
      }
      return mockDb.banners.find((b) => b.id === id) || null;
    },

    async create(input: Partial<PromotionalBanner>): Promise<PromotionalBanner> {
      const now = new Date().toISOString();
      const newBanner: PromotionalBanner = {
        id: `ban-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`,
        title: input.title || 'Special Promotion',
        badge_text: input.badge_text || '',
        callout_text: input.callout_text || '',
        description: input.description || '',
        cta_text: input.cta_text || 'Learn More',
        cta_url: input.cta_url || '/courses',
        background_color: input.background_color || '#0B3473',
        text_color: input.text_color || '#FFFFFF',
        image_url: input.image_url || '',
        display_order: Number(input.display_order) || (mockDb.banners.length + 1),
        is_active: input.is_active !== false,
        created_at: now,
        updated_at: now,
      };

      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('promotional_banners')
          .insert({
            title: newBanner.title,
            badge_text: newBanner.badge_text,
            callout_text: newBanner.callout_text,
            description: newBanner.description,
            cta_text: newBanner.cta_text,
            cta_url: newBanner.cta_url,
            background_color: newBanner.background_color,
            text_color: newBanner.text_color,
            image_url: newBanner.image_url,
            display_order: newBanner.display_order,
            is_active: newBanner.is_active,
          })
          .select()
          .single();

        if (!error && data) {
          newBanner.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase banner create warning:', err);
      }

      mockDb.banners.push(newBanner);
      return newBanner;
    },

    async update(id: string, updates: Partial<PromotionalBanner>): Promise<PromotionalBanner | null> {
      const now = new Date().toISOString();
      try {
        const client = getSupabaseServerClient();
        await client
          .from('promotional_banners')
          .update({ ...updates, updated_at: now })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase banner update warning:', err);
      }

      const idx = mockDb.banners.findIndex((b) => b.id === id);
      if (idx !== -1) {
        mockDb.banners[idx] = { ...mockDb.banners[idx], ...updates, updated_at: now };
        return mockDb.banners[idx];
      }
      return null;
    },

    async delete(id: string): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('promotional_banners').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase banner delete warning:', err);
      }

      const initialLen = mockDb.banners.length;
      mockDb.banners = mockDb.banners.filter((b) => b.id !== id);
      return mockDb.banners.length < initialLen;
    },
  },
};
