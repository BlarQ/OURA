import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getManualsServer } from '@/lib/services/manuals.server';
import ManualsDashboard from '@/components/dashboard/ManualsDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch manuals belonging to the user using Server Client
  const manuals = await getManualsServer();

  const displayName =
    user.user_metadata?.full_name ||
    (user.email ? user.email.split('@')[0] : 'Adedamola');

  return (
    <ManualsDashboard
      initialManuals={manuals}
      userEmail={user.email}
      userName={displayName}
    />
  );
}
