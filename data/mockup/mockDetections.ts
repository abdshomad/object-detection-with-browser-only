import { DetectedObject } from '../../src/types/detection';

export interface MockScenario {
  id: string;
  name: string;
  description: string;
  objects: Array<{
    class: string;
    baseBbox: [number, number, number, number]; // [x, y, w, h] normalized 0..100
    baseConfidence: number;
    color: string;
    motionSpeed: number; // orbital movement rate
    motionRadius: number;
  }>;
}

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'workstation',
    name: 'Workstation Setup',
    description: 'Typical desk environment with laptop, person, cup, phone, and chair',
    objects: [
      {
        class: 'person',
        baseBbox: [30, 15, 38, 70],
        baseConfidence: 0.96,
        color: '#06B6D4',
        motionSpeed: 0.4,
        motionRadius: 2.5,
      },
      {
        class: 'laptop',
        baseBbox: [32, 54, 32, 34],
        baseConfidence: 0.93,
        color: '#10B981',
        motionSpeed: 0.1,
        motionRadius: 0.8,
      },
      {
        class: 'cup',
        baseBbox: [18, 62, 10, 16],
        baseConfidence: 0.88,
        color: '#F59E0B',
        motionSpeed: 0.2,
        motionRadius: 1.2,
      },
      {
        class: 'cell phone',
        baseBbox: [72, 66, 11, 20],
        baseConfidence: 0.91,
        color: '#8B5CF6',
        motionSpeed: 0.3,
        motionRadius: 1.5,
      },
      {
        class: 'chair',
        baseBbox: [22, 38, 48, 56],
        baseConfidence: 0.84,
        color: '#64748B',
        motionSpeed: 0.05,
        motionRadius: 0.4,
      },
    ],
  },
  {
    id: 'meeting',
    name: 'Collaboration Room',
    description: 'Conference room with multiple people and presentation tech',
    objects: [
      {
        class: 'person',
        baseBbox: [14, 20, 26, 68],
        baseConfidence: 0.94,
        color: '#06B6D4',
        motionSpeed: 0.5,
        motionRadius: 3,
      },
      {
        class: 'person',
        baseBbox: [58, 22, 28, 65],
        baseConfidence: 0.92,
        color: '#0EA5E9',
        motionSpeed: 0.4,
        motionRadius: 2.8,
      },
      {
        class: 'tv',
        baseBbox: [36, 12, 30, 36],
        baseConfidence: 0.89,
        color: '#EC4899',
        motionSpeed: 0.05,
        motionRadius: 0.5,
      },
      {
        class: 'bottle',
        baseBbox: [46, 60, 8, 22],
        baseConfidence: 0.86,
        color: '#14B8A6',
        motionSpeed: 0.2,
        motionRadius: 1.0,
      },
    ],
  },
];

/**
 * Generate synthetic realistic detection objects for canvas frame
 */
export function generateSyntheticDetections(
  scenarioId: string,
  tick: number,
  canvasWidth: number,
  canvasHeight: number,
  minConfidence: number
): DetectedObject[] {
  const scenario = MOCK_SCENARIOS.find((s) => s.id === scenarioId) || MOCK_SCENARIOS[0];
  const now = Date.now();

  return scenario.objects
    .map((item, index) => {
      // Small harmonic oscillation to simulate live webcam bounding box jitter
      const angle = (tick * item.motionSpeed * 0.05) + index;
      const offsetXPercent = Math.sin(angle) * item.motionRadius;
      const offsetYPercent = Math.cos(angle * 0.7) * (item.motionRadius * 0.6);

      // Micro-jitter in confidence score (e.g. +/- 3%)
      const scoreJitter = Math.sin(tick * 0.1 + index * 2) * 0.035;
      const score = Math.min(0.99, Math.max(0.4, item.baseConfidence + scoreJitter));

      if (score < minConfidence) return null;

      const normX = Math.max(2, Math.min(90, item.baseBbox[0] + offsetXPercent));
      const normY = Math.max(2, Math.min(90, item.baseBbox[1] + offsetYPercent));
      const normW = item.baseBbox[2];
      const normH = item.baseBbox[3];

      const pxX = Math.round((normX / 100) * canvasWidth);
      const pxY = Math.round((normY / 100) * canvasHeight);
      const pxW = Math.round((normW / 100) * canvasWidth);
      const pxH = Math.round((normH / 100) * canvasHeight);

      const obj: DetectedObject = {
        id: `synth-${item.class}-${index}`,
        class: item.class,
        score: Math.round(score * 1000) / 1000,
        bbox: [pxX, pxY, pxW, pxH],
        color: item.color,
        trackingId: 101 + index,
        center: [pxX + pxW / 2, pxY + pxH / 2],
        timestamp: now,
      };
      return obj;
    })
    .filter((item): item is DetectedObject => item !== null);
}
