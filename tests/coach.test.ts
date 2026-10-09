import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_DEVICE } from '../src/data/devices';
import { matchesFavorite } from '../src/lib/favorites';
import { recommend } from '../src/lib/recommendationEngine';
import { classifyScene } from '../src/lib/sceneEngine';
import {
  buildShootingChecklist,
  getCorrectionAdvice,
} from '../src/lib/shootingCoach';
import type { Favorite, PosePlan } from '../src/types';

const scene = classifyScene({
  brightness: 55,
  warmth: 50,
  centerEdge: -28,
  highlights: 70,
  contrast: 70,
  clutter: 30,
});
const params = recommend(DEFAULT_DEVICE, scene, 'beginner');
const plan: PosePlan = {
  id: 'pose-1',
  name: '测试姿势',
  scene: scene.id,
  focal: 50,
  composition: '三分法',
  head: '微侧',
  shoulders: '放松',
  hands: '自然',
  feet: '前后站',
  gaze: '看镜头',
  direction: '身体微侧，脸朝向光源。',
  framing: '人物放在左侧三分线',
  avoid: '不要切到关节。',
};

test('五类试拍问题均返回 2-3 步可执行建议', () => {
  const problems = [
    'face-dark',
    'motion-blur',
    'noise',
    'background-clipped',
    'skin-color',
  ] as const;
  for (const problem of problems) {
    const advice = getCorrectionAdvice(problem, DEFAULT_DEVICE, scene, params);
    assert.equal(advice.problem, problem);
    assert.ok(advice.steps.length >= 2 && advice.steps.length <= 3);
    assert.ok(advice.steps.every(step => step.length > 8));
  }
});

test('纠偏建议尊重设备 ISO 上限', () => {
  const device = { ...DEFAULT_DEVICE, isoLimit: params.iso };
  const advice = getCorrectionAdvice('motion-blur', device, scene, params);
  assert.ok(advice.steps.some(step => /已到上限|上限/.test(step)));
});

test('现场清单严格输出站位、设置、检查三步', () => {
  const checklist = buildShootingChecklist(scene, params, plan, {
    motion: 'still',
    holding: 'normal',
    groupSize: 'couple',
  });
  assert.equal(checklist.length, 3);
  assert.match(checklist[0], /^站位/);
  assert.match(checklist[1], /^设置/);
  assert.match(checklist[2], /^拍摄检查/);
  assert.match(checklist[0], /两人/);
});

test('收藏判定包含设备 id，跨设备不会互相覆盖', () => {
  const favorite: Favorite = {
    id: 'favorite-1',
    createdAt: new Date(0).toISOString(),
    note: '',
    scene,
    device: { ...DEFAULT_DEVICE, id: 'device-a' },
    params,
    plan,
  };
  assert.equal(matchesFavorite(favorite, plan.id, scene.id, 'device-a'), true);
  assert.equal(matchesFavorite(favorite, plan.id, scene.id, 'device-b'), false);
});
