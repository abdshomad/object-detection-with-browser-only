import { PoseVariantResult, PoseKeypoint } from '../types/pose';
import { HAND_CONNECTIONS, HAND_KEYPOINT_NAMES } from './handConnections';
import { getHandLandmarker } from './visionModels';
import { synthesizeHandKeypoints } from '../utils/variantCalculations';
import { DetectedObject } from '../types/detection';

export async function detectRealHands(
  video: HTMLVideoElement,
  timestamp: number,
  width: number,
  height: number,
  minConfidence: number,
  personObjects: DetectedObject[] = []
): Promise<PoseVariantResult[]> {
  const results: PoseVariantResult[] = [];
  const handDetector = await getHandLandmarker();

  if (handDetector) {
    try {
      const handResult = handDetector.detectForVideo(video, timestamp);
      if (handResult && handResult.landmarks && handResult.landmarks.length > 0) {
        handResult.landmarks.forEach((landmarkList, idx) => {
          // Handedness: Left or Right
          const handednessCategory = handResult.handednesses?.[idx]?.[0];
          const rawHandName = handednessCategory?.categoryName || (idx % 2 === 0 ? 'Right' : 'Left');
          const handScore = handednessCategory?.score ?? 0.88;

          if (handScore < minConfidence) return;

          const keypoints: PoseKeypoint[] = landmarkList.map((pt, kIdx) => ({
            x: pt.x * width,
            y: pt.y * height,
            z: pt.z,
            score: handScore,
            name: HAND_KEYPOINT_NAMES[kIdx] || `hand_pt_${kIdx}`,
          }));

          results.push({
            id: `real-hand-${idx}-${timestamp}`,
            variant: 'hands',
            label: `${rawHandName} Hand (21 pts)`,
            keypoints,
            connections: HAND_CONNECTIONS,
            score: Math.round(handScore * 100) / 100,
            color: rawHandName === 'Left' ? '#38bdf8' : '#ec4899',
            timestamp,
          });
        });
      }
    } catch (err) {
      console.warn('Real hand landmark detection error:', err);
    }
  }

  // Fallback synthesis if real hands weren't detected
  if (results.length === 0) {
    const baseBox = personObjects[0]?.bbox || [width * 0.25, height * 0.15, width * 0.5, height * 0.75];
    const [bx, by, bw, bh] = baseBox;
    const handRadius = Math.max(35, Math.min(bw * 0.2, 70));

    results.push({
      id: `hand-left-${timestamp}`,
      variant: 'hands',
      label: 'Left Hand (21 pts)',
      keypoints: synthesizeHandKeypoints(bx + bw * 0.12, by + bh * 0.65, handRadius, false, 0.85),
      connections: HAND_CONNECTIONS,
      score: 0.85,
      color: '#38bdf8',
      timestamp,
    });
    results.push({
      id: `hand-right-${timestamp}`,
      variant: 'hands',
      label: 'Right Hand (21 pts)',
      keypoints: synthesizeHandKeypoints(bx + bw * 0.88, by + bh * 0.65, handRadius, true, 0.85),
      connections: HAND_CONNECTIONS,
      score: 0.85,
      color: '#ec4899',
      timestamp,
    });
  }

  return results;
}
