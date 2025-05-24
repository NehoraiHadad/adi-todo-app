// src/app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types'; // Assuming UserRole enum is in @/types

// Import dashboard components
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
// import AdminDashboard from '@/components/dashboard/AdminDashboard'; // If an Admin-specific dashboard exists

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user role(s) from user_roles table
  const { data: userRolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (rolesError) {
    console.error('Error fetching user role for dashboard:', rolesError.message);
    // Consider redirecting to an error page or showing a message
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500">Error loading your dashboard: Could not determine user role.</p>
        <p><a href="/login" className="text-blue-500 hover:underline">Try logging out and in again.</a></p>
      </div>
    );
  }

  if (!userRolesData || userRolesData.length === 0) {
    console.warn(`No role found for user ${user.id} in user_roles table.`);
    // Default behavior: redirect to profile setup or show a message.
    // For now, showing a message.
    return (
      <div className="container mx-auto p-4">
        <p className="text-yellow-500">Your user role is not set up yet. Please contact support or complete your profile.</p>
         {/* Link to profile page could be added here if it handles role setup */}
      </div>
    );
  }

  // Assuming a user primarily acts under one role for dashboard purposes,
  // or we prioritize. For example, if a user is both PARENT and ADMIN, show PARENT dashboard.
  // This logic can be adjusted based on requirements.
  const roles = userRolesData.map(r => r.role as UserRole);

  // Prioritize specific roles for dashboard view
  if (roles.includes(UserRole.PARENT)) {
    return <ParentDashboard />;
  }
  if (roles.includes(UserRole.STUDENT)) {
    return <StudentDashboard />;
  }
  if (roles.includes(UserRole.TEACHER)) {
    return <TeacherDashboard />;
  }
  if (roles.includes(UserRole.ADMIN)) {
    // Fallback for Admin if they don't have a more specific dashboard role active
    // Or render a specific AdminDashboard if it exists
    // return <AdminDashboard />; 
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-xl font-bold">Admin View</h1>
            <p>Welcome, Admin. Your specific dashboard is not yet implemented, or you are viewing a default page.</p>
            {/* Could list users or provide admin actions here */}
        </div>
    );
  }

  // Fallback if role is unrecognized or not handled
  console.warn(`Unhandled role(s) for user ${user.id}: ${roles.join(', ')}`);
  return (
    <div className="container mx-auto p-4">
      <p>Your dashboard is not available for your assigned role.</p>
    </div>
  );
}
