import { useState, useCallback, useRef } from 'react';
import {
  measurePing,
  measureDownload,
  measureUpload,
  getClientInfo,
  SpeedTestResult,
} from '@/utils/speedTest';

export type TestPhase =
  | 'idle'
  | 'ping'
  | 'download'
  | 'upload'
  | 'done'
  | 'error';

export interface UseSpeedTestReturn {
  phase: TestPhase;
  ping: number | null;
  download: number | null;
  upload: number | null;
  liveSpeed: number | null; // real-time reading during d/l or u/l
  progress: number; // 0-100
  error: string | null;
  clientInfo: { ip: string; isp: string } | null;
  start: () => void;
  reset: () => void;
  history: SpeedTestResult[];
}

const HISTORY_KEY = 'speedtest_history';

function loadHistory(): SpeedTestResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveHistory(results: SpeedTestResult[]) {
  if (typeof window === 'undefined') return;
  // Keep last 20
  const trimmed = results.slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function useSpeedTest(): UseSpeedTestReturn {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [ping, setPing] = useState<number | null>(null);
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);
  const [liveSpeed, setLiveSpeed] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<{ ip: string; isp: string } | null>(null);
  const [history, setHistory] = useState<SpeedTestResult[]>(loadHistory);

  const abortRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = false;
    setPhase('idle');
    setPing(null);
    setDownload(null);
    setUpload(null);
    setLiveSpeed(null);
    setProgress(0);
    setError(null);
  }, []);

  const start = useCallback(async () => {
    reset();
    abortRef.current = false;

    try {
      // --- Ping phase (0-20%) ---
      setPhase('ping');
      setProgress(5);
      const [pingMs, info] = await Promise.all([
        measurePing(5),
        getClientInfo(),
      ]);
      setPing(pingMs);
      setClientInfo(info);
      setProgress(20);

      if (abortRef.current) return;

      // --- Download phase (20-60%) ---
      setPhase('download');
      setProgress(25);
      let dlProgress = 25;

      const dl = await measureDownload((mbps) => {
        setLiveSpeed(mbps);
        dlProgress = Math.min(dlProgress + 12, 60);
        setProgress(dlProgress);
      });

      setDownload(dl);
      setLiveSpeed(null);
      setProgress(62);

      if (abortRef.current) return;

      // --- Upload phase (62-95%) ---
      setPhase('upload');
      setProgress(65);
      let ulProgress = 65;

      const ul = await measureUpload((mbps) => {
        setLiveSpeed(mbps);
        ulProgress = Math.min(ulProgress + 10, 95);
        setProgress(ulProgress);
      });

      setUpload(ul);
      setLiveSpeed(null);
      setProgress(100);

      // --- Done ---
      setPhase('done');

      const result: SpeedTestResult = {
        download: dl,
        upload: ul,
        ping: pingMs,
        timestamp: Date.now(),
        ip: info?.ip,
        isp: info?.isp,
      };

      const newHistory = [result, ...history];
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Test failed';
      setError(msg);
      setPhase('error');
    }
  }, [history, reset]);

  return {
    phase,
    ping,
    download,
    upload,
    liveSpeed,
    progress,
    error,
    clientInfo,
    start,
    reset,
    history,
  };
}
