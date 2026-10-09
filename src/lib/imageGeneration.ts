import type {
  EnvironmentProfile,
  ImageGenerationConfig,
  OutfitProfile,
  PosePlan,
} from '@/types';

export const DEFAULT_IMAGE_GENERATION_CONFIG: ImageGenerationConfig = {
  provider: 'ark',
  displayName: '火山方舟 Seedream',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
  model: 'doubao-seedream-4-0-250828',
  transport: 'direct',
  proxyUrl: '',
};

export const PROVIDER_DEFAULTS: Record<
  ImageGenerationConfig['provider'],
  Pick<ImageGenerationConfig, 'displayName' | 'baseUrl' | 'model'>
> = {
  ark: {
    displayName: '火山方舟 Seedream',
    baseUrl: DEFAULT_IMAGE_GENERATION_CONFIG.baseUrl,
    model: DEFAULT_IMAGE_GENERATION_CONFIG.model,
  },
  openai: {
    displayName: 'OpenAI Images',
    baseUrl: 'https://api.openai.com/v1/images/generations',
    model: 'gpt-image-1',
  },
  custom: { displayName: '自定义 OpenAI-compatible', baseUrl: '', model: '' },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSafeImageUrl(value: string): boolean {
  if (isHttpsUrl(value)) return true;
  return /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/]+=*$/i.test(value);
}

export function normalizeImageGenerationConfig(
  value: Partial<ImageGenerationConfig> | null | undefined,
): ImageGenerationConfig {
  const provider = ['ark', 'openai', 'custom'].includes(value?.provider ?? '')
    ? (value?.provider as ImageGenerationConfig['provider'])
    : 'ark';
  const defaults = PROVIDER_DEFAULTS[provider];
  const transport = value?.transport === 'proxy' ? 'proxy' : 'direct';
  return {
    provider,
    displayName: value?.displayName?.trim() || defaults.displayName,
    baseUrl: value?.baseUrl?.trim() || defaults.baseUrl,
    model: value?.model?.trim() || defaults.model,
    transport,
    proxyUrl: value?.proxyUrl?.trim() || '',
  };
}

export function validateImageGenerationConfig(
  config: ImageGenerationConfig,
  appKey = '',
): string[] {
  const errors: string[] = [];
  if (!config.displayName.trim()) errors.push('请填写服务显示名称。');
  if (!config.model.trim()) errors.push('请填写控制台开通的 Model ID。');
  if (!isHttpsUrl(config.baseUrl))
    errors.push('Base URL 必须是有效的 HTTPS 地址。');
  if (config.transport === 'proxy') {
    if (!isHttpsUrl(config.proxyUrl))
      errors.push('代理地址必须是有效的 HTTPS 地址。');
  } else if (!appKey.trim()) {
    errors.push('直连模式需要在当前标签页填写 AppKey。');
  }
  return errors;
}

export function supportsReferenceImages(
  provider: ImageGenerationConfig['provider'],
): boolean {
  return provider === 'ark';
}

export interface GenerationRequest {
  url: string;
  init: RequestInit;
  usesReferenceImages: boolean;
}

export function buildImageGenerationRequest(
  config: ImageGenerationConfig,
  appKey: string,
  prompt: string,
  referenceImages: string[] = [],
): GenerationRequest {
  const errors = validateImageGenerationConfig(config, appKey);
  if (errors.length) throw new Error(errors[0]);
  const usesReferenceImages = supportsReferenceImages(config.provider);
  const body: Record<string, unknown> = {
    model: config.model,
    prompt,
    size: '1024x1024',
  };
  if (config.provider !== 'openai') body.response_format = 'url';
  if (usesReferenceImages && referenceImages.length)
    body.image = referenceImages;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (config.transport === 'direct') headers.Authorization = `Bearer ${appKey}`;
  return {
    url: config.transport === 'proxy' ? config.proxyUrl : config.baseUrl,
    init: { method: 'POST', headers, body: JSON.stringify(body) },
    usesReferenceImages,
  };
}

export function parseImageGenerationResponse(value: unknown): string | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    !isRecord(value.data[0])
  )
    return null;
  const item = value.data[0];
  if (typeof item.url === 'string' && isSafeImageUrl(item.url)) return item.url;
  if (typeof item.b64_json === 'string') {
    const dataUrl = `data:image/png;base64,${item.b64_json}`;
    return isSafeImageUrl(dataUrl) ? dataUrl : null;
  }
  return null;
}

const join = (items: string[], fallback: string) =>
  items.length ? items.join('、') : fallback;

export function buildPosePreviewPrompt(
  plan: PosePlan,
  outfit: OutfitProfile,
  environment: EnvironmentProfile,
): string {
  return [
    '生成一张自然、写实、摄影质感的人像姿势预览图。上传图片仅作为环境、人物外观与穿搭参考，不是照片编辑结果。',
    `穿搭风格：${join(outfit.styles, '保持参考图可见穿搭')}；服装：${join(outfit.clothingTypes, '保持参考图可见服装')}。`,
    `环境：${join(
      [
        ...environment.usableObjects,
        ...environment.spaces,
        ...environment.backgroundStructures,
        ...environment.lightTendencies,
      ],
      '保持参考环境的空间与光线',
    )}。`,
    `姿势方向：${plan.direction} 头部${plan.head}，肩部${plan.shoulders}，双手${plan.hands}，双脚${plan.feet}，视线${plan.gaze}。`,
    `构图：${plan.composition}，${plan.framing}；使用约 ${plan.focal}mm 镜头视角，全身比例自然，真实皮肤与自然光影。`,
    `避坑：${plan.avoid}；避免肢体畸形、额外手指、悬空接触、关节裁切、过度磨皮、塑料质感、文字和水印。`,
  ].join('\n');
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('图片编码失败。'));
    reader.onerror = () => reject(new Error('图片编码失败。'));
    reader.readAsDataURL(blob);
  });

export type ImageGenerationResult =
  | { ok: true; imageUrl: string; usedReferenceImages: boolean }
  | {
      ok: false;
      reason: 'invalid-config' | 'cancelled' | 'failed';
      message: string;
    };

export async function generatePosePreview(
  config: ImageGenerationConfig,
  appKey: string,
  prompt: string,
  images: Blob[],
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ImageGenerationResult> {
  const errors = validateImageGenerationConfig(config, appKey);
  if (errors.length)
    return { ok: false, reason: 'invalid-config', message: errors[0] };
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(cancel, options.timeoutMs ?? 60_000);
  try {
    const references = supportsReferenceImages(config.provider)
      ? await Promise.all(images.map(blobToDataUrl))
      : [];
    const request = buildImageGenerationRequest(
      config,
      appKey,
      prompt,
      references,
    );
    const response = await fetch(request.url, {
      ...request.init,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('HTTP error');
    const imageUrl = parseImageGenerationResponse(await response.json());
    if (!imageUrl) throw new Error('Invalid response');
    return {
      ok: true,
      imageUrl,
      usedReferenceImages: request.usesReferenceImages && references.length > 0,
    };
  } catch (error) {
    const cancelled = controller.signal.aborted;
    return {
      ok: false,
      reason: cancelled ? 'cancelled' : 'failed',
      message: cancelled
        ? options.signal?.aborted
          ? '已取消生成，可随时重试。'
          : '图片生成超时，请重试。'
        : '图片生成失败，请检查服务配置、网络与 CORS 后重试。',
    };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}
