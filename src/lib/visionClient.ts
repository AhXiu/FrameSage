import type { PortraitContextAnalysis } from '@/types';

declare global {
  interface Window {
    __FRAMESAGE_CONFIG__?: { visionEndpoint?: string };
  }
}

export type VisionAnalysisResult =
  | { ok: true; analysis: PortraitContextAnalysis }
  | { ok: false; reason: 'not-configured' | 'request-failed'; message: string };

const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseVisionResponse(
  value: unknown,
): PortraitContextAnalysis | null {
  if (!record(value) || !record(value.outfit) || !record(value.environment))
    return null;
  const outfit = value.outfit;
  const environment = value.environment;
  if (
    !stringArray(outfit.clothingTypes) ||
    !stringArray(outfit.styles) ||
    !stringArray(outfit.footwearAccessories) ||
    !stringArray(outfit.movementRestrictions) ||
    !stringArray(environment.usableObjects) ||
    !stringArray(environment.spaces) ||
    !stringArray(environment.backgroundStructures) ||
    !stringArray(environment.lightTendencies) ||
    typeof value.confidence !== 'number' ||
    value.confidence < 0 ||
    value.confidence > 1 ||
    typeof value.summary !== 'string'
  )
    return null;
  return {
    outfit: {
      clothingTypes: outfit.clothingTypes,
      styles: outfit.styles,
      footwearAccessories: outfit.footwearAccessories,
      movementRestrictions: outfit.movementRestrictions,
    },
    environment: {
      usableObjects: environment.usableObjects,
      spaces: environment.spaces,
      backgroundStructures: environment.backgroundStructures,
      lightTendencies: environment.lightTendencies,
    },
    confidence: value.confidence,
    summary: value.summary,
    source: 'vision',
  };
}

export async function requestVisionAnalysis(
  environmentImage: Blob,
  modelImage: Blob,
  options: { endpoint?: string; timeoutMs?: number } = {},
): Promise<VisionAnalysisResult> {
  const endpoint =
    options.endpoint ??
    (typeof window === 'undefined'
      ? undefined
      : window.__FRAMESAGE_CONFIG__?.visionEndpoint);
  if (!endpoint)
    return {
      ok: false,
      reason: 'not-configured',
      message: '未配置视觉服务，已切换为本地标签辅助模式。',
    };
  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 12_000,
  );
  try {
    const body = new FormData();
    body.append('environment', environmentImage, 'environment.jpg');
    body.append('model', modelImage, 'model.jpg');
    const response = await fetch(endpoint, {
      method: 'POST',
      body,
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const analysis = parseVisionResponse(await response.json());
    if (!analysis) throw new Error('响应结构不符合契约');
    return { ok: true, analysis };
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === 'AbortError';
    return {
      ok: false,
      reason: 'request-failed',
      message: timedOut
        ? '视觉分析超时，已回退到本地标签辅助模式。'
        : '视觉分析失败，已回退到本地标签辅助模式。',
    };
  } finally {
    window.clearTimeout(timer);
  }
}
