import { DetectedObject } from '../types/detection';

/**
 * Calculates Intersection over Union (IoU) between two bounding boxes [x, y, w, h]
 */
export function calculateIoU(
  boxA: [number, number, number, number],
  boxB: [number, number, number, number]
): number {
  const [x1A, y1A, wA, hA] = boxA;
  const [x1B, y1B, wB, hB] = boxB;

  const x2A = x1A + wA;
  const y2A = y1A + hA;
  const x2B = x1B + wB;
  const y2B = y1B + hB;

  // Compute intersection boundaries
  const interX1 = Math.max(x1A, x1B);
  const interY1 = Math.max(y1A, y1B);
  const interX2 = Math.min(x2A, x2B);
  const interY2 = Math.min(y2A, y2B);

  const interWidth = Math.max(0, interX2 - interX1);
  const interHeight = Math.max(0, interY2 - interY1);
  const interArea = interWidth * interHeight;

  if (interArea <= 0) return 0;

  const areaA = wA * hA;
  const areaB = wB * hB;
  const unionArea = areaA + areaB - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

/**
 * Performs Non-Maximum Suppression (NMS) to eliminate overlapping duplicate boxes
 */
export function nonMaxSuppression(
  detections: DetectedObject[],
  iouThreshold = 0.5
): DetectedObject[] {
  if (detections.length <= 1) return detections;

  // Sort by confidence score descending
  const sorted = [...detections].sort((a, b) => b.score - a.score);
  const selected: DetectedObject[] = [];

  for (const candidate of sorted) {
    let shouldKeep = true;
    for (const chosen of selected) {
      // Check overlap if they share the same class or are heavily coincident
      if (candidate.class === chosen.class) {
        const iou = calculateIoU(candidate.bbox, chosen.bbox);
        if (iou >= iouThreshold) {
          shouldKeep = false;
          break;
        }
      }
    }
    if (shouldKeep) {
      selected.push(candidate);
    }
  }

  return selected;
}

/**
 * Formats confidence score as percentage string with 1 decimal place (e.g. "94.2%")
 */
export function formatConfidence(score: number): string {
  const clamped = Math.max(0, Math.min(1, score));
  return `${(clamped * 100).toFixed(1)}%`;
}

/**
 * Returns calibrated color tokens for confidence score reliability display
 */
export function getConfidenceTheme(score: number): {
  border: string;
  badgeBg: string;
  text: string;
  glow: string;
  label: 'High' | 'Med' | 'Low';
} {
  if (score >= 0.8) {
    return {
      border: '#10B981', // Emerald 500
      badgeBg: 'rgba(16, 185, 129, 0.9)',
      text: '#FFFFFF',
      glow: 'rgba(16, 185, 129, 0.25)',
      label: 'High',
    };
  }
  if (score >= 0.6) {
    return {
      border: '#06B6D4', // Cyan 500
      badgeBg: 'rgba(6, 182, 212, 0.9)',
      text: '#FFFFFF',
      glow: 'rgba(6, 182, 212, 0.25)',
      label: 'Med',
    };
  }
  return {
    border: '#F59E0B', // Amber 500
    badgeBg: 'rgba(245, 158, 11, 0.9)',
    text: '#FFFFFF',
    glow: 'rgba(245, 158, 11, 0.25)',
    label: 'Low',
  };
}

/**
 * Returns consistent distinct color by class name
 */
/**
 * Display label aliases: the underlying detector class stays untouched in
 * the model, but users see the site term. COCO has no fire-extinguisher
 * class, so APAR (fire extinguisher) units are detected as "fire hydrant"
 * and relabeled APAR everywhere (overlay, filters, snapshots).
 */
export const CLASS_LABEL_ALIASES: Record<string, string> = {
  'fire hydrant': 'APAR',
  'fire extinguisher': 'APAR',
};

export function displayClassLabel(className: string): string {
  return CLASS_LABEL_ALIASES[className.toLowerCase()] ?? className;
}

/** Classes never shown to the user (filtered out at detection time). */
export const EXCLUDED_CLASS_NAMES = new Set(['pipe', 'wall', 'floor']);

export function isExcludedClass(className: string): boolean {
  return EXCLUDED_CLASS_NAMES.has(className.toLowerCase());
}

const CLASS_COLORS: Record<string, string> = {
  person: '#06B6D4',
  'fire extinguisher': '#DC2626',
  'fire hydrant': '#DC2626',
  'cell phone': '#8B5CF6',
  laptop: '#10B981',
  cup: '#F59E0B',
  bottle: '#14B8A6',
  book: '#EC4899',
  chair: '#64748B',
  tv: '#3B82F6',
  keyboard: '#6366F1',
  mouse: '#84CC16',
  car: '#EF4444',
  backpack: '#D97706',
};

export function getColorForClass(className: string): string {
  if (CLASS_COLORS[className.toLowerCase()]) {
    return CLASS_COLORS[className.toLowerCase()];
  }
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    hash = className.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 80%, 50%)`;
}

export interface RenderedBoxRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Fits an intrinsic bounding box [x, y, w, h] to the real displayed video rect
 */
export function fitBoundingBoxToView(
  bbox: [number, number, number, number],
  intrinsicWidth: number,
  intrinsicHeight: number,
  containerWidth: number,
  containerHeight: number,
  fit: 'contain' | 'cover' | 'fill' = 'contain'
): RenderedBoxRect {
  if (!intrinsicWidth || !intrinsicHeight || !containerWidth || !containerHeight) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  const [x, y, w, h] = bbox;
  const scaleX = containerWidth / intrinsicWidth;
  const scaleY = containerHeight / intrinsicHeight;

  if (fit === 'contain') {
    const scale = Math.min(scaleX, scaleY);
    const renderedW = intrinsicWidth * scale;
    const renderedH = intrinsicHeight * scale;
    const offsetX = (containerWidth - renderedW) / 2;
    const offsetY = (containerHeight - renderedH) / 2;
    return {
      left: Math.round(offsetX + x * scale),
      top: Math.round(offsetY + y * scale),
      width: Math.round(w * scale),
      height: Math.round(h * scale),
    };
  }

  if (fit === 'cover') {
    const scale = Math.max(scaleX, scaleY);
    const renderedW = intrinsicWidth * scale;
    const renderedH = intrinsicHeight * scale;
    const offsetX = (containerWidth - renderedW) / 2;
    const offsetY = (containerHeight - renderedH) / 2;
    return {
      left: Math.round(offsetX + x * scale),
      top: Math.round(offsetY + y * scale),
      width: Math.round(w * scale),
      height: Math.round(h * scale),
    };
  }

  return {
    left: Math.round(x * scaleX),
    top: Math.round(y * scaleY),
    width: Math.round(w * scaleX),
    height: Math.round(h * scaleY),
  };
}

