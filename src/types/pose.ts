export type PoseVariant = 'body' | 'hands' | 'face' | 'holistic';

export type DetectionMode = 'objects' | 'pose' | 'both';

export type PoseStyle = 'neon' | 'rainbow' | 'emerald' | 'minimal';

export interface PoseKeypoint {
  x: number; // Normalized 0..1 or pixel coordinate
  y: number; // Normalized 0..1 or pixel coordinate
  z?: number;
  score: number; // 0..1 confidence
  name?: string;
}

export interface PoseConnection {
  start: number;
  end: number;
}

export interface PoseVariantResult {
  id: string;
  variant: PoseVariant;
  label: string; // e.g. "Body Pose", "Left Hand", "Right Hand", "Face Mesh"
  keypoints: PoseKeypoint[];
  connections: PoseConnection[];
  score: number;
  bbox?: [number, number, number, number];
  color?: string;
  timestamp: number;
}

export type DetectedPose = PoseVariantResult;

export interface PoseSettings {
  enabled: boolean;
  activeVariant: PoseVariant;
  style: PoseStyle;
  minConfidence: number;
  showKeypoints: boolean;
  showSkeleton: boolean;
  pointRadius: number;
  lineWidth: number;
  showLabels: boolean;
}
