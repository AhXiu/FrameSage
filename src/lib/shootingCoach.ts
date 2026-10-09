import type {
  CameraParams,
  Device,
  PosePlan,
  SceneResult,
  ShootingContext,
} from '@/types';

export type TrialProblem =
  | 'face-dark'
  | 'motion-blur'
  | 'noise'
  | 'background-clipped'
  | 'skin-color';

export interface CorrectionAdvice {
  problem: TrialProblem;
  title: string;
  steps: string[];
}

const shutterNumber = (params: CameraParams) =>
  Number(params.shutter.match(/1\/(\d+)/)?.[1] ?? 125);

/** 基于当前参数、场景和设备边界给出动作明确的试拍纠偏，不分析照片。 */
export function getCorrectionAdvice(
  problem: TrialProblem,
  device: Device,
  scene: SceneResult,
  params: CameraParams,
): CorrectionAdvice {
  const shutter = shutterNumber(params);
  const isoLimit = Math.max(100, device.isoLimit || 3200);
  const advice: Record<TrialProblem, CorrectionAdvice> = {
    'face-dark': {
      problem,
      title: '脸太暗',
      steps: [
        scene.id === 'window-backlight'
          ? '让人物向窗边转 15°，或向亮处靠近半步。'
          : '让脸朝向主光源，避开顶光和帽檐阴影。',
        '曝光补偿增加 +0.3 EV，保持面部点测光。',
        params.iso < isoLimit
          ? `仍偏暗时把 ISO 提高一档，但不要超过 ${isoLimit}。`
          : 'ISO 已到设备上限，使用反光板/补光，不再降低人物安全快门。',
      ],
    },
    'motion-blur': {
      problem,
      title: '人物糊',
      steps: [
        `把快门从 1/${shutter}s 提高到至少 1/${Math.max(320, shutter * 2)}s。`,
        params.iso < isoLimit
          ? `同步提高 ISO 补回亮度，上限 ${isoLimit}。`
          : 'ISO 已到上限：靠近光源或开大光圈，别用更慢快门补亮。',
        '开启连续人眼对焦并短连拍 2–3 张。',
      ],
    },
    noise: {
      problem,
      title: '噪点高',
      steps: [
        '先把人物移近窗户、橱窗或其他大面积光源。',
        '人物静止时稳定持机并把快门降低一档，再把 ISO 降低一档。',
        '不要欠曝后强行提亮；确认脸部直方图不过度靠左。',
      ],
    },
    'background-clipped': {
      problem,
      title: '背景过曝',
      steps: [
        '曝光补偿降低 -0.3 至 -0.7 EV，并开启高光警告。',
        scene.id === 'window-backlight'
          ? '换到与窗户约 45° 的角度，减少窗外亮面占比。'
          : '移动机位，避开最亮天空或直射灯进入背景。',
        '脸变暗时给人物补光，不要再整体抬高曝光。',
      ],
    },
    'skin-color': {
      problem,
      title: '肤色偏色',
      steps: [
        scene.id === 'indoor-mixed'
          ? '先关闭一种颜色明显不同的室内灯，统一光源。'
          : '让人物避开彩色墙面或招牌反光。',
        `关闭自动漂移，先按当前建议 ${params.whiteBalance} 固定白平衡。`,
        '拍一张白纸/灰卡复核；偏黄降 300K，偏蓝升 300K。',
      ],
    },
  };
  return advice[problem];
}

/** 三步现场执行清单：每一步都可在取景器旁直接完成。 */
export function buildShootingChecklist(
  scene: SceneResult,
  params: CameraParams,
  pose: PosePlan,
  context?: ShootingContext,
): [string, string, string] {
  const groupHint =
    context?.groupSize === 'group'
      ? '多人肩膀错开、脸尽量在同一焦平面'
      : context?.groupSize === 'couple'
        ? '两人眼睛保持接近同一焦平面'
        : pose.direction;
  const position =
    scene.id === 'window-backlight'
      ? `站位：人物离窗约 1 米，摄影者避开直射；${groupHint}`
      : scene.id === 'shade-dappled'
        ? `站位：移动半步避开脸上光斑；${groupHint}`
        : `站位：按“${pose.framing}”取景；${groupHint}`;
  const setting = `设置：${params.aperture} · ${params.shutter} · ISO ${params.iso}，${params.focus}`;
  const check = `拍摄检查：放大近侧眼睛确认清晰，再看肤色与背景高光；${pose.avoid}`;
  return [position, setting, check];
}
