import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_DEVICE } from '../src/data/devices';
import {
  calculateExposureCompensation,
  exposureValue,
  mapMetricsToEV,
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

test('安全快门遵守倒数法则并向上取常用档位', () => {
  assert.equal(safeShutterDenominator(85, 2), 200);
  assert.equal(safeShutterDenominator(200, 1.3), 320);
  assert.equal(safeShutterDenominator(600, 2), 1250);
});

test('非法焦段和权重会回退为有效安全快门', () => {
  assert.equal(safeShutterDenominator(Number.NaN, 0), 80);
  assert.ok(safeShutterDenominator(-1, Number.NaN) >= 50);
});

test('曝光三角公式符合 EV100 定义', () => {
  const ev = exposureValue(2.8, 1 / 125);
  assert.ok(Math.abs(ev - 9.94) < 0.05);
});

test('场景统计会映射到合理 EV100 区间', () => {
  const brightScene = classifyScene({
    brightness: 85,
    warmth: 50,
    centerEdge: 2,
    highlights: 20,
    contrast: 20,
    clutter: 20,
  });
  const darkScene = classifyScene({
    brightness: 8,
    warmth: 35,
    centerEdge: 0,
    highlights: 20,
    contrast: 75,
    clutter: 60,
  });
  assert.ok(mapMetricsToEV(brightScene) > mapMetricsToEV(darkScene));
});

test('镜头最大光圈会约束推荐光圈', () => {
  const scene = classifyScene({
    brightness: 45,
    warmth: 52,
    centerEdge: 0,
    highlights: 15,
    contrast: 30,
    clutter: 20,
  });
  const result = recommend(
    { ...DEFAULT_DEVICE, maxAperture: 4 },
    scene,
    'beginner',
  );
  assert.equal(result.aperture, 'f/4');
});

test('品牌会影响连续眼部对焦术语', () => {
  const scene = classifyScene({
    brightness: 55,
    warmth: 50,
    centerEdge: 0,
    highlights: 15,
    contrast: 25,
    clutter: 20,
  });
  const sony = recommend(DEFAULT_DEVICE, scene, 'beginner');
  const canon = recommend(
    { ...DEFAULT_DEVICE, brand: 'Canon' },
    scene,
    'beginner',
  );
  assert.match(sony.focus, /实时追踪/);
  assert.match(canon.focus, /Servo AF/);
});

test('高动态范围机身在逆光下减少正补偿以保护高光', () => {
  const scene = classifyScene({
    brightness: 55,
    warmth: 50,
    centerEdge: -28,
    highlights: 70,
    contrast: 70,
    clutter: 30,
  });
  const wide = calculateExposureCompensation(
    { ...DEFAULT_DEVICE, dynamicRange: 14.8 },
    scene,
  );
  const narrow = calculateExposureCompensation(
    { ...DEFAULT_DEVICE, dynamicRange: 12 },
    scene,
  );
  assert.ok(wide < narrow);
});

test('低 ISO 上限夜景会保持快门并给出欠曝风险', () => {
  const scene = classifyScene({
    brightness: 5,
    warmth: 35,
    centerEdge: 0,
    highlights: 10,
    contrast: 80,
    clutter: 70,
  });
  const result = recommend(
    { ...DEFAULT_DEVICE, isoLimit: 400, focalLength: 85 },
    scene,
    'expert',
  );
  assert.equal(result.iso, 400);
  assert.match(result.risk, /欠曝|靠近光源|补光/);
  assert.ok(Number(result.shutter.match(/\d+/g)?.[1]) >= 100);
});

test('人物快速动作优先提高安全快门', () => {
  const scene = classifyScene({
    brightness: 52,
    warmth: 50,
    centerEdge: 0,
    highlights: 20,
    contrast: 25,
    clutter: 20,
  });
  const still = recommend(DEFAULT_DEVICE, scene, 'beginner', {
    motion: 'still',
    holding: 'normal',
    groupSize: 'single',
  });
  const fast = recommend(DEFAULT_DEVICE, scene, 'beginner', {
    motion: 'fast',
    holding: 'normal',
    groupSize: 'single',
  });
  const denominator = (value: string) => Number(value.match(/1\/(\d+)/)?.[1]);
  assert.ok(denominator(fast.shutter) > denominator(still.shutter));
  assert.ok(fast.iso >= still.iso);
});

test('容易手抖比三脚架使用更快安全快门', () => {
  const scene = classifyScene({
    brightness: 35,
    warmth: 50,
    centerEdge: 0,
    highlights: 10,
    contrast: 25,
    clutter: 20,
  });
  const shaky = recommend(DEFAULT_DEVICE, scene, 'beginner', {
    motion: 'still',
    holding: 'shaky',
    groupSize: 'single',
  });
  const tripod = recommend(DEFAULT_DEVICE, scene, 'beginner', {
    motion: 'still',
    holding: 'tripod',
    groupSize: 'single',
  });
  const denominator = (value: string) => Number(value.match(/1\/(\d+)/)?.[1]);
  assert.ok(denominator(shaky.shutter) > denominator(tripod.shutter));
});

test('多人拍摄收小光圈并联动 ISO', () => {
  const scene = classifyScene({
    brightness: 52,
    warmth: 50,
    centerEdge: 0,
    highlights: 20,
    contrast: 25,
    clutter: 20,
  });
  const single = recommend(DEFAULT_DEVICE, scene, 'beginner');
  const group = recommend(DEFAULT_DEVICE, scene, 'beginner', {
    motion: 'still',
    holding: 'normal',
    groupSize: 'group',
  });
  assert.ok(Number(group.aperture.slice(2)) > Number(single.aperture.slice(2)));
  assert.ok(group.iso >= single.iso);
});

test('三脚架仍保护走动人物的运动快门', () => {
  const scene = classifyScene({
    brightness: 40,
    warmth: 50,
    centerEdge: 0,
    highlights: 15,
    contrast: 25,
    clutter: 20,
  });
  const result = recommend(DEFAULT_DEVICE, scene, 'beginner', {
    motion: 'walking',
    holding: 'tripod',
    groupSize: 'single',
  });
  assert.ok(Number(result.shutter.match(/1\/(\d+)/)?.[1]) >= 320);
});
