export const dynamic = 'force-dynamic';
// SARVONAYA Mux Webhook Processor
import { NextResponse } from 'next/server';
import {
  type MuxAsset,
  assetToLessonVideoPatch,
  verifyMuxWebhookSignature,
} from '@/lib/mux/client';
import { applyLessonVideoUpdate } from '@/lib/mux/lesson-video';

export async function POST(request: Request) {
  const webhookSecret = process.env.MUX_WEBHOOK_SIGNING_SECRET;
  if (!webhookSecret) {
    // Never process unverifiable events: anyone could otherwise rewrite lesson video state.
    console.error('MUX_WEBHOOK_SIGNING_SECRET is not set; rejecting Mux webhook');
    return NextResponse.json({ error: 'Webhook signing secret not configured' }, { status: 503 });
  }

  // Signature is computed over the exact bytes received, so read the raw text first.
  const rawBody = await request.text();

  if (!verifyMuxWebhookSignature(rawBody, request.headers.get('mux-signature'), webhookSecret)) {
    console.warn('Rejected Mux webhook with missing or invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'video.upload.asset_created': {
        const assetId = event.data?.asset_id as string | undefined;
        const lessonId = (event.data?.new_asset_settings as { passthrough?: string } | undefined)?.passthrough;
        if (assetId && lessonId) {
          await applyLessonVideoUpdate(
            { lessonId, assetId },
            { mux_asset_id: assetId, video_status: 'processing' }
          );
        }
        break;
      }

      case 'video.asset.created':
      case 'video.asset.ready':
      case 'video.asset.errored': {
        const asset = event.data as unknown as MuxAsset | undefined;
        if (!asset?.id) break;

        // `passthrough` carries the lesson id set at upload time; fall back to the stored asset id.
        const { matched } = await applyLessonVideoUpdate(
          { lessonId: asset.passthrough, assetId: asset.id },
          assetToLessonVideoPatch(asset)
        );
        if (!matched) {
          console.warn(`Mux webhook ${event.type}: no lesson matched asset ${asset.id}`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Mux Webhook Processing Error:', error);
    // 5xx so Mux retries the delivery.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
