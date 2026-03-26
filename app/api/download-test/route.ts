import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Generates a random payload of the requested byte size for download testing.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bytes = Math.min(
    parseInt(searchParams.get('bytes') ?? '5242880', 10),
    20 * 1024 * 1024 // max 20 MB
  );

  // Generate a buffer of the requested size with pseudo-random bytes
  const chunkSize = 64 * 1024; // 64 KB chunks
  const chunks: Uint8Array[] = [];
  let remaining = bytes;

  while (remaining > 0) {
    const size = Math.min(chunkSize, remaining);
    const chunk = new Uint8Array(size);
    // Fill with non-zero bytes to prevent compression from skewing results
    for (let i = 0; i < size; i++) {
      chunk[i] = (i * 37 + 13) % 256;
    }
    chunks.push(chunk);
    remaining -= size;
  }

  // Combine chunks
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': bytes.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
