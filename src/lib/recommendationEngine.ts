import type { CameraParams, Device, SceneResult, UserMode } from '@/types';

export function recommend(
  device: Device,
  scene: SceneResult,
  _mode: UserMode,
): CameraParams {
  const focal =
    Number.isFinite(device.focalLength) && device.focalLength > 0
      ? device.focalLength
      : 50;
  const maxAperture =
    Number.isFinite(device.maxAperture) && device.maxAperture >= 0.7
      ? device.maxAperture
      : 2.8;
  const night = scene.id === 'city-night' || scene.id === 'window-warm-night';
  const backlit = scene.id === 'window-backlight';
  const dappled = scene.id === 'shade-dappled';
  const side = scene.id === 'outdoor-side';
  const aperture = Math.max(maxAperture, night ? 1.8 : backlit ? 2 : 2.4);
  const safeDenominator = Math.max(80, Math.ceil(focal * (night ? 1.3 : 2)));
  const isoLimit = Math.max(
    100,
    Number.isFinite(device.isoLimit) ? device.isoLimit : 3200,
  );
  const targetIso = night
    ? 3200
    : backlit
      ? 400
      : scene.metrics.brightness > 70
        ? 100
        : 640;
  const iso = Math.min(isoLimit, targetIso);
  return {
    aperture: `f/${aperture.toFixed(aperture % 1 === 0 ? 0 : 1)}`,
    shutter: `1/${safeDenominator}s`,
    iso,
    whiteBalance:
      scene.id === 'window-warm-night'
        ? '3800K'
        : scene.metrics.warmth > 62
          ? '4300K'
          : '自动白平衡',
    exposure: backlit ? '+0.7 EV' : dappled ? '-0.3 EV' : '0 EV',
    metering: backlit ? '点测光 · 面部' : dappled ? '高光重点测光' : '评价测光',
    focus: aperture <= 2.4 ? '眼部 AF-C / 单点眼部' : '人脸 AF-C',
    action: backlit
      ? '对准靠近镜头的眼睛测光，再锁定曝光拍摄。'
      : night
        ? '贴稳身体连拍 2–3 张，先保证眼睛清晰。'
        : '先对焦近侧眼睛，再微调人物与背景距离。',
    principle: backlit
      ? '逆光下背景会误导测光，点测脸并正补偿可保住肤色。'
      : night
        ? '安全快门随焦段提高，ISO 受设备阈值约束，优先减少手抖。'
        : '以焦段对应安全快门为底线，大光圈分离人物和背景。',
    tradeoff: `使用 ${aperture.toFixed(1)} 光圈可获得浅景深，但前后眼不在同一焦平面时需更精确对焦。`,
    risk: side
      ? '侧光鼻影过长时，让人物朝光源转 10°。'
      : dappled
        ? '注意额头和鼻尖亮斑，必要时移动半步。'
        : night
          ? 'ISO 已按设备上限保护，画面仍暗时应靠近光源。'
          : '背景过近会削弱虚化，建议拉开 2 米以上。',
  };
}
