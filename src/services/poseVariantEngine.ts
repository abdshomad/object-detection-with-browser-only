import { PoseVariantResult, PoseVariant, PoseKeypoint } from '../types/pose';
import { DetectedObject } from '../types/detection';
import { POSE_CONNECTIONS } from './poseConnections';
import { FACE_CONTOURS } from './faceConnections';
import { synthesizePoseFromPersonBox } from '../utils/poseCalculations';
import { synthesizeFaceContourKeypoints } from '../utils/variantCalculations';
import { getPoseLandmarker, getFaceLandmarker, initAllPoseModels } from './visionModels';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { PoseConnection } from '../types/pose';

// Real MediaPipe face-mesh topology (478 landmarks): oval + eyes + brows + lips + nose
const FACE_MESH_CONNECTIONS: PoseConnection[] = [
  ...(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL ?? []),
  ...(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE ?? []),
  ...(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE ?? []),
  ...(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW ?? []),
  ...(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW ?? []),
  ...(FaceLandmarker.FACE_LANDMARKS_LIPS ?? []),
].map((c) => ({ start: c.start, end: c.end }));
import { detectRealHands } from './handPoseService';

export async function initPoseModel(): Promise<void> {
  await initAllPoseModels();
}

/**
 * Executes pose detection across body, hands, face, or holistic
 */
export async function detectPoseVariants(
  video: HTMLVideoElement,
  variant: PoseVariant,
  minConfidence: number,
  objects: DetectedObject[] = []
): Promise<PoseVariantResult[]> {
  const timestamp = performance.now();
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  const results: PoseVariantResult[] = [];

  const personObjects = objects.filter((o) => o.class === 'person');

  // 1. Real MediaPipe PoseLandmarker for body pose
  if (variant === 'body' || variant === 'holistic') {
    const poseDetector = await getPoseLandmarker();
    if (poseDetector) {
      try {
        const mpResult = poseDetector.detectForVideo(video, timestamp);
        if (mpResult && mpResult.landmarks && mpResult.landmarks.length > 0) {
          mpResult.landmarks.forEach((landmarkList, idx) => {
            const keypoints: PoseKeypoint[] = landmarkList.map((pt, kIdx) => ({
              x: pt.x * width,
              y: pt.y * height,
              z: pt.z,
              score: (pt as unknown as { visibility?: number }).visibility ?? 0.85,
              name: `point_${kIdx}`,
            }));

            results.push({
              id: `mp-pose-${idx}-${timestamp}`,
              variant: 'body',
              label: `Person Pose #${idx + 1}`,
              keypoints,
              connections: POSE_CONNECTIONS,
              score: 0.9,
              timestamp: Date.now(),
            });
          });
        }
      } catch (err) {
        console.warn('Real body pose detection error:', err);
      }
    }

    // Fallback body pose if none found
    if (results.length === 0) {
      const targets = personObjects.length > 0
        ? personObjects
        : [{ bbox: [width * 0.25, height * 0.15, width * 0.5, height * 0.75] as [number, number, number, number], score: 0.85 }];

      targets.forEach((target, idx) => {
        const keypoints = synthesizePoseFromPersonBox(target.bbox, target.score);
        results.push({
          id: `synth-body-${idx}-${timestamp}`,
          variant: 'body',
          label: `Body Pose #${idx + 1}`,
          keypoints,
          connections: POSE_CONNECTIONS,
          score: target.score,
          bbox: target.bbox,
          color: '#06b6d4',
          timestamp: Date.now(),
        });
      });
    }
  }

  // 2. Real Hand Pose Variant (MediaPipe HandLandmarker)
  if (variant === 'hands' || variant === 'holistic') {
    const handResults = await detectRealHands(
      video,
      timestamp,
      width,
      height,
      minConfidence,
      personObjects
    );
    results.push(...handResults);
  }

  // 3. Face Mesh Variant — real MediaPipe FaceLandmarker (478 pts, tightly
  // fitted to the actual face). The old synthesized oval was estimated from
  // the person box (20%/5%/60%/35% heuristic), so it drifted off the face.
  if (variant === 'face' || variant === 'holistic') {
    const faceDetector = await getFaceLandmarker();
    if (faceDetector) {
      try {
        const mpResult = faceDetector.detectForVideo(video, timestamp);
        const faces = mpResult?.faceLandmarks ?? [];
        faces.forEach((landmarkList, idx) => {
          const keypoints: PoseKeypoint[] = landmarkList.map((pt, kIdx) => ({
            x: pt.x * width,
            y: pt.y * height,
            z: pt.z,
            score: 0.9,
            name: `face_${kIdx}`,
          }));
          // Tight bbox from the actual landmarks so the box hugs the face.
          const xs = keypoints.map((k) => k.x);
          const ys = keypoints.map((k) => k.y);
          const minX = Math.min(...xs), maxX = Math.max(...xs);
          const minY = Math.min(...ys), maxY = Math.max(...ys);
          results.push({
            id: `mp-face-${idx}-${timestamp}`,
            variant: 'face',
            label: `Face Mesh #${idx + 1} (${keypoints.length} pts)`,
            keypoints,
            connections: FACE_MESH_CONNECTIONS,
            score: 0.92,
            bbox: [Math.round(minX), Math.round(minY), Math.round(maxX - minX), Math.round(maxY - minY)],
            color: '#10b981',
            timestamp: Date.now(),
          });
        });
      } catch (err) {
        console.warn('Real face detection error:', err);
      }
    } else {
      // Fallback only when the FaceLandmarker itself failed to load:
      // estimate from the person box (approximate, may not hug the face).
      const baseBox = personObjects[0]?.bbox || [width * 0.3, height * 0.15, width * 0.4, height * 0.7];
      const [bx, by, bw, bh] = baseBox;
      const faceBox: [number, number, number, number] = [
        bx + bw * 0.2,
        by + bh * 0.05,
        bw * 0.6,
        bh * 0.35,
      ];
      results.push({
        id: `face-mesh-${timestamp}`,
        variant: 'face',
        label: 'Facial Contours (estimated, 38 pts)',
        keypoints: synthesizeFaceContourKeypoints(faceBox, 0.92),
        connections: FACE_CONTOURS,
        score: 0.92,
        bbox: faceBox,
        color: '#10b981',
        timestamp: Date.now(),
      });
    }
  }

  return results.filter((r) => r.score >= minConfidence);
}
