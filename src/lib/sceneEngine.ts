import { SCENE_INFO } from '@/data/scenes';
import type { SceneId, SceneMetrics, SceneResult } from '@/types';

const label = (v: number, low: string, mid: string, high: string) =>
  v < 33 ? low : v < 67 ? mid : high;
export function classifyScene(m: SceneMetrics): SceneResult {
  let id: SceneId;
  if (m.brightness < 28)
    id = m.warmth > 58 ? 'window-warm-night' : 'city-night';
  else if (m.centerEdge < -16 && m.highlights > 48) id = 'window-backlight';
  else if (m.highlights > 58 && m.contrast > 58) id = 'shade-dappled';
  else if (m.brightness > 72 && Math.abs(m.centerEdge) < 13 && m.contrast < 52)
    id = 'outdoor-front';
  else if (
    m.brightness > 57 &&
    (Math.abs(m.centerEdge) > 13 || m.contrast > 50)
  )
    id = 'outdoor-side';
  else if (m.warmth > 60 || m.contrast > 48) id = 'indoor-mixed';
  else id = 'indoor-soft';
  const info = SCENE_INFO[id];
  return {
    id,
    ...info,
    brightnessLabel: label(m.brightness, '偏暗', '适中', '明亮'),
    temperature: label(m.warmth, '偏冷', '中性', '偏暖'),
    clutter: label(m.clutter, '干净', '适中', '较杂乱'),
    metrics: m,
  };
}

export function analyzePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): SceneMetrics {
  let sum = 0;
  let warm = 0;
  let sq = 0;
  let highlights = 0;
  let center = 0;
  let edge = 0;
  let cn = 0;
  let en = 0;
  for (let i = 0; i < data.length; i += 16) {
    const p = i / 4;
    const x = p % width;
    const y = Math.floor(p / width);
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sum += l;
    sq += l * l;
    warm += r - b;
    if (l > 215) highlights++;
    const isCenter =
      x > width * 0.25 &&
      x < width * 0.75 &&
      y > height * 0.25 &&
      y < height * 0.75;
    if (isCenter) {
      center += l;
      cn++;
    } else {
      edge += l;
      en++;
    }
  }
  const n = data.length / 16;
  const mean = sum / n;
  const variance = Math.max(0, sq / n - mean * mean);
  return {
    brightness: Math.round(mean / 2.55),
    warmth: Math.max(0, Math.min(100, Math.round(50 + warm / n / 2))),
    centerEdge: Math.round(
      ((center / Math.max(1, cn) - edge / Math.max(1, en)) / 2.55) * 100,
    ),
    highlights: Math.round((highlights / n) * 100),
    contrast: Math.min(100, Math.round(Math.sqrt(variance) / 1.1)),
    clutter: Math.min(100, Math.round(Math.sqrt(variance) * 1.35)),
  };
}
