import React, { Suspense } from 'react';
import CurriculumView from './curriculum-view';

export const dynamic = 'force-dynamic';

export default async function CourseCurriculumPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading curriculum...</div>}>
      <CurriculumView courseId={courseId} />
    </Suspense>
  );
}
