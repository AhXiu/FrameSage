import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyScene,
  confirmScene,
  evaluateScene,
} from '../src/lib/sceneEngine';

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

test('场景评估返回可信度、次选和风险', () => {
  const assessment = evaluateScene({
    brightness: 55,
    warmth: 50,
    centerEdge: -30,
    highlights: 70,
    contrast: 65,
    clutter: 40,
  });
  assert.equal(assessment.primary.id, 'window-backlight');
  assert.ok(assessment.confidence >= 0 && assessment.confidence <= 1);
  assert.notEqual(assessment.alternative.id, assessment.primary.id);
});

test('边界画面明确标记低可信度', () => {
  const assessment = evaluateScene({
    brightness: 56,
    warmth: 59,
    centerEdge: -14,
    highlights: 47,
    contrast: 49,
    clutter: 45,
  });
  assert.ok(assessment.confidence < 0.62);
  assert.ok(assessment.risks.some(risk => /重新取景|手动确认/.test(risk)));
});

test('手动纠正保留统计并切换主场景', () => {
  const metrics = {
    brightness: 55,
    warmth: 50,
    centerEdge: -30,
    highlights: 70,
    contrast: 65,
    clutter: 40,
  };
  const corrected = confirmScene(metrics, 'indoor-soft');
  assert.equal(corrected.primary.id, 'indoor-soft');
  assert.deepEqual(corrected.primary.metrics, metrics);
  assert.equal(corrected.manuallyConfirmed, true);
  assert.equal(corrected.confidence, 1);
});
