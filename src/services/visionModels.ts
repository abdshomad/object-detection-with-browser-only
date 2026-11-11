import { FilesetResolver, PoseLandmarker, HandLandmarker, FaceLandmarker } from '@mediapipe/tasks-vision';

let visionResolver: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> | null = null;
let poseLandmarker: PoseLandmarker | null = null;
let handLandmarker: HandLandmarker | null = null;
let faceLandmarker: FaceLandmarker | null = null;

let isPoseLoading = false;
let isHandLoading = false;
let isFaceLoading = false;

async function getVisionResolver() {
  if (!visionResolver) {
    visionResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
  }
  return visionResolver;
}

export async function getPoseLandmarker(): Promise<PoseLandmarker | null> {
  if (poseLandmarker) return poseLandmarker;
  if (isPoseLoading) return null;
  isPoseLoading = true;
  try {
    const vision = await getVisionResolver();
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 2,
      minPoseDetectionConfidence: 0.35,
    });
  } catch (err) {
    console.warn('PoseLandmarker init error:', err);
  } finally {
    isPoseLoading = false;
  }
  return poseLandmarker;
}

export async function getHandLandmarker(): Promise<HandLandmarker | null> {
  if (handLandmarker) return handLandmarker;
  if (isHandLoading) return null;
  isHandLoading = true;
  try {
    const vision = await getVisionResolver();
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 4,
      minHandDetectionConfidence: 0.3,
      minHandPresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });
  } catch (err) {
    console.warn('HandLandmarker init error:', err);
  } finally {
    isHandLoading = false;
  }
  return handLandmarker;
}

export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (faceLandmarker) return faceLandmarker;
  if (isFaceLoading) return null;
  isFaceLoading = true;
  try {
    const vision = await getVisionResolver();
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float32/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 4,
      minFaceDetectionConfidence: 0.4,
      minFacePresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });
  } catch (err) {
    console.warn('FaceLandmarker init error:', err);
  } finally {
    isFaceLoading = false;
  }
  return faceLandmarker;
}

export async function initAllPoseModels(): Promise<void> {
  // Preload in parallel on app launch
  Promise.allSettled([getPoseLandmarker(), getHandLandmarker(), getFaceLandmarker()]).catch(() => {});
}
