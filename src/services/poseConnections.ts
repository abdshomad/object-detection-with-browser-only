export interface PoseConnection {
  start: number;
  end: number;
}

/**
  * Standard 33-point BlazePose / COCO body topology
  */
export const POSE_CONNECTIONS: PoseConnection[] = [
  // Face & Head
  { start: 0, end: 1 },
  { start: 1, end: 2 },
  { start: 2, end: 3 },
  { start: 3, end: 7 },
  { start: 0, end: 4 },
  { start: 4, end: 5 },
  { start: 5, end: 6 },
  { start: 6, end: 8 },
  { start: 9, end: 10 },
  // Shoulders & Torso
  { start: 11, end: 12 },
  { start: 11, end: 23 },
  { start: 12, end: 24 },
  { start: 23, end: 24 },
  // Left Arm
  { start: 11, end: 13 },
  { start: 13, end: 15 },
  { start: 15, end: 17 },
  { start: 15, end: 19 },
  { start: 15, end: 21 },
  { start: 17, end: 19 },
  // Right Arm
  { start: 12, end: 14 },
  { start: 14, end: 16 },
  { start: 16, end: 18 },
  { start: 16, end: 20 },
  { start: 16, end: 22 },
  { start: 18, end: 20 },
  // Left Leg
  { start: 23, end: 25 },
  { start: 25, end: 27 },
  { start: 27, end: 29 },
  { start: 27, end: 31 },
  { start: 29, end: 31 },
  // Right Leg
  { start: 24, end: 26 },
  { start: 26, end: 28 },
  { start: 28, end: 30 },
  { start: 28, end: 32 },
  { start: 30, end: 32 },
];

export const KEYPOINT_NAMES: Record<number, string> = {
  0: 'nose',
  1: 'left eye inner',
  2: 'left eye',
  3: 'left eye outer',
  4: 'right eye inner',
  5: 'right eye',
  6: 'right eye outer',
  7: 'left ear',
  8: 'right ear',
  9: 'mouth left',
  10: 'mouth right',
  11: 'left shoulder',
  12: 'right shoulder',
  13: 'left elbow',
  14: 'right elbow',
  15: 'left wrist',
  16: 'right wrist',
  17: 'left pinky',
  18: 'right pinky',
  19: 'left index',
  20: 'right index',
  21: 'left thumb',
  22: 'right thumb',
  23: 'left hip',
  24: 'right hip',
  25: 'left knee',
  26: 'right knee',
  27: 'left ankle',
  28: 'right ankle',
  29: 'left heel',
  30: 'right heel',
  31: 'left foot index',
  32: 'right foot index',
};

/** COCO-17 skeleton topology (YOLO-Pose / RF-DETR Keypoint output layout) */
export const COCO17_CONNECTIONS: PoseConnection[] = [
  { start: 0, end: 1 }, { start: 0, end: 2 }, { start: 1, end: 3 }, { start: 2, end: 4 },
  { start: 0, end: 5 }, { start: 0, end: 6 }, { start: 5, end: 6 },
  { start: 5, end: 11 }, { start: 6, end: 12 }, { start: 11, end: 12 },
  { start: 5, end: 7 }, { start: 7, end: 9 }, { start: 6, end: 8 }, { start: 8, end: 10 },
  { start: 11, end: 13 }, { start: 13, end: 15 }, { start: 12, end: 14 }, { start: 14, end: 16 },
];
