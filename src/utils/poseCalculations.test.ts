import test from 'node:test';
import assert from 'node:assert';
import {
  fitPoseKeypointToView,
  synthesizePoseFromPersonBox,
  getPoseStyleColors,
} from './poseCalculations';
import {
  synthesizeHandKeypoints,
  synthesizeFaceContourKeypoints,
} from './variantCalculations';

test('fitPoseKeypointToView maps normalized coordinate to screen container with contain', () => {
  const pt = { x: 0.5, y: 0.5, score: 0.9 };
  const fitted = fitPoseKeypointToView(pt, 1280, 720, 1280, 720, 'contain');
  assert.strictEqual(Math.round(fitted.x), 640);
  assert.strictEqual(Math.round(fitted.y), 360);
});

test('fitPoseKeypointToView handles letterboxing horizontally', () => {
  const pt = { x: 0.5, y: 0.5, score: 0.8 };
  // Container is wider than 16:9
  const fitted = fitPoseKeypointToView(pt, 1280, 720, 2560, 720, 'contain');
  assert.strictEqual(Math.round(fitted.x), 1280);
  assert.strictEqual(Math.round(fitted.y), 360);
});

test('synthesizePoseFromPersonBox returns 33 keypoints', () => {
  const bbox: [number, number, number, number] = [100, 100, 200, 400];
  const points = synthesizePoseFromPersonBox(bbox, 0.85);
  assert.strictEqual(points.length, 33);
  assert.strictEqual(points[0].name, 'nose');
  assert.strictEqual(points[11].name, 'left shoulder');
  assert.strictEqual(points[12].name, 'right shoulder');
});

test('synthesizeHandKeypoints returns 21 joints', () => {
  const points = synthesizeHandKeypoints(300, 400, 50, false, 0.9);
  assert.strictEqual(points.length, 21);
  assert.strictEqual(points[0].name, 'wrist');
  assert.strictEqual(points[4].name, 'thumb tip');
  assert.strictEqual(points[8].name, 'index tip');
});

test('synthesizeFaceContourKeypoints returns 38 contour points', () => {
  const bbox: [number, number, number, number] = [200, 200, 150, 200];
  const points = synthesizeFaceContourKeypoints(bbox, 0.95);
  assert.strictEqual(points.length, 38);
});

test('getPoseStyleColors returns valid palette for neon style', () => {
  const colors = getPoseStyleColors('neon');
  assert.strictEqual(colors.primary, '#06b6d4');
  assert.ok(colors.glow.includes('rgba'));
});
