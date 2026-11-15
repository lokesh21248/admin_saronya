export const dynamic = 'force-dynamic';
// SARVONAYA Mux Direct Upload Endpoint
//   POST  { lessonId }                  -> creates a Mux direct upload tied to that lesson
//   GET   ?uploadId=...&lessonId=...    -> reports upload/processing status and links the asset to the lesson
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import {
  MuxError,
  assetToLessonVideoPatch,
  createMuxDirectUpload,
  getMuxAsset,
  getMuxUpload,
} from '@/lib/mux/client';
import { applyLessonVideoUpdate, findLessonWithCourse } from '@/lib/mux/lesson-video';

function failure(error: unknown, fallback: string) {
  console.error(fallback, error);
  if (error instanceof MuxError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    // Optional: the course wizard uploads before any lesson exists and attaches the asset on save.
    const lessonId = typeof body?.lessonId === 'string' && body.lessonId ? body.lessonId : undefined;

    if (lessonId && !(await findLessonWithCourse(lessonId))) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    const uploadData = await createMuxDirectUpload({
      lessonId,
      // Browser PUTs to Mux are cross-origin; scope CORS to the page that asked for the upload.
      corsOrigin: request.headers.get('origin') ?? undefined,
    });

    return NextResponse.json({ success: true, data: uploadData });
  } catch (error) {
    return failure(error, 'Failed to create Mux direct upload');
  }
}

export async function GET(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');
    const lessonId = searchParams.get('lessonId') || undefined;
    if (!uploadId) {
      return NextResponse.json({ success: false, error: 'uploadId is required' }, { status: 400 });
    }

    const upload = await getMuxUpload(uploadId);

    if (upload.status === 'waiting') {
      return NextResponse.json({ success: true, status: 'waiting' });
    }

    if (upload.status !== 'asset_created' || !upload.asset_id) {
      // errored / cancelled / timed_out
      return NextResponse.json({
        success: true,
        status: 'errored',
        message: upload.error?.message || `Upload ${upload.status.replace('_', ' ')}`,
      });
    }

    const asset = await getMuxAsset(upload.asset_id);

    const video = assetToLessonVideoPatch(asset);

    // With a lesson id, link the asset to it. The upload must belong to that lesson; never re-link
    // someone else's asset. Without one (course wizard) the caller keeps `video` and attaches it later.
    if (lessonId) {
      const owner = upload.new_asset_settings?.passthrough ?? asset.passthrough;
      if (owner && owner !== lessonId) {
        return NextResponse.json(
          { success: false, error: 'Upload does not belong to this lesson' },
          { status: 409 }
        );
      }
      await applyLessonVideoUpdate({ lessonId, assetId: asset.id }, video);
    }

    return NextResponse.json({
      success: true,
      status: asset.status === 'ready' ? 'ready' : asset.status === 'errored' ? 'errored' : 'processing',
      assetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id ?? null,
      video,
      message: asset.status === 'errored' ? asset.errors?.messages?.join('; ') || 'Mux failed to process the video' : undefined,
    });
  } catch (error) {
    return failure(error, 'Failed to read Mux upload status');
  }
}
