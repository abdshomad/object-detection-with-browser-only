import { DetectedObject } from '../types/detection';
import {
  loadTfjsDetector,
  detectWithTfjs,
  loadMediaPipeDetector,
  detectWithMediaPipe,
  loadOnnxDetector,
  detectWithOnnx,
} from './detectorImplementations';
import {
  loadGenericDetector,
  detectWithTransformersJs,
  detectWithUltralyticsYolo,
  detectWithRoboflow,
  detectWithMl5,
  detectWithOpenCvDnn,
  detectWithWebNN,
  detectWithLiteRT,
  detectWithLiquidAi,
} from './detectorImplementationsExtra';

/**
 * Downloads and initializes the requested object detector into the browser
 */
export async function downloadAndInitModel(
  modelId: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  switch (modelId) {
    case 'tfjs-coco-ssd':
      await loadTfjsDetector(onProgress);
      break;
    case 'mediapipe-detector':
      await loadMediaPipeDetector(onProgress);
      break;
    case 'onnx-runtime-web':
      await loadOnnxDetector(onProgress);
      break;
    default:
      await loadGenericDetector(modelId, onProgress);
      break;
  }
}

/**
 * Runs inference with the active model on the live camera video stream
 */
export async function runBrowserDetection(
  video: HTMLVideoElement,
  modelId: string,
  minConfidence: number,
  maxDetections: number
): Promise<{ objects: DetectedObject[]; latencyMs: number }> {
  const start = performance.now();
  let objects: DetectedObject[] = [];

  try {
    switch (modelId) {
      case 'mediapipe-detector':
        objects = await detectWithMediaPipe(video, minConfidence, maxDetections);
        break;
      case 'onnx-runtime-web':
        objects = await detectWithOnnx(video, minConfidence, maxDetections);
        break;
      case 'transformers-js':
        objects = await detectWithTransformersJs(video, minConfidence, maxDetections);
        break;
      case 'ultralytics-yolo':
        objects = await detectWithUltralyticsYolo(video, minConfidence, maxDetections);
        break;
      case 'roboflow-inference':
        objects = await detectWithRoboflow(video, minConfidence, maxDetections);
        break;
      case 'ml5-detector':
        objects = await detectWithMl5(video, minConfidence, maxDetections);
        break;
      case 'opencv-dnn':
        objects = await detectWithOpenCvDnn(video, minConfidence, maxDetections);
        break;
      case 'webnn-api':
        objects = await detectWithWebNN(video, minConfidence, maxDetections);
        break;
      case 'litert-js':
        objects = await detectWithLiteRT(video, minConfidence, maxDetections);
        break;
      case 'liquidai-d1-2b':
        objects = await detectWithLiquidAi(video, minConfidence, maxDetections);
        break;
      case 'tfjs-coco-ssd':
      default:
        objects = await detectWithTfjs(video, minConfidence, maxDetections);
        break;
    }
  } catch (err) {
    console.warn(`Detection cycle warning for ${modelId}:`, err);
    objects = [];
  }

  const latencyMs = Math.round(performance.now() - start);
  return { objects, latencyMs };
}
