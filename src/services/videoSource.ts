import { VideoSource } from '../types/source';

interface ResolveResponse {
  id: string;
  type: 'youtube' | 'drive' | 'rtsp' | 'direct';
  title: string;
  streamUrl: string;
  sizeBytes?: number;
  cached?: boolean;
}

/**
 * Ask the server to fetch a YouTube / Google Drive / direct video (or start
 * an RTSP->HLS transcode) and return a same-origin playable stream URL.
 */
export async function resolveVideoUrl(url: string): Promise<Extract<VideoSource, { kind: 'url' }>> {
  const res = await fetch('/api/source/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    let detail = `Source resolve failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch { /* keep default */ }
    throw new Error(detail);
  }
  const data = (await res.json()) as ResolveResponse;
  return { kind: 'url', type: data.type, title: data.title, streamUrl: data.streamUrl, sourceUrl: url };
}

export async function stopRtspSource(streamUrl: string): Promise<void> {
  const m = streamUrl.match(/\/api\/source\/hls\/([a-f0-9]{16})\//);
  if (m) {
    await fetch(`/api/source/stop/${m[1]}`, { method: 'POST' }).catch(() => {});
  }
}
