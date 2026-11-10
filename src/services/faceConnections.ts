import { PoseConnection } from '../types/pose';

/**
 * Facial contours standard keypoints topology
 * Covers Face Oval, Eyebrows, Eyes, Nose Bridge, and Lips contours
 */
export const FACE_CONTOURS: PoseConnection[] = [
  // Face Oval
  { start: 0, end: 1 },
  { start: 1, end: 2 },
  { start: 2, end: 3 },
  { start: 3, end: 4 },
  { start: 4, end: 5 },
  { start: 5, end: 6 },
  { start: 6, end: 7 },
  { start: 7, end: 8 },
  { start: 8, end: 9 },
  { start: 9, end: 10 },
  { start: 10, end: 0 },
  // Left Eyebrow
  { start: 11, end: 12 },
  { start: 12, end: 13 },
  { start: 13, end: 14 },
  // Right Eyebrow
  { start: 15, end: 16 },
  { start: 16, end: 17 },
  { start: 17, end: 18 },
  // Left Eye
  { start: 19, end: 20 },
  { start: 20, end: 21 },
  { start: 21, end: 22 },
  { start: 22, end: 19 },
  // Right Eye
  { start: 23, end: 24 },
  { start: 24, end: 25 },
  { start: 25, end: 26 },
  { start: 26, end: 23 },
  // Nose Bridge & Base
  { start: 27, end: 28 },
  { start: 28, end: 29 },
  { start: 29, end: 30 },
  { start: 30, end: 31 },
  { start: 31, end: 29 },
  // Lips
  { start: 32, end: 33 },
  { start: 33, end: 34 },
  { start: 34, end: 35 },
  { start: 35, end: 36 },
  { start: 36, end: 37 },
  { start: 37, end: 32 },
];
