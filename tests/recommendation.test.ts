import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_DEVICE } from '../src/data/devices';
import {
  recommend,
  safeShutterDenominator,
} from '../src/lib/recommendationEngine';
import { classifyScene } from '../src/lib/sceneEngine';

test('夜景 ISO 不超过设备阈值且快门有效', () => {
  const device = { ...DEFAULT_DEVICE, isoLimit: 1600, focalLength: 85 };
  const scene = classifyScene({
    brightness: 10,
    warmth: 40,
    centerEdge: 0,
    highlights: 30,
    contrast: 80,
    clutter: 70,
  });
  const result = recommend(device, scene, 'expert');
  assert.equal(result.iso, 1600);
  assert.match(result.shutter, /^1\/\d+s$/);
});
test('逆光使用点测光和正补偿', () => {
  const scene = classifyScene({
    brightness: 55,
    warmth: 50,
    centerEdge: -28,
    highlights: 70,
    contrast: 70,
    clutter: 30,
  });
  const result = recommend(DEFAULT_DEVICE, scene, 'beginner');
  assert.match(result.metering, /点测光/);
  assert.match(result.exposure, /^\+/);
});
test('缺失镜头字段仍返回有效参数', () => {
  const scene = classifyScene({
    brightness: 55,
    warmth: 52,
    centerEdge: 0,
    highlights: 10,
    contrast: 25,
    clutter: 20,
  });
  const result = recommend(
    {
      ...DEFAULT_DEVICE,
      focalLength: Number.NaN,
      maxAperture: Number.NaN,
      isoLimit: Number.NaN,
    },
    scene,
    'beginner',
  );
  assert.match(result.aperture, /^f\/\d/);
  assert.ok(Number.isFinite(result.iso));
});

test('安全快门遵守倒数法则并应用稳定余量', () => {
  assert.equal(safeShutterDenominator(85, 2), 170);
  assert.ok(safeShutterDenominator(200, 1.3) >= 200);
});

test('非法焦段和权重会回退为有效安全快门', () => {
  assert.equal(safeShutterDenominator(Number.NaN, 0), 80);
  assert.ok(safeShutterDenominator(-1, Number.NaN) >= 50);
});
