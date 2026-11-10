import { PoseConnection } from '../types/pose';

/**
 * 21 Hand Landmarks standard topology (MediaPipe Hands):
 * 0: Wrist
 * 1-4: Thumb (CMC, MCP, IP, TIP)
 * 5-8: Index finger (MCP, PIP, DIP, TIP)
 * 9-12: Middle finger (MCP, PIP, DIP, TIP)
 * 13-16: Ring finger (MCP, PIP, DIP, TIP)
 * 17-20: Pinky finger (MCP, PIP, DIP, TIP)
 */
export const HAND_CONNECTIONS: PoseConnection[] = [
  // Thumb
  { start: 0, end: 1 },
  { start: 1, end: 2 },
  { start: 2, end: 3 },
  { start: 3, end: 4 },
  // Index
  { start: 0, end: 5 },
  { start: 5, end: 6 },
  { start: 6, end: 7 },
  { start: 7, end: 8 },
  // Middle
  { start: 5, end: 9 },
  { start: 9, end: 10 },
  { start: 10, end: 11 },
  { start: 11, end: 12 },
  // Ring
  { start: 9, end: 13 },
  { start: 13, end: 14 },
  { start: 14, end: 15 },
  { start: 15, end: 16 },
  // Pinky
  { start: 13, end: 17 },
  { start: 0, end: 17 },
  { start: 17, end: 18 },
  { start: 18, end: 19 },
  { start: 19, end: 20 },
];

export const HAND_KEYPOINT_NAMES: Record<number, string> = {
  0: 'wrist',
  1: 'thumb cmc',
  2: 'thumb mcp',
  3: 'thumb ip',
  4: 'thumb tip',
  5: 'index mcp',
  6: 'index pip',
  7: 'index dip',
  8: 'index tip',
  9: 'middle mcp',
  10: 'middle pip',
  11: 'middle dip',
  12: 'middle tip',
  13: 'ring mcp',
  14: 'ring pip',
  15: 'ring dip',
  16: 'ring tip',
  17: 'pinky mcp',
  18: 'pinky pip',
  19: 'pinky dip',
  20: 'pinky tip',
};
