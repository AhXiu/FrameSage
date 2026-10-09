import { SCENE_INFO } from '@/data/scenes';
import type {
  SceneAssessment,
  SceneId,
  SceneMetrics,
  SceneResult,
} from '@/types';

const SCENE_IDS = Object.keys(SCENE_INFO) as SceneId[];
const label = (v: number, low: string, mid: string, high: string) =>
  v < 33 ? low : v < 67 ? mid : high;
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

function classifyId(m: SceneMetrics): SceneId {
  if (m.brightness < 28)
    return m.warmth > 58 ? 'window-warm-night' : 'city-night';
  if (m.centerEdge < -16 && m.highlights > 48) return 'window-backlight';
  if (m.highlights > 58 && m.contrast > 58) return 'shade-dappled';
  if (m.brightness > 72 && Math.abs(m.centerEdge) < 13 && m.contrast < 52)
    return 'outdoor-front';
  if (m.brightness > 57 && (Math.abs(m.centerEdge) > 13 || m.contrast > 50))
    return 'outdoor-side';
  if (m.warmth > 60 || m.contrast > 48) return 'indoor-mixed';
  return 'indoor-soft';
}

function resultFor(id: SceneId, m: SceneMetrics): SceneResult {
  return {
    id,
    ...SCENE_INFO[id],
    brightnessLabel: label(m.brightness, '偏暗', '适中', '明亮'),
    temperature: label(m.warmth, '偏冷', '中性', '偏暖'),
    clutter: label(m.clutter, '干净', '适中', '较杂乱'),
    metrics: m,
  };
}

// 每个场景的典型画面统计中心，仅用于衡量“像不像”及寻找次选，不替代原分类规则。
const PROTOTYPES: Record<SceneId, [number, number, number, number, number]> = {
  'indoor-soft': [52, 50, 3, 18, 27],
  'indoor-mixed': [48, 68, 5, 35, 58],
  'window-backlight': [55, 50, -30, 70, 68],
  'shade-dappled': [62, 52, 4, 72, 75],
  'outdoor-front': [82, 50, 2, 35, 30],
  'outdoor-side': [70, 52, 24, 42, 60],
  'city-night': [14, 40, 3, 30, 76],
  'window-warm-night': [18, 72, 2, 35, 65],
};

function similarity(m: SceneMetrics, id: SceneId) {
  const values = [
    m.brightness,
    m.warmth,
    m.centerEdge,
    m.highlights,
    m.contrast,
  ];
  const target = PROTOTYPES[id];
  const scales = [35, 35, 40, 45, 45];
  const distance = Math.sqrt(
    values.reduce((sum, value, index) => {
      const normalized = (value - target[index]) / scales[index];
      return sum + normalized * normalized;
    }, 0) / values.length,
  );
  return clamp(1 - distance / 1.35);
}

/** 返回带可信度、次选和现场风险的可测试场景评估。 */
export function evaluateScene(m: SceneMetrics): SceneAssessment {
  const id = classifyId(m);
  const ranked = SCENE_IDS.filter(sceneId => sceneId !== id)
    .map(sceneId => ({ id: sceneId, score: similarity(m, sceneId) }))
    .sort((a, b) => b.score - a.score);
  const primaryScore = similarity(m, id);
  const alternative = ranked[0];
  const margin = primaryScore - alternative.score;
  const nearBoundary =
    Math.abs(m.brightness - 28) <= 4 ||
    Math.abs(m.centerEdge + 16) <= 4 ||
    Math.abs(m.highlights - 48) <= 4 ||
    Math.abs(m.highlights - 58) <= 4 ||
    Math.abs(m.contrast - 58) <= 4 ||
    Math.abs(m.brightness - 72) <= 4 ||
    Math.abs(m.warmth - 60) <= 4;
  const rawConfidence = clamp(
    0.48 + primaryScore * 0.36 + margin * 0.45,
    0.25,
    0.96,
  );
  const confidence =
    Math.round(
      (nearBoundary ? Math.min(0.59, rawConfidence) : rawConfidence) * 100,
    ) / 100;
  const risks: string[] = [];
  if (confidence < 0.62)
    risks.push('场景特征接近边界，建议重新取景或手动确认。');
  if (m.highlights > 72) risks.push('高光区域较多，注意背景或肤色过曝。');
  if (m.brightness < 24)
    risks.push('环境很暗，试拍后重点检查人物清晰度与噪点。');
  if (m.clutter > 68)
    risks.push('背景较杂乱，建议换角度或拉开人物与背景距离。');
  return {
    primary: resultFor(id, m),
    confidence,
    alternative: { id: alternative.id, name: SCENE_INFO[alternative.id].name },
    risks,
    manuallyConfirmed: false,
  };
}

/** 用户纠正场景后保留原画面统计，供参数引擎立即重算。 */
export function confirmScene(m: SceneMetrics, id: SceneId): SceneAssessment {
  const alternatives = SCENE_IDS.filter(sceneId => sceneId !== id)
    .map(sceneId => ({ id: sceneId, score: similarity(m, sceneId) }))
    .sort((a, b) => b.score - a.score);
  return {
    primary: resultFor(id, m),
    confidence: 1,
    alternative: {
      id: alternatives[0].id,
      name: SCENE_INFO[alternatives[0].id].name,
    },
    risks: evaluateScene(m).risks.filter(
      risk => !risk.includes('场景特征接近边界'),
    ),
    manuallyConfirmed: true,
  };
}

/** 兼容旧调用：只返回主场景。 */
export function classifyScene(m: SceneMetrics): SceneResult {
  return evaluateScene(m).primary;
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
  const n = Math.max(1, data.length / 16);
  const mean = sum / n;
  const variance = Math.max(0, sq / n - mean * mean);
  return {
    brightness: Math.round(mean / 2.55),
    warmth: clamp(Math.round(50 + warm / n / 2), 0, 100),
    centerEdge: Math.round(
      ((center / Math.max(1, cn) - edge / Math.max(1, en)) / 2.55) * 100,
    ),
    highlights: Math.round((highlights / n) * 100),
    contrast: Math.min(100, Math.round(Math.sqrt(variance) / 1.1)),
    clutter: Math.min(100, Math.round(Math.sqrt(variance) * 1.35)),
  };
}
