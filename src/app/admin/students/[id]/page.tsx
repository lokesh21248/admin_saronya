import React, { Suspense } from 'react';
import StudentDetailView from './student-detail-view';

export const dynamic = 'force-dynamic';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading student profile...</div>}>
      <StudentDetailView id={id} />
    </Suspense>
  );
}
