import type { CameraParams, Device, SceneResult, UserMode } from '@/types';

const SHUTTER_STOPS = [
  80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000,
  2500, 3200, 4000, 5000, 6400, 8000,
] as const;
const ISO_STOPS = [
  100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000,
  2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800,
] as const;
const SCENE_EV100: Record<SceneResult['id'], number> = {
  'indoor-soft': 8,
  'indoor-mixed': 7,
  'window-backlight': 10,
  'shade-dappled': 10.5,
  'outdoor-front': 13,
  'outdoor-side': 12,
  'city-night': 4,
  'window-warm-night': 5,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function nextShutterStop(denominator: number) {
  return (
    SHUTTER_STOPS.find(stop => stop >= denominator) ??
    Math.ceil(denominator / 100) * 100
  );
}

function nextIsoStop(requiredIso: number, isoLimit: number) {
  const matched = ISO_STOPS.find(
    stop => stop >= requiredIso && stop <= isoLimit,
  );
  if (matched) return matched;
  return Math.round(isoLimit);
}

/**
 * 倒数法则的工程化实现：焦段乘稳定余量，并向上取相机常用快门档位。
 * 1/80s 下限用于降低被摄者微动；stabilityFactor 属于产品策略。
 */
export function safeShutterDenominator(
  focalLength: number,
  stabilityFactor = 2,
): number {
  const focal =
    Number.isFinite(focalLength) && focalLength > 0 ? focalLength : 50;
  const factor =
    Number.isFinite(stabilityFactor) && stabilityFactor >= 1
      ? stabilityFactor
      : 1;
  return nextShutterStop(Math.max(80, focal * factor));
}

/**
 * 将相机画面统计量映射为工程估算 EV100。浏览器画面未经测光标定，
 * 因此以场景公认 EV 区间为基准，再用亮度统计做有限修正。
 */
export function mapMetricsToEV(scene: SceneResult): number {
  const brightness = Number.isFinite(scene.metrics.brightness)
    ? scene.metrics.brightness
    : 50;
  const adjustment = clamp((brightness - 50) / 20, -2.5, 2.5);
  return Math.round(clamp(SCENE_EV100[scene.id] + adjustment, 2, 15) * 10) / 10;
}

/** ISO 100 下的曝光值：EV100 = log2(N² / t)。 */
export function exposureValue(
  aperture: number,
  shutterSeconds: number,
): number {
  if (!(aperture > 0) || !(shutterSeconds > 0)) return Number.NaN;
  return Math.log2((aperture * aperture) / shutterSeconds);
}

export function calculateExposureCompensation(
  device: Device,
  scene: SceneResult,
): number {
  const backlit = scene.id === 'window-backlight';
  const dappled = scene.id === 'shade-dappled';
  let compensation = backlit ? 0.7 : dappled ? -0.3 : 0;

  // 18% 中性灰测光会把明显偏暗的主体拉向灰色；主体比边缘暗时补偿脸部。
  if (scene.metrics.centerEdge <= -20) compensation += 0.3;
  if (scene.metrics.highlights >= 75) compensation -= 0.3;

  // 高宽容度机身在强反差中优先保护高光，后期再恢复阴影。
  if (device.dynamicRange >= 14.5 && compensation > 0.3) {
    compensation -= 0.3;
  }
  return Math.round(clamp(compensation, -1, 1.3) * 10) / 10;
}

function targetAperture(device: Device, scene: SceneResult) {
  const lensMaximum =
    Number.isFinite(device.maxAperture) && device.maxAperture >= 0.7
      ? device.maxAperture
      : 2.8;
  const target =
    scene.id === 'city-night' || scene.id === 'window-warm-night'
      ? 1.8
      : scene.id === 'window-backlight'
        ? 2
        : scene.id === 'outdoor-front' || scene.id === 'shade-dappled'
          ? 2.8
          : 2.4;
  return Math.max(lensMaximum, target);
}

function focusRecommendation(device: Device, aperture: number) {
  const brand = device.brand.toLowerCase();
  if (brand.includes('sony')) return 'AF-C · 人眼实时追踪';
  if (brand.includes('canon')) return 'Servo AF · 人眼检测';
  if (brand.includes('nikon')) return 'AF-C · 人眼侦测';
  if (brand.includes('fujifilm')) return 'AF-C · 人脸/眼睛检测';
  return aperture <= 2.4 ? 'AF-C · 近侧眼睛' : '连续人脸 AF';
}

function whiteBalanceRecommendation(device: Device, scene: SceneResult) {
  let kelvin =
    scene.id === 'window-warm-night'
      ? 3800
      : scene.metrics.warmth > 70
        ? 4000
        : scene.metrics.warmth > 62
          ? 4300
          : 0;
  if (kelvin && /偏暖|暖调/.test(device.colorBias)) kelvin -= 200;
  if (kelvin && /偏冷/.test(device.colorBias)) kelvin += 200;
  return kelvin
    ? `${kelvin}K · ${device.colorBias}`
    : `自动白平衡 · ${device.colorBias}`;
}

function formatExposure(value: number) {
  if (Math.abs(value) < 0.05) return '0 EV';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)} EV`;
}

export function recommend(
  device: Device,
  scene: SceneResult,
  _mode: UserMode,
): CameraParams {
  const focal =
    Number.isFinite(device.focalLength) && device.focalLength > 0
      ? device.focalLength
      : 50;
  const aperture = targetAperture(device, scene);
  const night = scene.id === 'city-night' || scene.id === 'window-warm-night';
  const backlit = scene.id === 'window-backlight';
  const dappled = scene.id === 'shade-dappled';
  const side = scene.id === 'outdoor-side';
  const compensation = calculateExposureCompensation(device, scene);
  const sceneEV = mapMetricsToEV(scene);
  const targetEV = sceneEV - compensation;
  const safeDenominator = safeShutterDenominator(focal, night ? 1.3 : 2);

  // 若安全快门在 ISO 100 已过曝，就继续加快快门；否则保持安全快门并抬高 ISO。
  const iso100Denominator = 2 ** targetEV / aperture ** 2;
  const shutterDenominator = nextShutterStop(
    Math.max(safeDenominator, iso100Denominator),
  );
  const requiredIso =
    (100 * aperture ** 2 * shutterDenominator) / 2 ** targetEV;
  const isoLimit = Math.max(
    100,
    Number.isFinite(device.isoLimit) ? device.isoLimit : 3200,
  );
  const iso = nextIsoStop(Math.max(100, requiredIso), isoLimit);
  const underexposedStops = Math.max(0, Math.log2(requiredIso / iso));
  const apertureText = aperture.toFixed(aperture % 1 === 0 ? 0 : 1);
  const distanceRisk =
    Number.isFinite(device.minFocus) && device.minFocus > 0.5
      ? ` 该镜头最近对焦约 ${device.minFocus.toFixed(2)}m，避免贴脸拍摄。`
      : '';
  const exposureRisk =
    underexposedStops >= 0.5
      ? ` 当前设备 ISO 上限仍会欠曝约 ${underexposedStops.toFixed(1)} 档，请靠近光源或使用补光。`
      : '';

  return {
    aperture: `f/${apertureText}`,
    shutter: `1/${shutterDenominator}s`,
    iso,
    whiteBalance: whiteBalanceRecommendation(device, scene),
    exposure: formatExposure(compensation),
    metering:
      backlit || scene.metrics.centerEdge <= -15
        ? '点测光 · 面部'
        : dappled || scene.metrics.highlights >= 70
          ? '高光重点测光'
          : '评价测光 · 面部优先',
    focus: focusRecommendation(device, aperture),
    action: backlit
      ? '对准近侧眼睛测光，确认脸部亮度后锁定曝光。'
      : night
        ? '贴稳身体连拍 2–3 张，优先保证眼睛清晰。'
        : '先对焦近侧眼睛，再检查快门、ISO 与背景距离。',
    principle: `按场景估算 EV100 ${sceneEV.toFixed(1)}，以 f/${apertureText} 和 1/${shutterDenominator}s 联立曝光三角求得 ISO ${iso}；快门不低于焦段倒数法则的安全值。`,
    tradeoff: `优先守住 1/${safeDenominator}s 的手持人像安全快门，再在镜头最大光圈与机身 ISO ${isoLimit} 上限内平衡景深和噪点。`,
    risk:
      (side
        ? '侧光鼻影过长时，让人物朝光源转 10°。'
        : dappled
          ? '注意额头和鼻尖亮斑，必要时移动半步。'
          : night
            ? '暗光场景先保证快门，噪点优先于运动模糊。'
            : '背景过近会削弱虚化，建议拉开 2 米以上。') +
      distanceRisk +
      exposureRisk,
  };
}
