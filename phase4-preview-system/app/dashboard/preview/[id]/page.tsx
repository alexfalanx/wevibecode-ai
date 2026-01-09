// app/dashboard/preview/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import Preview from '@/components/Preview';

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const previewId = params.id as string;

  const handleClose = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      <Preview previewId={previewId} onClose={handleClose} />
    </div>
  );
}
