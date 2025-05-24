// src/app/dashboard/teacher/page.tsx
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import { createClient } from '@/utils/supabase/server'; // For server-side Supabase client
import { UserRole } from '@/types';
import { redirect } from 'next/navigation';
// cookies() is needed if createClient() uses it internally for server components,
// but createClient from @/utils/supabase/server should already handle it.

export default async function TeacherDashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login'); // Basic auth check
  }

  // Role check
  const { data: userRolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (rolesError) {
    console.error('Error fetching user roles for teacher dashboard:', rolesError.message);
    redirect('/login?error=role_fetch_failed');
  }

  const roles = userRolesData?.map(r => r.role as UserRole) || [];
  const allowedRoles = [UserRole.TEACHER, UserRole.ADMIN]; // Define allowed roles
  const hasAccess = allowedRoles.some(allowedRole => roles.includes(allowedRole));

  if (!hasAccess) {
    redirect('/dashboard?error=unauthorized_role'); // Redirect if not authorized
  }

  return <TeacherDashboard />;
}
