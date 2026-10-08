import type { SceneId, SceneMetrics } from '@/types';

export const SCENE_INFO: Record<
  SceneId,
  { name: string; direction: string; explanation: string }
> = {
  'indoor-soft': {
    name: '室内柔光',
    direction: '漫射柔光',
    explanation: '光线像一层薄纱，脸部明暗过渡柔和，很适合自然人像。',
  },
  'indoor-mixed': {
    name: '室内混合光',
    direction: '多方向混合',
    explanation: '室内灯与环境光颜色不同，先避开顶灯，再让脸朝向较亮的一侧。',
  },
  'window-backlight': {
    name: '窗边逆光',
    direction: '人物背后',
    explanation: '背景明显比脸亮，是好看的轮廓光；需要给脸补一点曝光。',
  },
  'shade-dappled': {
    name: '户外树荫光斑',
    direction: '顶部散落',
    explanation: '树叶漏下的亮斑反差大，移动半步，别让碎光落在眼睛和鼻尖。',
  },
  'outdoor-front': {
    name: '户外顺光',
    direction: '正面均匀',
    explanation: '人物迎光，肤色干净、曝光稳定；注意别让眼睛因强光眯起。',
  },
  'outdoor-side': {
    name: '户外侧光',
    direction: '侧前方',
    explanation: '一侧亮、一侧暗，面部更立体；让鼻影朝向脸颊外侧。',
  },
  'city-night': {
    name: '城市夜景暗光',
    direction: '点状环境光',
    explanation: '整体很暗但有零散灯点，稳住相机并优先保护人物清晰。',
  },
  'window-warm-night': {
    name: '街景橱窗暖光夜景',
    direction: '侧前方橱窗',
    explanation: '暖色橱窗可当大型柔光箱，靠近玻璃借光，同时避开反射。',
  },
};

export const SIM_PRESETS: { label: string; metrics: SceneMetrics }[] = [
  {
    label: '窗边逆光',
    metrics: {
      brightness: 55,
      warmth: 48,
      centerEdge: -28,
      highlights: 72,
      contrast: 70,
      clutter: 38,
    },
  },
  {
    label: '室内柔光',
    metrics: {
      brightness: 58,
      warmth: 54,
      centerEdge: 4,
      highlights: 18,
      contrast: 28,
      clutter: 24,
    },
  },
  {
    label: '城市夜景',
    metrics: {
      brightness: 15,
      warmth: 42,
      centerEdge: 8,
      highlights: 38,
      contrast: 82,
      clutter: 61,
    },
  },
];
