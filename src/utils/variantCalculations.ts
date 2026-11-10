import { PoseKeypoint } from '../types/pose';

/**
 * Synthesizes 21-point hand skeleton (Wrist, Thumb, Index, Middle, Ring, Pinky)
 */
export function synthesizeHandKeypoints(
  cx: number,
  cy: number,
  radius: number,
  isRightHand: boolean,
  confidence: number
): PoseKeypoint[] {
  const points: PoseKeypoint[] = new Array(21);
  const dir = isRightHand ? 1 : -1;

  // Wrist
  points[0] = { x: cx, y: cy + radius * 0.7, score: confidence, name: 'wrist' };

  // Thumb (1..4)
  points[1] = { x: cx - dir * radius * 0.35, y: cy + radius * 0.45, score: confidence, name: 'thumb cmc' };
  points[2] = { x: cx - dir * radius * 0.65, y: cy + radius * 0.2, score: confidence, name: 'thumb mcp' };
  points[3] = { x: cx - dir * radius * 0.85, y: cy - radius * 0.05, score: confidence, name: 'thumb ip' };
  points[4] = { x: cx - dir * radius * 0.95, y: cy - radius * 0.25, score: confidence, name: 'thumb tip' };

  // Index (5..8)
  points[5] = { x: cx - dir * radius * 0.25, y: cy - radius * 0.1, score: confidence, name: 'index mcp' };
  points[6] = { x: cx - dir * radius * 0.32, y: cy - radius * 0.45, score: confidence, name: 'index pip' };
  points[7] = { x: cx - dir * radius * 0.36, y: cy - radius * 0.75, score: confidence, name: 'index dip' };
  points[8] = { x: cx - dir * radius * 0.38, y: cy - radius * 0.98, score: confidence, name: 'index tip' };

  // Middle (9..12)
  points[9] = { x: cx, y: cy - radius * 0.15, score: confidence, name: 'middle mcp' };
  points[10] = { x: cx, y: cy - radius * 0.52, score: confidence, name: 'middle pip' };
  points[11] = { x: cx, y: cy - radius * 0.82, score: confidence, name: 'middle dip' };
  points[12] = { x: cx, y: cy - radius * 1.05, score: confidence, name: 'middle tip' };

  // Ring (13..16)
  points[13] = { x: cx + dir * radius * 0.22, y: cy - radius * 0.1, score: confidence, name: 'ring mcp' };
  points[14] = { x: cx + dir * radius * 0.28, y: cy - radius * 0.45, score: confidence, name: 'ring pip' };
  points[15] = { x: cx + dir * radius * 0.32, y: cy - radius * 0.74, score: confidence, name: 'ring dip' };
  points[16] = { x: cx + dir * radius * 0.34, y: cy - radius * 0.95, score: confidence, name: 'ring tip' };

  // Pinky (17..20)
  points[17] = { x: cx + dir * radius * 0.42, y: cy, score: confidence, name: 'pinky mcp' };
  points[18] = { x: cx + dir * radius * 0.54, y: cy - radius * 0.3, score: confidence, name: 'pinky pip' };
  points[19] = { x: cx + dir * radius * 0.62, y: cy - radius * 0.55, score: confidence, name: 'pinky dip' };
  points[20] = { x: cx + dir * radius * 0.68, y: cy - radius * 0.75, score: confidence, name: 'pinky tip' };

  return points;
}

/**
 * Synthesizes 38-point facial contour landmarks (oval, eyebrows, eyes, nose, lips)
 */
export function synthesizeFaceContourKeypoints(
  bbox: [number, number, number, number],
  confidence: number
): PoseKeypoint[] {
  const [bx, by, bw, bh] = bbox;
  const cx = bx + bw / 2;
  const cy = by + bh * 0.48;
  const rw = bw * 0.44;
  const rh = bh * 0.48;

  const points: PoseKeypoint[] = [];

  // 0..10 Face Oval
  for (let i = 0; i <= 10; i++) {
    const angle = (Math.PI * 0.85 * (i - 5)) / 5 + Math.PI / 2;
    points.push({
      x: cx + rw * Math.cos(angle),
      y: cy + rh * Math.sin(angle),
      score: confidence,
      name: `oval_${i}`,
    });
  }

  // 11..14 Left Eyebrow
  points.push({ x: cx - rw * 0.6, y: cy - rh * 0.4, score: confidence, name: 'left eyebrow outer' });
  points.push({ x: cx - rw * 0.4, y: cy - rh * 0.48, score: confidence });
  points.push({ x: cx - rw * 0.2, y: cy - rh * 0.46, score: confidence });
  points.push({ x: cx - rw * 0.05, y: cy - rh * 0.38, score: confidence, name: 'left eyebrow inner' });

  // 15..18 Right Eyebrow
  points.push({ x: cx + rw * 0.05, y: cy - rh * 0.38, score: confidence, name: 'right eyebrow inner' });
  points.push({ x: cx + rw * 0.2, y: cy - rh * 0.46, score: confidence });
  points.push({ x: cx + rw * 0.4, y: cy - rh * 0.48, score: confidence });
  points.push({ x: cx + rw * 0.6, y: cy - rh * 0.4, score: confidence, name: 'right eyebrow outer' });

  // 19..22 Left Eye
  points.push({ x: cx - rw * 0.55, y: cy - rh * 0.2, score: confidence, name: 'left eye corner' });
  points.push({ x: cx - rw * 0.35, y: cy - rh * 0.28, score: confidence });
  points.push({ x: cx - rw * 0.15, y: cy - rh * 0.2, score: confidence });
  points.push({ x: cx - rw * 0.35, y: cy - rh * 0.14, score: confidence });

  // 23..26 Right Eye
  points.push({ x: cx + rw * 0.15, y: cy - rh * 0.2, score: confidence });
  points.push({ x: cx + rw * 0.35, y: cy - rh * 0.28, score: confidence });
  points.push({ x: cx + rw * 0.55, y: cy - rh * 0.2, score: confidence, name: 'right eye corner' });
  points.push({ x: cx + rw * 0.35, y: cy - rh * 0.14, score: confidence });

  // 27..31 Nose
  points.push({ x: cx, y: cy - rh * 0.25, score: confidence });
  points.push({ x: cx, y: cy, score: confidence });
  points.push({ x: cx, y: cy + rh * 0.18, score: confidence, name: 'nose tip' });
  points.push({ x: cx - rw * 0.2, y: cy + rh * 0.2, score: confidence });
  points.push({ x: cx + rw * 0.2, y: cy + rh * 0.2, score: confidence });

  // 32..37 Lips
  points.push({ x: cx - rw * 0.35, y: cy + rh * 0.45, score: confidence, name: 'mouth left' });
  points.push({ x: cx - rw * 0.15, y: cy + rh * 0.38, score: confidence });
  points.push({ x: cx + rw * 0.15, y: cy + rh * 0.38, score: confidence });
  points.push({ x: cx + rw * 0.35, y: cy + rh * 0.45, score: confidence, name: 'mouth right' });
  points.push({ x: cx + rw * 0.15, y: cy + rh * 0.52, score: confidence });
  points.push({ x: cx - rw * 0.15, y: cy + rh * 0.52, score: confidence });

  return points;
}
