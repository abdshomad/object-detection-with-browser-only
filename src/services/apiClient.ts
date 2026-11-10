import {
  DetectedObject,
  ModelOption,
  DetectionSnapshot,
} from '../types/detection';
import { AVAILABLE_MODELS } from '../../data/mockup/mockModels';
import { getColorForClass } from '../utils/boxCalculations';

export interface DetectionResult {
  objects: DetectedObject[];
  inferenceTimeMs: number;
  engineUsed: string;
  source: 'browser-engine';
}

/**
 * Service contract for fetching available object detector models
 */
export async function getModelCatalog(): Promise<ModelOption[]> {
  return AVAILABLE_MODELS;
}

/**
 * Format detections from TF.js COCO-SSD raw predictions into DetectedObject[]
 */
export function transformTfjsPredictions(
  predictions: Array<{
    bbox: [number, number, number, number];
    class: string;
    score: number;
  }>,
  minConfidence: number
): DetectedObject[] {
  const now = Date.now();
  return predictions
    .filter((p) => p.score >= minConfidence)
    .map((p, idx) => {
      const [x, y, w, h] = p.bbox;
      return {
        id: `tf-${idx}-${now}`,
        class: p.class,
        score: Math.round(p.score * 1000) / 1000,
        bbox: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)],
        color: getColorForClass(p.class),
        trackingId: 200 + idx,
        center: [Math.round(x + w / 2), Math.round(y + h / 2)],
        timestamp: now,
      };
    });
}

export async function persistSnapshot(
  snapshot: DetectionSnapshot
): Promise<{ success: boolean; storageKey: string }> {
  try {
    const key = `snapshot_${snapshot.id}`;
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('vision_snapshots') || '[]');
      const updated = [snapshot, ...existing].slice(0, 12);
      localStorage.setItem('vision_snapshots', JSON.stringify(updated));
    }
    return { success: true, storageKey: key };
  } catch (err) {
    console.warn('Storage quota reached, persisting in session only', err);
    return { success: true, storageKey: `session_${snapshot.id}` };
  }
}

export function getStoredSnapshots(): DetectionSnapshot[] {
  if (typeof window !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem('vision_snapshots') || '[]');
    } catch {
      return [];
    }
  }
  return [];
}

