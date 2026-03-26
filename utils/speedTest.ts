// Speed Test Utility Functions
// All measurements produce results in Mbps

export interface SpeedTestResult {
  download: number;
  upload: number;
  ping: number;
  timestamp: number;
  isp?: string;
  ip?: string;
}

/**
 * Measure ping latency by sending multiple small requests and averaging them
 */
export async function measurePing(samples = 5): Promise<number> {
  const timings: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    try {
      await fetch(`/api/ping?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
      });
    } catch {
      // If local API fails, fallback
    }
    const end = performance.now();
    timings.push(end - start);
    // Small pause between pings
    await sleep(100);
  }

  // Drop the highest outlier and average the rest
  timings.sort((a, b) => a - b);
  const trimmed = timings.slice(0, -1);
  const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
  return Math.round(avg);
}

/**
 * Measure download speed by downloading a blob of bytes and timing it.
 * We hit our own API route so we control payload size.
 */
export async function measureDownload(
  onProgress?: (mbps: number) => void
): Promise<number> {
  // We download multiple rounds and pick the best average
  const rounds = 3;
  const speeds: number[] = [];

  for (let r = 0; r < rounds; r++) {
    // 5 MB payload per round
    const bytes = 5 * 1024 * 1024;
    const url = `/api/download-test?bytes=${bytes}&t=${Date.now()}`;

    const start = performance.now();
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const buffer = await res.arrayBuffer();
      const end = performance.now();

      const durationSec = (end - start) / 1000;
      const bits = buffer.byteLength * 8;
      const mbps = bits / durationSec / 1e6;
      speeds.push(mbps);
      onProgress?.(parseFloat(mbps.toFixed(2)));
    } catch {
      // network error – skip this round
    }

    await sleep(200);
  }

  if (speeds.length === 0) return 0;
  const avg = speeds.reduce((s, v) => s + v, 0) / speeds.length;
  return parseFloat(avg.toFixed(2));
}

/**
 * Measure upload speed by POSTing a blob to our API.
 */
export async function measureUpload(
  onProgress?: (mbps: number) => void
): Promise<number> {
  const rounds = 3;
  const speeds: number[] = [];

  for (let r = 0; r < rounds; r++) {
    // 2 MB payload per round (upload is usually slower, keep it lighter)
    const bytes = 2 * 1024 * 1024;
    const payload = new Uint8Array(bytes);
    // Fill with random-ish data so compression doesn't skew results
    crypto.getRandomValues(payload.slice(0, Math.min(bytes, 65536)));

    const blob = new Blob([payload]);
    const start = performance.now();

    try {
      await fetch('/api/upload-test', {
        method: 'POST',
        body: blob,
        headers: { 'Content-Type': 'application/octet-stream' },
        cache: 'no-store',
      });
      const end = performance.now();

      const durationSec = (end - start) / 1000;
      const bits = bytes * 8;
      const mbps = bits / durationSec / 1e6;
      speeds.push(mbps);
      onProgress?.(parseFloat(mbps.toFixed(2)));
    } catch {
      // skip on error
    }

    await sleep(200);
  }

  if (speeds.length === 0) return 0;
  const avg = speeds.reduce((s, v) => s + v, 0) / speeds.length;
  return parseFloat(avg.toFixed(2));
}

/**
 * Get public IP info via ipapi.co (free tier, no key required)
 */
export async function getClientInfo(): Promise<{ ip: string; isp: string } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      ip: data.ip ?? 'Unknown',
      isp: data.org ?? 'Unknown ISP',
    };
  } catch {
    return null;
  }
}

/** Classify speed tier */
export function getSpeedRating(mbps: number): {
  label: string;
  color: string;
  description: string;
} {
  if (mbps >= 500)
    return { label: 'Excellent', color: '#22c55e', description: 'Ultra-fast connection' };
  if (mbps >= 100)
    return { label: 'Very Good', color: '#84cc16', description: 'Handles streaming & gaming easily' };
  if (mbps >= 25)
    return { label: 'Good', color: '#eab308', description: 'Suitable for HD streaming' };
  if (mbps >= 10)
    return { label: 'Fair', color: '#f97316', description: 'Basic browsing & SD video' };
  return { label: 'Slow', color: '#ef4444', description: 'May struggle with video calls' };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
