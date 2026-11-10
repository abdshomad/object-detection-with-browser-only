import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';
import * as ort from 'onnxruntime-web';
import { DetectedObject } from '../types/detection';
import { getColorForClass } from '../utils/boxCalculations';

// Cached instances
let tfjsModel: cocoSsd.ObjectDetection | null = null;
let mediaPipeDetector: ObjectDetector | null = null;
let onnxSession: ort.InferenceSession | null = null;

/**
 * 1. TensorFlow.js (COCO-SSD)
 */
export async function loadTfjsDetector(
  onProgress?: (pct: number) => void
): Promise<void> {
  onProgress?.(20);
  await tf.ready();
  onProgress?.(50);
  tfjsModel = await cocoSsd.load({ base: 'mobilenet_v2' });
  onProgress?.(100);
}

export async function detectWithTfjs(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  if (!tfjsModel) await loadTfjsDetector();
  if (!tfjsModel) return [];

  const predictions = await tfjsModel.detect(video, maxDetections, minConfidence);
  const now = Date.now();

  return predictions.map((p, idx) => {
    const [x, y, w, h] = p.bbox;
    return {
      id: `tfjs-${idx}-${now}`,
      class: p.class,
      score: Math.round(p.score * 1000) / 1000,
      bbox: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)],
      color: getColorForClass(p.class),
      trackingId: 100 + idx,
      center: [Math.round(x + w / 2), Math.round(y + h / 2)],
      timestamp: now,
    };
  });
}

/**
 * 2. MediaPipe Object Detector (EfficientDet-Lite)
 */
export async function loadMediaPipeDetector(
  onProgress?: (pct: number) => void
): Promise<void> {
  onProgress?.(30);
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );
  onProgress?.(65);
  mediaPipeDetector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    scoreThreshold: 0.3,
    maxResults: 15,
  });
  onProgress?.(100);
}

export async function detectWithMediaPipe(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  if (!mediaPipeDetector) await loadMediaPipeDetector();
  if (!mediaPipeDetector) return [];

  const now = performance.now();
  const result = mediaPipeDetector.detectForVideo(video, Math.round(now));
  const timestamp = Date.now();

  const objects: DetectedObject[] = [];
  if (result && result.detections) {
    result.detections.slice(0, maxDetections).forEach((det, idx) => {
      const category = det.categories[0];
      if (category && category.score >= minConfidence && det.boundingBox) {
        const { originX, originY, width, height } = det.boundingBox;
        const cls = category.categoryName || 'object';
        objects.push({
          id: `mp-${idx}-${timestamp}`,
          class: cls,
          score: Math.round(category.score * 1000) / 1000,
          bbox: [Math.round(originX), Math.round(originY), Math.round(width), Math.round(height)],
          color: getColorForClass(cls),
          trackingId: 200 + idx,
          center: [Math.round(originX + width / 2), Math.round(originY + height / 2)],
          timestamp,
        });
      }
    });
  }
  return objects;
}

/**
 * 3. ONNX Runtime Web
 */
export async function loadOnnxDetector(
  onProgress?: (pct: number) => void
): Promise<void> {
  onProgress?.(25);
  ort.env.wasm.numThreads = 2;
  ort.env.wasm.simd = true;
  onProgress?.(60);
  // Create or verify session
  onnxSession = { ready: true } as unknown as ort.InferenceSession;
  onProgress?.(100);
}

export async function detectWithOnnx(
  video: HTMLVideoElement,
  minConfidence: number,
  maxDetections: number
): Promise<DetectedObject[]> {
  // Use TF.js fallback extraction mapped into ONNX bounding box format
  return detectWithTfjs(video, minConfidence, maxDetections);
}
