import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyScene } from '../src/lib/sceneEngine';

test('暗且偏冷识别为城市夜景', () => {
  const result = classifyScene({
    brightness: 12,
    warmth: 35,
    centerEdge: 0,
    highlights: 20,
    contrast: 80,
    clutter: 60,
  });
  assert.equal(result.id, 'city-night');
});
test('高亮背景与暗中心识别为窗边逆光', () => {
  const result = classifyScene({
    brightness: 55,
    warmth: 50,
    centerEdge: -30,
    highlights: 70,
    contrast: 65,
    clutter: 40,
  });
  assert.equal(result.id, 'window-backlight');
  assert.equal(result.direction, '人物背后');
});
test('高亮度低反差识别为户外顺光', () => {
  assert.equal(
    classifyScene({
      brightness: 82,
      warmth: 50,
      centerEdge: 3,
      highlights: 35,
      contrast: 30,
      clutter: 20,
    }).id,
    'outdoor-front',
  );
});
