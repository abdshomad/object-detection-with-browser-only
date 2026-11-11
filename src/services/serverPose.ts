import { PoseVariantResult, PoseConnection } from '../types/pose';
import { COCO17_CONNECTIONS } from './poseConnections';

/**
 * Server GPU pose models. MediaPipe pose runs in the browser; these upload
 * each frame to /api/pose/{id} (YOLO26-Pose / RF-DETR Keypoint on CUDA).
 */
export interface PoseModelOption {
  id: string;
  name: string;
  group: 'browser' | 'server';
  meta: string;
}

export const POSE_MODELS: PoseModelOption[] = [
  { id: 'mediapipe', name: 'MediaPipe Pose', group: 'browser', meta: 'Browser · body / face / hands / holistic' },
  { id: 'yolo26n-pose', name: 'YOLO26n Pose', group: 'server', meta: 'Server GPU · COCO-17 · 7.6MB' },
  { id: 'yolo26s-pose', name: 'YOLO26s Pose', group: 'server', meta: 'Server GPU · COCO-17 · 24MB' },
  { id: 'yolo26m-pose', name: 'YOLO26m Pose', group: 'server', meta: 'Server GPU · COCO-17 · 47MB' },
  { id: 'yolo26l-pose', name: 'YOLO26l Pose', group: 'server', meta: 'Server GPU · COCO-17 · 56MB' },
  { id: 'yolo26x-pose', name: 'YOLO26x Pose', group: 'server', meta: 'Server GPU · COCO-17 · 121MB' },
  { id: 'rf-detr-pose', name: 'RF-DETR Pose', group: 'server', meta: 'Server GPU · Keypoint XLarge · COCO-17' },
];

export function isServerPoseModel(poseModelId: string): boolean {
  return poseModelId !== 'mediapipe';
}

export async function warmupServerPose(poseModelId: string): Promise<void> {
  const res = await fetch(`/api/warmup/${poseModelId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Pose warmup failed (${res.status})`);
}

const captureCanvas = document.createElement('canvas');

interface ServerPose {
  label: string;
  score: number;
  bbox: [number, number, number, number] | null;
  keypoints: Array<{ x: number; y: number; score: number; name: string }>;
}

export async function detectServerPose(
  video: HTMLVideoElement,
  poseModelId: string,
  minConfidence: number,
  maxPoses = 10
): Promise<PoseVariantResult[]> {
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 720;
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
    `/api/pose/${poseModelId}?confidence=${minConfidence}&max_detections=${maxPoses}`,
    { method: 'POST', body: form }
  );
  if (!res.ok) throw new Error(`Server pose failed (${res.status})`);
  const data = (await res.json()) as { width: number; height: number; poses: ServerPose[] };
  const sx = vw / (data.width || captureCanvas.width);
  const sy = vh / (data.height || captureCanvas.height);
  const now = Date.now();
  return data.poses.map((p, idx) => ({
    id: `server-pose-${poseModelId}-${idx}-${now}`,
    variant: 'body' as const,
    label: p.label,
    keypoints: p.keypoints.map((k) => ({
      x: Math.round(k.x * sx),
      y: Math.round(k.y * sy),
      score: k.score,
      name: k.name,
    })),
    connections: COCO17_CONNECTIONS as PoseConnection[],
    score: p.score,
    bbox: p.bbox
      ? [Math.round(p.bbox[0] * sx), Math.round(p.bbox[1] * sy), Math.round(p.bbox[2] * sx), Math.round(p.bbox[3] * sy)] as [number, number, number, number]
      : undefined,
    color: '#22d3ee',
    timestamp: now,
  }));
}
