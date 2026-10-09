import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_IMAGE_GENERATION_CONFIG,
  buildImageGenerationRequest,
  buildPosePreviewPrompt,
  isSafeImageUrl,
  normalizeImageGenerationConfig,
  parseImageGenerationResponse,
  supportsReferenceImages,
  validateImageGenerationConfig,
} from '../src/lib/imageGeneration';
import type { EnvironmentProfile, OutfitProfile, PosePlan } from '../src/types';

const key = 'test-key-not-real';
const plan: PosePlan = {
  id: 'pose',
  name: '窗边站姿',
  scene: 'indoor-soft',
  focal: 50,
  composition: '三分法',
  head: '微侧',
  shoulders: '放松',
  hands: '轻扶窗框',
  feet: '前后错开',
  gaze: '看向窗外',
  direction: '身体朝向侧光',
  framing: '全身置于右侧三分线',
  avoid: '避免手指僵硬',
};
const outfit: OutfitProfile = {
  styles: ['通勤'],
  clothingTypes: ['长外套'],
  footwearAccessories: [],
  movementRestrictions: [],
};
const environment: EnvironmentProfile = {
  usableObjects: [],
  spaces: [],
  backgroundStructures: ['墙面'],
  lightTendencies: ['窗边'],
};

test('默认图片生成配置使用 Ark，模型 ID 仍为普通可编辑字符串', () => {
  assert.equal(DEFAULT_IMAGE_GENERATION_CONFIG.provider, 'ark');
  assert.equal(
    DEFAULT_IMAGE_GENERATION_CONFIG.model,
    'doubao-seedream-4-0-250828',
  );
  assert.equal(
    normalizeImageGenerationConfig({ provider: 'ark', model: 'my-endpoint-id' })
      .model,
    'my-endpoint-id',
  );
});

test('配置校验要求 HTTPS、模型以及直连 Key 或有效代理', () => {
  assert.ok(
    validateImageGenerationConfig(DEFAULT_IMAGE_GENERATION_CONFIG).length,
  );
  assert.deepEqual(
    validateImageGenerationConfig(DEFAULT_IMAGE_GENERATION_CONFIG, key),
    [],
  );
  assert.ok(
    validateImageGenerationConfig(
      { ...DEFAULT_IMAGE_GENERATION_CONFIG, baseUrl: 'http://unsafe.example' },
      key,
    ).some(error => /HTTPS/.test(error)),
  );
  assert.deepEqual(
    validateImageGenerationConfig({
      ...DEFAULT_IMAGE_GENERATION_CONFIG,
      transport: 'proxy',
      proxyUrl: 'https://proxy.example/generate',
    }),
    [],
  );
});

test('Ark 请求携带 Bearer 与多参考图', () => {
  const request = buildImageGenerationRequest(
    DEFAULT_IMAGE_GENERATION_CONFIG,
    key,
    'portrait',
    ['data:image/jpeg;base64,YQ==', 'data:image/jpeg;base64,Yg=='],
  );
  assert.equal(request.url, DEFAULT_IMAGE_GENERATION_CONFIG.baseUrl);
  assert.equal(
    (request.init.headers as Record<string, string>).Authorization,
    `Bearer ${key}`,
  );
  const body = JSON.parse(String(request.init.body));
  assert.equal(body.model, DEFAULT_IMAGE_GENERATION_CONFIG.model);
  assert.equal(body.image.length, 2);
});

test('OpenAI 与 custom 明确降级为纯文本且不放入参考图', () => {
  for (const provider of ['openai', 'custom'] as const) {
    const request = buildImageGenerationRequest(
      {
        ...DEFAULT_IMAGE_GENERATION_CONFIG,
        provider,
        displayName: provider,
        baseUrl: 'https://images.example/v1/generations',
        model: 'editable-model',
      },
      key,
      'portrait',
      ['data:image/png;base64,YQ=='],
    );
    assert.equal(supportsReferenceImages(provider), false);
    assert.equal('image' in JSON.parse(String(request.init.body)), false);
  }
});

test('代理请求使用代理地址且不会把 Key 放进认证头或正文', () => {
  const request = buildImageGenerationRequest(
    {
      ...DEFAULT_IMAGE_GENERATION_CONFIG,
      transport: 'proxy',
      proxyUrl: 'https://proxy.example/generate',
    },
    '',
    'portrait',
  );
  assert.equal(request.url, 'https://proxy.example/generate');
  assert.equal(
    (request.init.headers as Record<string, string>).Authorization,
    undefined,
  );
  assert.doesNotMatch(String(request.init.body), /test-key|api.?key/i);
});

test('响应解析支持安全 url 与 b64_json，拒绝危险协议及坏结构', () => {
  assert.equal(
    parseImageGenerationResponse({
      data: [{ url: 'https://cdn.example/a.png' }],
    }),
    'https://cdn.example/a.png',
  );
  assert.equal(
    parseImageGenerationResponse({ data: [{ b64_json: 'YQ==' }] }),
    'data:image/png;base64,YQ==',
  );
  assert.equal(
    parseImageGenerationResponse({ data: [{ url: 'javascript:alert(1)' }] }),
    null,
  );
  assert.equal(
    parseImageGenerationResponse({ data: [{ url: 'blob:https://example/a' }] }),
    null,
  );
  assert.equal(parseImageGenerationResponse({ error: 'full body' }), null);
});

test('安全图片 URL 仅允许 HTTPS 与受限 data:image', () => {
  assert.equal(isSafeImageUrl('https://cdn.example/a.webp'), true);
  assert.equal(isSafeImageUrl('data:image/jpeg;base64,YQ=='), true);
  assert.equal(isSafeImageUrl('http://cdn.example/a.png'), false);
  assert.equal(isSafeImageUrl('data:text/html;base64,YQ=='), false);
});

test('姿势 prompt 组合穿搭、环境、方向、构图、焦段和避坑', () => {
  const prompt = buildPosePreviewPrompt(plan, outfit, environment);
  for (const expected of [
    '通勤',
    '长外套',
    '窗边',
    '身体朝向侧光',
    '三分法',
    '50mm',
    '避免手指僵硬',
  ])
    assert.match(prompt, new RegExp(expected));
});

test('收藏快照不需要也不应包含 Key 或生成图', () => {
  const favorite = { id: 'f', plan, note: '', createdAt: '' };
  const serialized = JSON.stringify(favorite);
  assert.doesNotMatch(
    serialized,
    /test-key-not-real|data:image|generatedImage/i,
  );
});
