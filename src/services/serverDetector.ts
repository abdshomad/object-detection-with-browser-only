import { DetectedObject } from '../types/detection';
import { getColorForClass } from '../utils/boxCalculations';

/**
 * Server-hosted models (YOLO26 + RF-DETR) run on the server GPU.
 * The browser uploads a JPEG frame to /api/detect/{id} (proxied to the
 * FastAPI inference server) and renders the returned boxes.
 */
export const SERVER_MODEL_IDS = [
  'yolo26n', 'yolo26s', 'yolo26m', 'yolo26l', 'yolo26x',
  'rf-detr-nano', 'rf-detr-small', 'rf-detr-medium', 'rf-detr-large',
] as const;

export function isServerModel(modelId: string): boolean {
  return (SERVER_MODEL_IDS as readonly string[]).includes(modelId);
}

const warmed = new Set<string>();

/** Load the model onto the server GPU (called by the Load button). */
export async function warmupServerModel(
  modelId: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  onProgress?.(30);
  const res = await fetch(`/api/warmup/${modelId}`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Server warmup failed (${res.status}): ${body.slice(0, 200)}`);
  }
  warmed.add(modelId);
  onProgress?.(100);
}

const captureCanvas = document.createElement('canvas');

/** Upload the current video frame and run GPU inference on the server. */
export async function detectOnServer(
  video: HTMLVideoElement,
  modelId: string,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 720;
  // Cap upload width to bound latency; boxes are scaled back below.
  const scale = Math.min(1, 960 / vw);
  captureCanvas.width = Math.round(vw * scale);
  captureCanvas.height = Math.round(vh * scale);
  const ctx = captureCanvas.getContext('2d');
  if (!ctx) return [];
  ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

  const blob = await new Promise<Blob | null>((r) => captureCanvas.toBlob(r, 'image/jpeg', 0.8));
  if (!blob) return [];
  const form = new FormData();
  form.append('frame', blob, 'frame.jpg');
  const res = await fetch(
    `/api/detect/${modelId}?confidence=${minConfidence}&max_detections=${maxDetections}`,
    { method: 'POST', body: form }
  );
  if (!res.ok) throw new Error(`Server detect failed (${res.status})`);
  const data = (await res.json()) as {
    width: number; height: number;
    objects: Array<{ class: string; score: number; bbox: [number, number, number, number] }>;
  };
  const sx = vw / (data.width || captureCanvas.width);
  const sy = vh / (data.height || captureCanvas.height);
  const now = Date.now();
  return data.objects.map((o, idx) => {
    const [x, y, w, h] = o.bbox;
    const bx = Math.round(x * sx), by = Math.round(y * sy);
    const bw = Math.round(w * sx), bh = Math.round(h * sy);
    return {
      id: `server-${modelId}-${idx}-${now}`,
      class: o.class,
      score: o.score,
      bbox: [bx, by, bw, bh] as [number, number, number, number],
      color: getColorForClass(o.class),
      trackingId: 900 + idx,
      center: [Math.round(bx + bw / 2), Math.round(by + bh / 2)] as [number, number],
      timestamp: now,
    };
  });
}

export function isWarmed(modelId: string): boolean {
  return warmed.has(modelId);
}
