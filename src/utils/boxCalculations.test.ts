import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateIoU,
  nonMaxSuppression,
  formatConfidence,
  getConfidenceTheme,
  getColorForClass,
  fitBoundingBoxToView,
} from './boxCalculations';
import { DetectedObject } from '../types/detection';

test('calculateIoU returns 1.0 for identical boxes', () => {
  const boxA: [number, number, number, number] = [10, 10, 50, 50];
  const boxB: [number, number, number, number] = [10, 10, 50, 50];
  const iou = calculateIoU(boxA, boxB);
  assert.equal(iou, 1.0);
});

test('calculateIoU returns 0 for non-overlapping boxes', () => {
  const boxA: [number, number, number, number] = [0, 0, 10, 10];
  const boxB: [number, number, number, number] = [20, 20, 10, 10];
  const iou = calculateIoU(boxA, boxB);
  assert.equal(iou, 0);
});

test('calculateIoU computes accurate partial overlap', () => {
  // Box A: [0, 0, 10, 10] -> Area 100
  // Box B: [5, 0, 10, 10] -> Area 100
  // Intersection: x from 5 to 10 (w=5), y from 0 to 10 (h=10) -> Area 50
  // Union: 100 + 100 - 50 = 150
  // IoU: 50 / 150 = 1/3 ~ 0.333333
  const boxA: [number, number, number, number] = [0, 0, 10, 10];
  const boxB: [number, number, number, number] = [5, 0, 10, 10];
  const iou = calculateIoU(boxA, boxB);
  assert.ok(Math.abs(iou - 1 / 3) < 0.0001);
});

test('nonMaxSuppression filters out lower confidence overlapping boxes of same class', () => {
  const candidate1: DetectedObject = {
    id: '1',
    class: 'person',
    score: 0.95,
    bbox: [10, 10, 50, 50],
    color: '#06B6D4',
    timestamp: 100,
  };

  const candidate2: DetectedObject = {
    id: '2',
    class: 'person',
    score: 0.72,
    bbox: [12, 12, 48, 48], // almost identical overlap > 0.8 IoU
    color: '#06B6D4',
    timestamp: 100,
  };

  const candidate3: DetectedObject = {
    id: '3',
    class: 'cup',
    score: 0.88,
    bbox: [12, 12, 48, 48], // different class, keep
    color: '#F59E0B',
    timestamp: 100,
  };

  const result = nonMaxSuppression([candidate2, candidate1, candidate3], 0.5);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, '1');
  assert.equal(result[1].id, '3');
});

test('formatConfidence formats correctly', () => {
  assert.equal(formatConfidence(0.9423), '94.2%');
  assert.equal(formatConfidence(1.0), '100.0%');
  assert.equal(formatConfidence(0.0), '0.0%');
});

test('getConfidenceTheme categorizes scores by reliability thresholds', () => {
  assert.equal(getConfidenceTheme(0.85).label, 'High');
  assert.equal(getConfidenceTheme(0.65).label, 'Med');
  assert.equal(getConfidenceTheme(0.45).label, 'Low');
});

test('getColorForClass returns valid hex or hsl color', () => {
  assert.equal(getColorForClass('person'), '#06B6D4');
  assert.ok(getColorForClass('novel_custom_object').startsWith('hsl'));
});

test('fitBoundingBoxToView scales and offsets correctly with contain fit', () => {
  // Container: 1000 x 500, Intrinsic: 1000 x 1000
  // Scale: 0.5, Rendered size: 500 x 500, OffsetX = 250, OffsetY = 0
  const bbox: [number, number, number, number] = [100, 100, 200, 200];
  const fitted = fitBoundingBoxToView(bbox, 1000, 1000, 1000, 500, 'contain');
  assert.equal(fitted.left, 300); // 250 + 100 * 0.5
  assert.equal(fitted.top, 50);   // 0 + 100 * 0.5
  assert.equal(fitted.width, 100);
  assert.equal(fitted.height, 100);
});

test('fitBoundingBoxToView covers correctly without offset when aspect ratios match', () => {
  const bbox: [number, number, number, number] = [100, 100, 200, 200];
  const fitted = fitBoundingBoxToView(bbox, 640, 480, 1280, 960, 'contain');
  assert.equal(fitted.left, 200);
  assert.equal(fitted.top, 200);
  assert.equal(fitted.width, 400);
  assert.equal(fitted.height, 400);
});

