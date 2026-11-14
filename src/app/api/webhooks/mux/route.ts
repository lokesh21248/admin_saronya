export const dynamic = 'force-dynamic';
// SARVONAYA Mux Webhook Processor
import { NextResponse } from 'next/server';
import { mockDb } from '@/lib/db/mock-db';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;
    const signature = headers.get('mux-signature');

    // Parse event payload
    const event = JSON.parse(rawBody);

    switch (event.type) {
      case 'video.asset.ready': {
        const assetId = event.data.id;
        const playbackId = event.data.playback_ids?.[0]?.id;
        const duration = event.data.duration;

        const lesson = mockDb.lessons.find((l) => l.mux_asset_id === assetId);
        if (lesson) {
          lesson.video_status = 'ready';
          lesson.mux_playback_id = playbackId;
          lesson.video_duration = duration;
        }
        break;
      }

      case 'video.asset.errored': {
        const assetId = event.data.id;
        const lesson = mockDb.lessons.find((l) => l.mux_asset_id === assetId);
        if (lesson) {
          lesson.video_status = 'errored';
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Mux Webhook Processing Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}

