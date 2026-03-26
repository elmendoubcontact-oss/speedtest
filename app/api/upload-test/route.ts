import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Discard the uploaded body and immediately return OK.
// The client measures RTT with payload to calculate upload speed.
export async function POST(req: NextRequest) {
  // Read + discard the body so the browser doesn't cancel the upload
  await req.arrayBuffer();
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
