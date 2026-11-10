import { PoseKeypoint, PoseStyle } from '../types/pose';
import { POSE_CONNECTIONS } from '../services/poseConnections';

export interface ViewPoint {
  x: number;
  y: number;
  score: number;
  name?: string;
}

/**
 * Maps a keypoint (normalized 0..1 or video pixels) to screen container coordinates
 */
export function fitPoseKeypointToView(
  point: PoseKeypoint,
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number,
  objectFit: 'contain' | 'cover' = 'contain'
): ViewPoint {
  // If point.x and point.y are <= 1.05, treat as normalized, else as video pixels
  const px = point.x <= 1.05 ? point.x * videoWidth : point.x;
  const py = point.y <= 1.05 ? point.y * videoHeight : point.y;

  const videoAspect = videoWidth / videoHeight;
  const containerAspect = containerWidth / containerHeight;

  let renderWidth: number;
  let renderHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (objectFit === 'contain') {
    if (containerAspect > videoAspect) {
      renderHeight = containerHeight;
      renderWidth = containerHeight * videoAspect;
      offsetX = (containerWidth - renderWidth) / 2;
      offsetY = 0;
    } else {
      renderWidth = containerWidth;
      renderHeight = containerWidth / videoAspect;
      offsetX = 0;
      offsetY = (containerHeight - renderHeight) / 2;
    }
  } else {
    if (containerAspect > videoAspect) {
      renderWidth = containerWidth;
      renderHeight = containerWidth / videoAspect;
      offsetX = 0;
      offsetY = (containerHeight - renderHeight) / 2;
    } else {
      renderHeight = containerHeight;
      renderWidth = containerHeight * videoAspect;
      offsetX = (containerWidth - renderWidth) / 2;
      offsetY = 0;
    }
  }

  const scaleX = renderWidth / videoWidth;
  const scaleY = renderHeight / videoHeight;

  return {
    x: offsetX + px * scaleX,
    y: offsetY + py * scaleY,
    score: point.score,
    name: point.name,
  };
}

/**
 * Returns color palette for a given pose style
 */
export function getPoseStyleColors(style: PoseStyle): {
  primary: string;
  glow: string;
  joint: string;
} {
  switch (style) {
    case 'neon':
      return { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.75)', joint: '#22d3ee' };
    case 'emerald':
      return { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.75)', joint: '#34d399' };
    case 'minimal':
      return { primary: '#f8fafc', glow: 'rgba(255, 255, 255, 0.4)', joint: '#ffffff' };
    case 'rainbow':
    default:
      return { primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.75)', joint: '#f43f5e' };
  }
}

/**
 * Returns connection bone line color based on anatomical limb and style
 */
export function getConnectionColor(startIdx: number, endIdx: number, style: PoseStyle): string {
  if (style !== 'rainbow') {
    return getPoseStyleColors(style).primary;
  }
  // Rainbow limb coloring
  if (startIdx <= 10 && endIdx <= 10) return '#f59e0b'; // Head (Amber)
  if ((startIdx === 11 || startIdx === 12) && (endIdx === 23 || endIdx === 24 || endIdx === 12)) {
    return '#10b981'; // Torso (Emerald)
  }
  if (startIdx % 2 !== 0 && endIdx % 2 !== 0) {
    return '#06b6d4'; // Left side limbs (Cyan)
  }
  return '#ec4899'; // Right side limbs (Pink)
}

/**
 * Synthesizes human keypoints proportionally inside a person's bounding box
 */
export function synthesizePoseFromPersonBox(
  bbox: [number, number, number, number],
  confidence: number
): PoseKeypoint[] {
  const [bx, by, bw, bh] = bbox;
  const centerX = bx + bw / 2;

  // Normalized proportional anatomical skeleton
  const keypoints: PoseKeypoint[] = new Array(33).fill(null).map(() => ({
    x: centerX,
    y: by + bh * 0.5,
    score: confidence,
  }));

  // Head
  keypoints[0] = { x: centerX, y: by + bh * 0.12, score: confidence, name: 'nose' };
  keypoints[1] = { x: centerX - bw * 0.06, y: by + bh * 0.1, score: confidence, name: 'left eye' };
  keypoints[4] = { x: centerX + bw * 0.06, y: by + bh * 0.1, score: confidence, name: 'right eye' };
  keypoints[7] = { x: centerX - bw * 0.15, y: by + bh * 0.12, score: confidence, name: 'left ear' };
  keypoints[8] = { x: centerX + bw * 0.15, y: by + bh * 0.12, score: confidence, name: 'right ear' };
  keypoints[9] = { x: centerX - bw * 0.06, y: by + bh * 0.16, score: confidence, name: 'mouth left' };
  keypoints[10] = { x: centerX + bw * 0.06, y: by + bh * 0.16, score: confidence, name: 'mouth right' };

  // Shoulders
  const shoulderY = by + bh * 0.24;
  keypoints[11] = { x: centerX - bw * 0.32, y: shoulderY, score: confidence, name: 'left shoulder' };
  keypoints[12] = { x: centerX + bw * 0.32, y: shoulderY, score: confidence, name: 'right shoulder' };

  // Arms
  const elbowY = by + bh * 0.44;
  keypoints[13] = { x: centerX - bw * 0.38, y: elbowY, score: confidence, name: 'left elbow' };
  keypoints[14] = { x: centerX + bw * 0.38, y: elbowY, score: confidence, name: 'right elbow' };

  const wristY = by + bh * 0.62;
  keypoints[15] = { x: centerX - bw * 0.34, y: wristY, score: confidence, name: 'left wrist' };
  keypoints[16] = { x: centerX + bw * 0.34, y: wristY, score: confidence, name: 'right wrist' };
  keypoints[17] = { x: centerX - bw * 0.36, y: wristY + bh * 0.05, score: confidence };
  keypoints[18] = { x: centerX + bw * 0.36, y: wristY + bh * 0.05, score: confidence };
  keypoints[19] = { x: centerX - bw * 0.33, y: wristY + bh * 0.05, score: confidence };
  keypoints[20] = { x: centerX + bw * 0.33, y: wristY + bh * 0.05, score: confidence };

  // Hips
  const hipY = by + bh * 0.54;
  keypoints[23] = { x: centerX - bw * 0.22, y: hipY, score: confidence, name: 'left hip' };
  keypoints[24] = { x: centerX + bw * 0.22, y: hipY, score: confidence, name: 'right hip' };

  // Knees
  const kneeY = by + bh * 0.76;
  keypoints[25] = { x: centerX - bw * 0.24, y: kneeY, score: confidence, name: 'left knee' };
  keypoints[26] = { x: centerX + bw * 0.24, y: kneeY, score: confidence, name: 'right knee' };

  // Ankles & Feet
  const ankleY = by + bh * 0.94;
  keypoints[27] = { x: centerX - bw * 0.22, y: ankleY, score: confidence, name: 'left ankle' };
  keypoints[28] = { x: centerX + bw * 0.22, y: ankleY, score: confidence, name: 'right ankle' };
  keypoints[29] = { x: centerX - bw * 0.24, y: ankleY + bh * 0.03, score: confidence };
  keypoints[30] = { x: centerX + bw * 0.24, y: ankleY + bh * 0.03, score: confidence };
  keypoints[31] = { x: centerX - bw * 0.20, y: ankleY + bh * 0.04, score: confidence };
  keypoints[32] = { x: centerX + bw * 0.20, y: ankleY + bh * 0.04, score: confidence };

  return keypoints;
}
