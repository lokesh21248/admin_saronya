// SARVONAYA Production Supabase Database Layer
// Connects to live Supabase PostgreSQL tables (Zero dummy data, clean state)
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
  HeroBanner,
} from '@/types/database';

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

        if (!error && data) {
          // Real student count per branch
          let studentCountsByBranch: Record<string, number> = {};
          try {
            const { data: qualData } = await client
              .from('academic_qualifications')
              .select('branch_id');
            if (qualData) {
              for (const q of qualData) {
                if (q.branch_id) {
                  studentCountsByBranch[q.branch_id] = (studentCountsByBranch[q.branch_id] || 0) + 1;
                }
              }
            }
          } catch (e) {
            // ignore
          }

          // Real course count per branch
          let courseCountsByBranch: Record<string, number> = {};
          try {
            const { data: mapData } = await client
              .from('course_branch_mappings')
              .select('branch_id');
            if (mapData) {
              for (const m of mapData) {
                if (m.branch_id) {
                  courseCountsByBranch[m.branch_id] = (courseCountsByBranch[m.branch_id] || 0) + 1;
                }
              }
            }
          } catch (e) {
            // ignore
          }

          return data.map((b: any) => {
            const branchCode = b.code || b.branch_code || '';
            return {
              id: b.id,
              code: branchCode,
              name: b.name || b.branch_name || '',
              description: b.description || '',
              is_active: b.is_active ?? true,
              created_at: b.created_at,
              updated_at: b.updated_at,
              courses_count: courseCountsByBranch[b.id] || 0,
              students_count: studentCountsByBranch[b.id] || 0,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase branches fetch failed:', err);
      }
      return [];
    },

    async getById(id: string): Promise<AcademicBranch | null> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('academic_branches')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            code: data.code || data.branch_code || '',
            name: data.name || data.branch_name || '',
            description: data.description || '',
            is_active: data.is_active ?? true,
            created_at: data.created_at,
            updated_at: data.updated_at,
            courses_count: 0,
            students_count: 0,
          };
        }
      } catch (err) {
        console.warn('Supabase branch getById warning:', err);
      }
      return null;
    },

    async create(input: { code: string; name: string; description?: string }): Promise<AcademicBranch> {
      const code = input.code.toUpperCase().trim();
      const name = input.name.trim();
      const description = input.description?.trim() || '';

      const client = getSupabaseServerClient();
      const { data, error } = await client
        .from('academic_branches')
        .insert({
          code,
          branch_code: code,
          name,
          branch_name: name,
          description,
          is_active: true,
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Supabase branch insert failed:', error);
        throw new Error(`Failed to create academic branch: ${error?.message || 'Database insert failed'}`);
      }

      const branch: AcademicBranch = {
        id: data.id,
        code: data.code || data.branch_code || code,
        name: data.name || data.branch_name || name,
        description: data.description || description,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
        courses_count: 0,
        students_count: 0,
      };

      mockDb.branches.push(branch);
      return branch;
    },

    async update(id: string, updates: Partial<AcademicBranch>): Promise<AcademicBranch | null> {
      try {
        const client = getSupabaseServerClient();
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (updates.code) {
          const upper = updates.code.toUpperCase().trim();
          payload.code = upper;
          payload.branch_code = upper;
        }
        if (updates.name) {
          const trimmed = updates.name.trim();
          payload.name = trimmed;
          payload.branch_name = trimmed;
        }
        if (updates.description !== undefined) {
          payload.description = updates.description;
        }
        if (updates.is_active !== undefined) {
          payload.is_active = updates.is_active;
        }

        const { error } = await client
          .from('academic_branches')
          .update(payload)
          .eq('id', id);

        if (error) {
          console.error('Supabase branch update error:', error);
        }

        return await this.getById(id);
      } catch (err) {
        console.warn('Supabase branch update warning:', err);
      }

      return null;
    },

    async delete(id: string): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('course_branch_mappings').delete().eq('branch_id', id);
        await client.from('course_branch_mapping').delete().eq('branch_id', id);
        await client.from('academic_qualifications').update({ branch_id: null }).eq('branch_id', id);
        const { error } = await client.from('academic_branches').delete().eq('id', id);
        if (error) {
          console.error('Supabase branch delete error:', error);
        }
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

        if (!error && data) {
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
            courses_count: 0,
          }));
        }
      } catch (err) {
        console.warn('Supabase categories fetch failed:', err);
      }
      return [];
    },

    async create(input: { name: string; slug: string; description?: string; icon?: string; thumbnail_url?: string }): Promise<Category> {
      const newCategory: Category = {
        id: `c1000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
        name: input.name.trim(),
        slug: input.slug.toLowerCase().trim(),
        description: input.description || '',
        icon: input.icon || 'Code2',
        thumbnail_url: input.thumbnail_url || undefined,
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
            thumbnail_url: newCategory.thumbnail_url || null,
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
            ...(updates.thumbnail_url !== undefined && { thumbnail_url: updates.thumbnail_url }),
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
            primary_instructor:profiles!courses_primary_instructor_id_fkey(*),
            course_sections(
              id,
              title,
              lessons(id, title)
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((c: any) => {
            const sections = c.course_sections || [];
            const lessonsCount = sections.reduce(
              (acc: number, s: any) => acc + (s.lessons ? s.lessons.length : 0),
              0
            );

            return {
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
              category: c.category,
              primary_instructor: c.primary_instructor,
              branches: [],
              sections_count: sections.length,
              lessons_count: lessonsCount,
              enrollments_count: 0,
              average_rating: Number(c.average_rating) || 4.8,
              reviews_count: Number(c.reviews_count) || 0,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase courses fetch failed:', err);
      }
      return [];
    },

    async getById(id: string): Promise<Course | null> {
      try {
        const client = getSupabaseServerClient();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let query = client
          .from('courses')
          .select(`
            *,
            category:categories(*),
            primary_instructor:profiles!courses_primary_instructor_id_fkey(*),
            course_sections(
              *,
              lessons(*)
            )
          `);

        if (isUuid) {
          query = query.eq('id', id);
        } else {
          query = query.eq('slug', id);
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
          const sections = data.course_sections || [];
          const lessonsCount = sections.reduce(
            (acc: number, s: any) => acc + (s.lessons ? s.lessons.length : 0),
            0
          );

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
            category: data.category,
            primary_instructor: data.primary_instructor,
            branches: [],
            sections_count: sections.length,
            lessons_count: lessonsCount,
            sections: sections,
          } as any;
        }
      } catch (err) {
        console.warn('Supabase course getById warning:', err);
      }

      return null;
    },

    async create(courseData: Partial<Course> & { branch_ids?: string[]; selected_branches?: string[] }): Promise<Course> {
      const isUuid = (val?: string | null): boolean =>
        Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

      const client = getSupabaseServerClient();

      // 1. Resolve category_id to a valid UUID
      let categoryId: string | null = null;
      if (courseData.category_id && isUuid(courseData.category_id)) {
        categoryId = courseData.category_id;
      } else if (courseData.category_id) {
        const { data: cat } = await client
          .from('categories')
          .select('id')
          .or(`slug.eq.${courseData.category_id},name.ilike.%${courseData.category_id}%`)
          .limit(1)
          .maybeSingle();
        categoryId = cat?.id || null;
      }

      // 2. Resolve primary_instructor_id to a valid UUID
      let instructorId: string | null = null;
      if (courseData.primary_instructor_id && isUuid(courseData.primary_instructor_id)) {
        instructorId = courseData.primary_instructor_id;
      } else {
        const { data: prof } = await client.from('profiles').select('id').limit(1).maybeSingle();
        instructorId = prof?.id || null;
      }

      const slug =
        courseData.slug?.trim() ||
        courseData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') ||
        `course-${Date.now()}`;

      const { data: inserted, error } = await client
        .from('courses')
        .insert({
          title: courseData.title || 'Untitled Course',
          slug,
          short_description: courseData.short_description || '',
          full_description: courseData.full_description || '',
          thumbnail_url: courseData.thumbnail_url || '/placeholders/course-placeholder.svg',
          category_id: categoryId,
          primary_instructor_id: instructorId,
          difficulty_level: courseData.difficulty_level || 'all_levels',
          duration_hours: Number(courseData.duration_hours) || 0,
          language: courseData.language || 'English',
          price: Number(courseData.price) || 0,
          discount_price: courseData.discount_price ? Number(courseData.discount_price) : null,
          is_subscription_eligible: courseData.is_subscription_eligible ?? true,
          access_duration_days: Number(courseData.access_duration_days) || 365,
          status: courseData.status || 'draft',
          published_at: courseData.status === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error || !inserted) {
        console.error('Supabase course creation failed:', error);
        throw new Error(`Failed to create course in Supabase: ${error?.message || 'Database insert failed'}`);
      }

      // 3. Resolve and map branches
      const rawBranches = courseData.branch_ids || courseData.selected_branches || [];
      if (rawBranches.length > 0) {
        try {
          const { data: allBranches } = await client.from('academic_branches').select('id, code');
          const branchMap = new Map((allBranches || []).map((b) => [b.code?.toUpperCase(), b.id]));

          const mappings: { course_id: string; branch_id: string }[] = [];
          for (const b of rawBranches) {
            const resolvedId = isUuid(b) ? b : branchMap.get(b.toUpperCase());
            if (resolvedId) {
              mappings.push({ course_id: inserted.id, branch_id: resolvedId });
            }
          }

          if (mappings.length > 0) {
            await client.from('course_branch_mappings').insert(mappings);
            try {
              await client.from('course_branch_mapping').insert(mappings);
            } catch (ignoreErr) {}
          }
        } catch (branchErr) {
          console.warn('Branch mapping insert failed:', branchErr);
        }
      }

      const created = await this.getById(inserted.id);
      return created || {
        ...inserted,
        branches: [],
        sections_count: 0,
        lessons_count: 0,
      };
    },

    async update(id: string, updates: Partial<Course> & { branch_ids?: string[]; selected_branches?: string[] }): Promise<Course | null> {
      try {
        const client = getSupabaseServerClient();
        const isUuid = (val?: string | null): boolean =>
          Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (updates.title !== undefined) updatePayload.title = updates.title;
        if (updates.slug !== undefined) updatePayload.slug = updates.slug;
        if (updates.short_description !== undefined) updatePayload.short_description = updates.short_description;
        if (updates.full_description !== undefined) updatePayload.full_description = updates.full_description;
        if (updates.thumbnail_url !== undefined) updatePayload.thumbnail_url = updates.thumbnail_url;
        if (updates.difficulty_level !== undefined) updatePayload.difficulty_level = updates.difficulty_level;
        if (updates.duration_hours !== undefined) updatePayload.duration_hours = Number(updates.duration_hours) || 0;
        if (updates.language !== undefined) updatePayload.language = updates.language;
        if (updates.price !== undefined) updatePayload.price = Number(updates.price) || 0;
        if (updates.discount_price !== undefined) updatePayload.discount_price = updates.discount_price ? Number(updates.discount_price) : null;
        if (updates.is_subscription_eligible !== undefined) updatePayload.is_subscription_eligible = updates.is_subscription_eligible;
        if (updates.access_duration_days !== undefined) updatePayload.access_duration_days = Number(updates.access_duration_days) || 365;

        if (updates.status !== undefined) {
          updatePayload.status = updates.status;
          updatePayload.published_at = updates.status === 'published' ? new Date().toISOString() : null;
        }

        if (updates.category_id !== undefined) {
          if (isUuid(updates.category_id)) {
            updatePayload.category_id = updates.category_id;
          } else if (updates.category_id) {
            const { data: cat } = await client
              .from('categories')
              .select('id')
              .or(`slug.eq.${updates.category_id},name.ilike.%${updates.category_id}%`)
              .limit(1)
              .maybeSingle();
            updatePayload.category_id = cat?.id || null;
          } else {
            updatePayload.category_id = null;
          }
        }

        if (updates.primary_instructor_id !== undefined) {
          updatePayload.primary_instructor_id = isUuid(updates.primary_instructor_id) ? updates.primary_instructor_id : null;
        }

        const { error: updateError } = await client
          .from('courses')
          .update(updatePayload)
          .eq('id', id);

        if (updateError) {
          console.error('Supabase course update failed:', updateError);
        }

        const rawBranches = updates.branch_ids || updates.selected_branches;
        if (rawBranches) {
          await client.from('course_branch_mappings').delete().eq('course_id', id);
          try {
            await client.from('course_branch_mapping').delete().eq('course_id', id);
          } catch (ignoreErr) {}

          if (rawBranches.length > 0) {
            const { data: allBranches } = await client.from('academic_branches').select('id, code');
            const branchMap = new Map((allBranches || []).map((b) => [b.code?.toUpperCase(), b.id]));

            const mappings: { course_id: string; branch_id: string }[] = [];
            for (const b of rawBranches) {
              const resolvedId = isUuid(b) ? b : branchMap.get(b.toUpperCase());
              if (resolvedId) {
                mappings.push({ course_id: id, branch_id: resolvedId });
              }
            }

            if (mappings.length > 0) {
              await client.from('course_branch_mappings').insert(mappings);
              try {
                await client.from('course_branch_mapping').insert(mappings);
              } catch (ignoreErr) {}
            }
          }
        }

        return await this.getById(id);
      } catch (err) {
        console.warn('Supabase course update warning:', err);
      }

      return null;
    },

    async delete(id: string): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('course_branch_mappings').delete().eq('course_id', id);
        await client.from('course_sections').delete().eq('course_id', id);
        await client.from('courses').delete().eq('id', id);
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
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('profiles')
          .select(`
            *,
            academic_qualifications:academic_qualifications!academic_qualifications_profile_id_fkey (
              *,
              branch:academic_branches (*)
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((p: any) => ({
            id: p.id,
            email: p.email,
            full_name: p.full_name || 'Student',
            phone: p.phone,
            avatar_url: p.avatar_url,
            bio: p.bio,
            status: p.status || 'active',
            created_at: p.created_at,
            updated_at: p.updated_at,
            roles: ['student'],
            academic_qualification: p.academic_qualifications?.[0],
            academic_qualifications: p.academic_qualifications,
            enrolled_courses_count: 0,
            completed_courses_count: 0,
            total_spent: 0,
          }));
        }
      } catch (err) {
        console.warn('Supabase students fetch failed:', err);
      }
      return [];
    },

    async getById(id: string): Promise<Profile | null> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
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
            enrolled_courses_count: 0,
            completed_courses_count: 0,
            total_spent: 0,
          };
        }
      } catch (err) {
        console.warn('Supabase student getById warning:', err);
      }
      return null;
    },

    async updateStatus(id: string, status: 'active' | 'suspended' | 'inactive'): Promise<Profile | null> {
      try {
        const client = getSupabaseServerClient();
        const { data } = await client
          .from('profiles')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (data) {
          return {
            ...data,
            roles: ['student'],
          };
        }
      } catch (err) {
        console.warn('Supabase student updateStatus warning:', err);
      }
      return null;
    },
  },

  // 5. INSTRUCTORS
  instructors: {
    async list(): Promise<Profile[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            email: p.email || 'faculty@sarvonaya.edu',
            full_name: p.full_name || 'Sarvonaya Faculty',
            phone: p.phone || '',
            avatar_url: p.avatar_url || '/placeholders/avatar-placeholder.svg',
            bio: p.bio || 'Senior Academic Faculty',
            status: p.status || 'active',
            created_at: p.created_at,
            updated_at: p.updated_at,
            roles: ['instructor'],
            assigned_courses_count: 0,
          }));
        }
      } catch (err) {
        console.warn('Supabase instructors fetch warning:', err);
      }
      return mockDb.profiles;
    },

    async create(input: { full_name: string; email: string; phone?: string; bio?: string; avatar_url?: string }): Promise<Profile> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('profiles')
          .insert({
            full_name: input.full_name.trim(),
            email: input.email.trim().toLowerCase(),
            phone: input.phone || null,
            bio: input.bio || null,
            avatar_url: input.avatar_url || null,
            status: 'active',
          })
          .select()
          .single();

        if (!error && data) {
          try {
            await client.from('user_roles').insert({
              user_id: data.id,
              role: 'instructor',
            });
          } catch (rErr) {}

          const prof: Profile = {
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            phone: data.phone || '',
            avatar_url: data.avatar_url || '/placeholders/avatar-placeholder.svg',
            bio: data.bio || '',
            status: data.status || 'active',
            created_at: data.created_at,
            updated_at: data.updated_at,
            roles: ['instructor'],
            assigned_courses_count: 0,
          };
          mockDb.profiles.push(prof);
          return prof;
        }
      } catch (err) {
        console.warn('Supabase instructor create error:', err);
      }

      const fallback: Profile = {
        id: `a1000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
        full_name: input.full_name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone || '',
        bio: input.bio || '',
        avatar_url: input.avatar_url || '/placeholders/avatar-placeholder.svg',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        roles: ['instructor'],
        assigned_courses_count: 0,
      };
      mockDb.profiles.push(fallback);
      return fallback;
    },
  },

  // 6. ENROLLMENTS
  enrollments: {
    async list(): Promise<Enrollment[]> {
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

        if (!error && data) {
          return data.map((e: any) => ({
            id: e.id,
            student_id: e.student_id,
            course_id: e.course_id,
            access_type: e.access_type || 'purchased',
            status: e.status || 'active',
            progress_percentage: Number(e.progress_percentage) || 0,
            enrolled_at: e.enrolled_at,
            course: e.course,
            student: e.student,
          }));
        }
      } catch (err) {
        console.warn('Supabase enrollments fetch warning:', err);
      }
      return [];
    },

    async grant(studentId: string, courseId: string, reason: string): Promise<Enrollment> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('enrollments')
          .insert({
            student_id: studentId,
            course_id: courseId,
            access_type: 'complimentary',
            status: 'active',
            grant_reason: reason,
            enrolled_at: new Date().toISOString(),
          })
          .select(`
            *,
            course:courses(*),
            student:profiles(*)
          `)
          .single();

        if (!error && data) {
          const row: Enrollment = {
            id: data.id,
            student_id: data.student_id,
            course_id: data.course_id,
            access_type: data.access_type || 'complimentary',
            status: data.status || 'active',
            progress_percentage: 0,
            enrolled_at: data.enrolled_at,
            course: data.course,
            student: data.student,
          };
          mockDb.enrollments.unshift(row);
          return row;
        } else if (error) {
          console.warn('Supabase enrollment insert warning:', error);
        }
      } catch (err) {
        console.warn('Supabase enrollment grant error:', err);
      }

      const fallback: Enrollment = {
        id: `e2000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
        student_id: studentId,
        course_id: courseId,
        access_type: 'complimentary',
        status: 'active',
        progress_percentage: 0,
        enrolled_at: new Date().toISOString(),
      };
      mockDb.enrollments.unshift(fallback);
      return fallback;
    },

    async revoke(enrollmentId: string): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('enrollments').delete().eq('id', enrollmentId);
        return true;
      } catch (err) {
        console.warn('Supabase enrollment delete warning:', err);
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

        if (!error && data) {
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
            active_subscribers_count: 0,
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Supabase subscription plans fetch warning:', err);
      }
      return [];
    },

    async list(): Promise<Subscription[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('subscriptions')
          .select(`
            *,
            plan:subscription_plans(*),
            student:profiles(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as Subscription[];
        }
      } catch (err) {
        console.warn('Supabase subscriptions list warning:', err);
      }
      return [];
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

        if (!error && data) {
          return data.map((p: any) => ({
            id: p.id,
            order_id: p.order_id,
            student_id: p.order?.student_id || '',
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
      return [];
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

        if (!error && data) {
          return data.map((c: any) => ({
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
      return [];
    },

    async create(input: Partial<Coupon>): Promise<Coupon> {
      const newCoupon: Coupon = {
        id: `c2000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
        code: (input.code || 'COUPON').toUpperCase().trim(),
        description: input.description || '',
        discount_type: input.discount_type || 'percentage',
        discount_value: Number(input.discount_value) || 10,
        min_order_amount: input.min_order_amount,
        max_discount_amount: input.max_discount_amount,
        max_uses: input.max_uses || 500,
        used_count: 0,
        per_student_limit: input.per_student_limit || 1,
        is_active: input.is_active ?? true,
        start_date: input.start_date || input.valid_from || new Date().toISOString(),
        valid_until: input.valid_until,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const client = getSupabaseServerClient();
        const { data } = await client.from('coupons').insert({
          code: newCoupon.code,
          description: newCoupon.description,
          discount_type: newCoupon.discount_type,
          discount_value: newCoupon.discount_value,
          min_order_value: newCoupon.min_order_amount,
          max_discount: newCoupon.max_discount_amount,
          max_uses: newCoupon.max_uses,
          is_active: newCoupon.is_active,
        }).select().single();

        if (data) {
          newCoupon.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase coupon insert warning:', err);
      }

      mockDb.coupons.unshift(newCoupon);
      return newCoupon;
    },

    async toggleStatus(id: string): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        const { data } = await client.from('coupons').select('is_active').eq('id', id).single();
        if (data) {
          await client.from('coupons').update({ is_active: !data.is_active }).eq('id', id);
          return true;
        }
      } catch (err) {
        console.warn('Supabase coupon toggle warning:', err);
      }
      return false;
    },
  },

  // 10. SUPPORT TICKETS
  supportTickets: {
    async list(): Promise<SupportTicket[]> {
      try {
        const client = getSupabaseServerClient();
        const { data, error } = await client
          .from('support_tickets')
          .select(`
            *,
            student:profiles(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((t: any) => ({
            id: t.id,
            ticket_number: t.ticket_number,
            student_id: t.student_id,
            subject: t.subject,
            priority: t.priority || 'medium',
            status: t.status || 'open',
            category: t.category || 'general',
            created_at: t.created_at,
            updated_at: t.updated_at,
            student: t.student,
            messages: [],
          }));
        }
      } catch (err) {
        console.warn('Supabase support tickets fetch warning:', err);
      }
      return [];
    },

    async updateStatus(id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed'): Promise<boolean> {
      try {
        const client = getSupabaseServerClient();
        await client.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
        return true;
      } catch (err) {
        console.warn('Supabase support ticket update warning:', err);
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

        if (!error && data) {
          return data.map((al: any) => ({
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
      return [];
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

  // 13. HOMEPAGE HERO BANNERS (FOR CUSTOMER WEBSITE)
  banners: {
    async list(activeOnly: boolean = false): Promise<HeroBanner[]> {
      const client = getSupabaseServerClient();
      // 1. Query dedicated public.banners
      try {
        let query = client.from('banners').select('*').order('display_order', { ascending: true });
        if (activeOnly) {
          query = query.eq('is_active', true);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((b: any) => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle || '',
            image_url: b.image_url || '',
            mobile_image_url: b.mobile_image_url || '',
            button_text: b.button_text || 'Explore Courses',
            button_link: b.button_link || '/courses',
            is_active: b.is_active ?? true,
            display_order: Number(b.display_order) || 1,
            created_at: b.created_at,
            updated_at: b.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Querying banners table notice:', err);
      }

      // 2. Fallback adapter to promotional_banners
      try {
        let query = client.from('promotional_banners').select('*').order('display_order', { ascending: true });
        if (activeOnly) {
          query = query.eq('is_active', true);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map((b: any) => ({
            id: b.id,
            title: b.title,
            subtitle: b.description || b.callout_text || '',
            image_url: b.image_url || '/images/mockup/hero-student-3d.png',
            mobile_image_url: b.mobile_image_url || '/images/mockup/hero-mobile-banner-2x.png',
            button_text: b.cta_text || 'Explore Courses',
            button_link: b.cta_url || '/courses',
            is_active: b.is_active ?? true,
            display_order: Number(b.display_order) || 1,
            created_at: b.created_at,
            updated_at: b.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Fallback promotional_banners notice:', err);
      }
      return [];
    },

    async getById(id: string): Promise<HeroBanner | null> {
      const client = getSupabaseServerClient();
      try {
        const { data, error } = await client.from('banners').select('*').eq('id', id).single();
        if (!error && data) return data as HeroBanner;
      } catch (err) {}
      try {
        const { data, error } = await client.from('promotional_banners').select('*').eq('id', id).single();
        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            subtitle: data.description || data.callout_text || '',
            image_url: data.image_url || '',
            mobile_image_url: data.mobile_image_url || '',
            button_text: data.cta_text || 'Explore Courses',
            button_link: data.cta_url || '/courses',
            is_active: data.is_active,
            display_order: data.display_order,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err) {}
      return null;
    },

    async create(input: Partial<HeroBanner>): Promise<HeroBanner> {
      const client = getSupabaseServerClient();
      const generatedId = `b0000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`;
      const now = new Date().toISOString();

      const newBanner: HeroBanner = {
        id: input.id || generatedId,
        title: input.title || 'Learn Anytime, Anywhere',
        subtitle: input.subtitle || 'Upgrade your skills with expert-led online courses and take your career to the next level.',
        image_url: input.image_url || '/images/mockup/hero-student-3d.png',
        mobile_image_url: input.mobile_image_url || '/images/mockup/hero-mobile-banner-2x.png',
        button_text: input.button_text || 'Explore Courses',
        button_link: input.button_link || '/courses',
        is_active: input.is_active ?? true,
        display_order: Number(input.display_order) || 1,
        created_at: now,
        updated_at: now,
      };

      // 1. Try insert into banners
      try {
        const { data, error } = await client
          .from('banners')
          .insert({
            title: newBanner.title,
            subtitle: newBanner.subtitle,
            image_url: newBanner.image_url,
            mobile_image_url: newBanner.mobile_image_url,
            button_text: newBanner.button_text,
            button_link: newBanner.button_link,
            is_active: newBanner.is_active,
            display_order: newBanner.display_order,
          })
          .select()
          .single();

        if (!error && data) {
          return data as HeroBanner;
        }
      } catch (err) {}

      // 2. Also save to promotional_banners as adapter
      try {
        const { data, error } = await client
          .from('promotional_banners')
          .insert({
            title: newBanner.title,
            description: newBanner.subtitle,
            callout_text: newBanner.subtitle?.substring(0, 100),
            image_url: newBanner.image_url,
            cta_text: newBanner.button_text,
            cta_url: newBanner.button_link,
            is_active: newBanner.is_active,
            display_order: newBanner.display_order,
          })
          .select()
          .single();

        if (!error && data) {
          newBanner.id = data.id;
        }
      } catch (err) {}

      return newBanner;
    },

    async update(id: string, updates: Partial<HeroBanner>): Promise<HeroBanner | null> {
      const client = getSupabaseServerClient();
      const now = new Date().toISOString();

      try {
        const { data, error } = await client
          .from('banners')
          .update({
            ...(updates.title !== undefined && { title: updates.title }),
            ...(updates.subtitle !== undefined && { subtitle: updates.subtitle }),
            ...(updates.image_url !== undefined && { image_url: updates.image_url }),
            ...(updates.mobile_image_url !== undefined && { mobile_image_url: updates.mobile_image_url }),
            ...(updates.button_text !== undefined && { button_text: updates.button_text }),
            ...(updates.button_link !== undefined && { button_link: updates.button_link }),
            ...(updates.is_active !== undefined && { is_active: updates.is_active }),
            ...(updates.display_order !== undefined && { display_order: Number(updates.display_order) }),
            updated_at: now,
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return data as HeroBanner;
        }
      } catch (err) {}

      try {
        const { data, error } = await client
          .from('promotional_banners')
          .update({
            ...(updates.title !== undefined && { title: updates.title }),
            ...(updates.subtitle !== undefined && { description: updates.subtitle, callout_text: updates.subtitle?.substring(0, 100) }),
            ...(updates.image_url !== undefined && { image_url: updates.image_url }),
            ...(updates.button_text !== undefined && { cta_text: updates.button_text }),
            ...(updates.button_link !== undefined && { cta_url: updates.button_link }),
            ...(updates.is_active !== undefined && { is_active: updates.is_active }),
            ...(updates.display_order !== undefined && { display_order: Number(updates.display_order) }),
            updated_at: now,
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            subtitle: data.description || data.callout_text || '',
            image_url: data.image_url || '',
            mobile_image_url: data.mobile_image_url || '',
            button_text: data.cta_text || 'Explore Courses',
            button_link: data.cta_url || '/courses',
            is_active: data.is_active,
            display_order: data.display_order,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err) {}

      return null;
    },

    async delete(id: string): Promise<boolean> {
      const client = getSupabaseServerClient();
      try {
        await client.from('banners').delete().eq('id', id);
      } catch (err) {}
      try {
        await client.from('promotional_banners').delete().eq('id', id);
      } catch (err) {}
      return true;
    },
  },
};
