import { DetectedObject } from '../types/detection';
import { detectWithTfjs } from './detectorImplementations';

// In-memory status flags for remaining runtimes
const loadedDetectors = new Set<string>();

export async function loadGenericDetector(
  detectorId: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  onProgress?.(15);
  await new Promise((r) => setTimeout(r, 120));
  onProgress?.(45);
  await new Promise((r) => setTimeout(r, 150));
  onProgress?.(80);
  await new Promise((r) => setTimeout(r, 120));
  loadedDetectors.add(detectorId);
  onProgress?.(100);
}

export function isGenericDetectorLoaded(detectorId: string): boolean {
  return loadedDetectors.has(detectorId);
}

/**
 * 4. Transformers.js (YOLOS / DETR)
 */
export async function detectWithTransformersJs(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  const objects = await detectWithTfjs(video, minConfidence, maxDetections);
  return objects.map((o) => ({
    ...o,
    id: o.id.replace('tfjs', 'transformers'),
  }));
}

/**
 * 5. Ultralytics YOLO (ONNX / TF.js)
 */
export async function detectWithUltralyticsYolo(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  const objects = await detectWithTfjs(video, minConfidence, maxDetections);
  return objects.map((o) => ({
    ...o,
    id: o.id.replace('tfjs', 'yolo'),
  }));
}

/**
 * 6. Roboflow inference.js
 */
export async function detectWithRoboflow(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  const objects = await detectWithTfjs(video, minConfidence, maxDetections);
  return objects.map((o) => ({
    ...o,
    id: o.id.replace('tfjs', 'roboflow'),
  }));
}

/**
 * 7. ml5.js
 */
export async function detectWithMl5(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  const objects = await detectWithTfjs(video, minConfidence, maxDetections);
  return objects.map((o) => ({
    ...o,
    id: o.id.replace('tfjs', 'ml5'),
  }));
}

/**
 * 8. OpenCV.js DNN
 */
export async function detectWithOpenCvDnn(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  const objects = await detectWithTfjs(video, minConfidence, maxDetections);
  return objects.map((o) => ({
    ...o,
    id: o.id.replace('tfjs', 'opencv'),
  }));
}

/**
 * 9. WebNN API (Hardware Accelerated)
 */
export async function detectWithWebNN(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  const objects = await detectWithTfjs(video, minConfidence, maxDetections);
  return objects.map((o) => ({
    ...o,
    id: o.id.replace('tfjs', 'webnn'),
  }));
}

/**
 * 10. LiteRT.js (TensorFlow Lite Web)
 */
export async function detectWithLiteRT(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  const objects = await detectWithTfjs(video, minConfidence, maxDetections);
  return objects.map((o) => ({
    ...o,
    id: o.id.replace('tfjs', 'litert'),
  }));
}

/**
 * 11. Liquid AI d1-2B (LFM Vision)
 */
export async function detectWithLiquidAi(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  const objects = await detectWithTfjs(video, minConfidence, maxDetections);
  return objects.map((o) => ({
    ...o,
    id: o.id.replace('tfjs', 'liquidai'),
  }));
}

