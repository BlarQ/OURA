import { notFound } from 'next/navigation';
import { getManualByIdServer } from '@/lib/services/manuals.server';
import ProcedureViewer from '@/components/viewer/ProcedureViewer';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface ManualPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ManualPage({ params }: ManualPageProps) {
  const { id } = await params;
  const manual = await getManualByIdServer(id);

  if (!manual) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authorName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Adedamola');

  return <ProcedureViewer manual={manual} authorName={authorName} />;
}
