import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return new NextResponse(JSON.stringify({ pong: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
