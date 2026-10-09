import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fitWithinMaxEdge,
  validateImageFile,
} from '../src/lib/imageProcessing';
import { personalizePosePlans } from '../src/lib/personalizedPoses';
import {
  parseVisionResponse,
  requestVisionAnalysis,
} from '../src/lib/visionClient';
import type { EnvironmentProfile, OutfitProfile, PosePlan } from '../src/types';

const makePlan = (
  id: string,
  scene: PosePlan['scene'],
  name: string,
  focal: number,
  composition: PosePlan['composition'],
): PosePlan => ({
  id,
  scene,
  name,
  focal,
  composition,
  head: '微侧',
  shoulders: '放松',
  hands: '自然',
  feet: '前后站',
  gaze: '看镜头',
  direction: '基础引导。',
  framing: '基础构图。',
  avoid: '避免切关节。',
});
const PLANS: PosePlan[] = [
  makePlan('night-story', 'city-night', '环境叙事', 35, '框架'),
  makePlan('night-close', 'city-night', '安静特写', 85, '居中'),
  makePlan('indoor-relax', 'indoor-soft', '松弛半身', 50, '三分法'),
  makePlan('indoor-story', 'indoor-soft', '环境叙事', 35, '框架'),
  makePlan('outdoor-story', 'outdoor-side', '环境叙事', 35, '框架'),
];

const outfit = (
  styles: string[] = [],
  clothingTypes: string[] = [],
): OutfitProfile => ({
  styles,
  clothingTypes,
  footwearAccessories: [],
  movementRestrictions: [],
});
const environment = (
  values: Partial<EnvironmentProfile> = {},
): EnvironmentProfile => ({
  usableObjects: [],
  spaces: [],
  backgroundStructures: [],
  lightTendencies: [],
  ...values,
});

test('图片校验拒绝非图片、空文件和超限文件', () => {
  assert.match(
    validateImageFile({ type: 'text/plain', size: 10 }) ?? '',
    /图片文件/,
  );
  assert.match(
    validateImageFile({ type: 'image/jpeg', size: 0 }) ?? '',
    /为空/,
  );
  assert.match(
    validateImageFile({ type: 'image/jpeg', size: 101 }, 100) ?? '',
    /不能超过/,
  );
  assert.equal(validateImageFile({ type: 'image/jpeg', size: 100 }, 100), null);
});

test('压缩尺寸参数保持比例且不放大小图', () => {
  assert.deepEqual(fitWithinMaxEdge({ width: 4000, height: 2000 }, 1600), {
    width: 1600,
    height: 800,
  });
  assert.deepEqual(fitWithinMaxEdge({ width: 600, height: 900 }, 1600), {
    width: 600,
    height: 900,
  });
  assert.throws(() => fitWithinMaxEdge({ width: 0, height: 10 }), /尺寸无效/);
});

test('视觉响应通过运行时结构校验并强制标记 vision 来源', () => {
  const parsed = parseVisionResponse({
    outfit: {
      clothingTypes: ['裙装'],
      styles: ['优雅'],
      footwearAccessories: [],
      movementRestrictions: ['不便跳跃'],
    },
    environment: {
      usableObjects: ['座椅'],
      spaces: [],
      backgroundStructures: [],
      lightTendencies: ['窗边'],
    },
    confidence: 0.87,
    summary: '窗边裙装人像',
    source: 'manual',
  });
  assert.equal(parsed?.source, 'vision');
  assert.equal(parsed?.confidence, 0.87);
});

test('视觉响应拒绝缺字段、错误数组和越界可信度', () => {
  assert.equal(parseVisionResponse({}), null);
  assert.equal(parseVisionResponse({ outfit: [], environment: {} }), null);
  const validShape = {
    outfit: {
      clothingTypes: [],
      styles: [],
      footwearAccessories: [],
      movementRestrictions: [],
    },
    environment: {
      usableObjects: [],
      spaces: [],
      backgroundStructures: [],
      lightTendencies: [],
    },
    summary: 'x',
  };
  assert.equal(parseVisionResponse({ ...validShape, confidence: 2 }), null);
});

test('endpoint 未配置时不发送图片并明确回退', async () => {
  const result = await requestVisionAnalysis(new Blob(), new Blob(), {
    endpoint: '',
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, 'not-configured');
    assert.match(result.message, /本地标签/);
  }
});

test('街头穿搭优先环境叙事姿势', () => {
  const ranked = personalizePosePlans(
    PLANS,
    'city-night',
    outfit(['街头']),
    environment({ spaces: ['街道'] }),
  );
  assert.match(ranked[0].name, /环境叙事/);
  assert.match(ranked[0].personalizationReason ?? '', /街头/);
});

test('座椅与开阔空间标签产生不同方向补充', () => {
  const seated = personalizePosePlans(
    PLANS,
    'indoor-soft',
    outfit(['休闲']),
    environment({ usableObjects: ['座椅'] }),
  );
  const open = personalizePosePlans(
    PLANS,
    'outdoor-side',
    outfit(['休闲']),
    environment({ spaces: ['开阔空间'] }),
  );
  assert.match(seated[0].direction, /侧坐椅边/);
  assert.match(open[0].direction, /缓慢走两步/);
  assert.notEqual(seated[0].id, open[0].id);
});

test('裙装或长外套写入动作避坑且收藏序列化不含图片数据', () => {
  const [plan] = personalizePosePlans(
    PLANS,
    'window-backlight',
    outfit(['优雅'], ['裙装']),
    environment({ lightTendencies: ['窗边'] }),
  );
  assert.match(plan.avoid, /避免大跨步|双手同时插袋/);
  const favorite = { id: 'f', createdAt: '', note: '', plan };
  const serialized = JSON.stringify(favorite);
  assert.doesNotMatch(serialized, /blob:|data:image|base64/i);
  assert.match(serialized, /personalizationReason/);
});
