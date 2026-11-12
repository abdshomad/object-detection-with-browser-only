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

/** Upload a local video file to the server (saved under videos/). */
export async function uploadVideoFile(file: File): Promise<Extract<VideoSource, { kind: 'url' }>> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/video/upload', { method: 'POST', body: form });
  if (!res.ok) {
    let detail = `Video upload failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch { /* keep default */ }
    throw new Error(detail);
  }
  const data = (await res.json()) as { title: string; streamUrl: string };
  return { kind: 'url', type: 'file', title: data.title, streamUrl: data.streamUrl, sourceUrl: '' };
}

/** Upload a custom YOLO .pt model to the server (saved under models/custom/). */
export async function uploadCustomModel(file: File, name: string): Promise<{
  id: string; name: string; classes: string[]; sizeBytes: number;
}> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/model/upload?name=${encodeURIComponent(name)}`, { method: 'POST', body: form });
  if (!res.ok) {
    let detail = `Model upload failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch { /* keep default */ }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchCustomModels(): Promise<Array<{
  id: string; name: string; classes?: string[]; file: string;
}>> {
  const res = await fetch('/api/models');
  if (!res.ok) return [];
  const all = (await res.json()) as Array<{ id: string; name: string; family: string; classes?: string[]; file: string }>;
  return all.filter((m) => m.family === 'custom');
}

export async function deleteCustomModel(id: string): Promise<void> {
  await fetch(`/api/model/${id}`, { method: 'DELETE' });
}
