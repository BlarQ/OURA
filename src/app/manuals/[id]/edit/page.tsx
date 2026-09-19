import { notFound } from 'next/navigation';
import { getManualByIdServer } from '@/lib/services/manuals.server';
import StepBuilder from '@/components/editor/StepBuilder';

export const dynamic = 'force-dynamic';

interface EditManualPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditManualPage({ params }: EditManualPageProps) {
  const { id } = await params;
  const manual = await getManualByIdServer(id);

  if (!manual) {
    notFound();
  }

  return <StepBuilder manual={manual} />;
}
