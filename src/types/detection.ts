import { DetectedPose } from './pose';

export type ModelFamily =
  | 'TensorFlow.js'
  | 'MediaPipe'
  | 'ONNX Runtime'
  | 'Transformers.js'
  | 'Ultralytics'
  | 'Roboflow'
  | 'ml5.js'
  | 'OpenCV.js'
  | 'WebNN'
  | 'LiteRT'
  | 'Liquid AI';

export type DownloadStatus = 'ready' | 'downloading' | 'not_downloaded' | 'error';

export interface ModelOption {
  id: string;
  name: string;
  family: ModelFamily;
  tagline: string;
  sizeMb: number;
  expectedLatencyMs: number;
  inputResolution: string;
  confidenceAccuracy: string;
  architecture: string;
  cocoClassesCount: number;
  backend: 'WebGL' | 'WASM' | 'WebGPU' | 'WebNN' | 'Server GPU';
  downloadStatus: DownloadStatus;
  downloadProgress?: number;
  errorMessage?: string;
  huggingFaceUrl?: string;
}

export interface DetectedObject {
  id: string;
  class: string;
  score: number; // 0.0 to 1.0
  bbox: [number, number, number, number]; // [x, y, width, height]
  color: string;
  trackingId?: number;
  center?: [number, number];
  timestamp: number;
}

export type BoxStyle = 'neon' | 'contrast' | 'corners' | 'minimal';

export interface DetectionSettings {
  minConfidence: number; // 0.1 to 0.95
  maxDetections: number; // 1 to 30
  selectedClasses: string[];
  boxStyle: BoxStyle;
  showConfidence: boolean;
  showCenterDot: boolean;
  showTrackId: boolean;
  audioAlert: boolean;
}

export interface TelemetryStats {
  fps: number;
  inferenceTimeMs: number;
  totalObjectsDetected: number;
  activeObjectCount: number;
  activePoseCount?: number;
  currentResolution: { width: number; height: number };
  engineStatus: 'idle' | 'loading' | 'running' | 'paused' | 'error';
  errorMessage?: string;
}

export interface DetectionSnapshot {
  id: string;
  timestamp: number;
  dataUrl: string;
  modelUsed: string;
  objects: DetectedObject[];
  poses?: DetectedPose[];
  inferenceTimeMs: number;
}
