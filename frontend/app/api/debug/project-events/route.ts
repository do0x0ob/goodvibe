import { NextRequest, NextResponse } from 'next/server';
import { SuiClient } from '@mysten/sui/client';
import { NETWORK, PACKAGE_ID } from '@/config/sui';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const client = new SuiClient({ url: NETWORK.url });

  try {
    const eventTypes = [
      'SupportStartedEvent',
      'SupportIncreasedEvent',
      'SupportDecreasedEvent',
      'SupportEndedEvent',
    ];

    const results: any = {};

    for (const eventType of eventTypes) {
      try {
        const res = await client.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::project::${eventType}` },
          limit: 50,
          order: 'descending',
        });

        console.log(`[DEBUG] ${eventType}: found ${res.data.length} total events`);

        // 過濾屬於這個項目的事件
        const projectEvents = res.data.filter((e: any) => {
          const parsed = e.parsedJson as any;
          return parsed?.project_id === projectId;
        });

        console.log(`[DEBUG] ${eventType}: ${projectEvents.length} events for project ${projectId}`);

        results[eventType] = {
          total: res.data.length,
          forThisProject: projectEvents.length,
          events: projectEvents.map((e: any) => ({
            id: e.id,
            timestamp: e.timestampMs,
            parsedJson: e.parsedJson,
          })),
        };
      } catch (err: any) {
        console.error(`[DEBUG] Error querying ${eventType}:`, err);
        results[eventType] = {
          error: err.message,
        };
      }
    }

    return NextResponse.json({
      projectId,
      packageId: PACKAGE_ID,
      results,
    });
  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
