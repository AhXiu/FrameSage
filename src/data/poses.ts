import cityNightImage1 from '@/assets/poses/city-night-1.jpg';
import cityNightImage2 from '@/assets/poses/city-night-2.jpg';
import cityNightImage3 from '@/assets/poses/city-night-3.jpg';
import indoorMixedImage1 from '@/assets/poses/indoor-mixed-1.jpg';
import indoorMixedImage2 from '@/assets/poses/indoor-mixed-2.jpg';
import indoorMixedImage3 from '@/assets/poses/indoor-mixed-3.jpg';
import indoorSoftImage1 from '@/assets/poses/indoor-soft-1.jpg';
import indoorSoftImage2 from '@/assets/poses/indoor-soft-2.jpg';
import indoorSoftImage3 from '@/assets/poses/indoor-soft-3.jpg';
import outdoorFrontImage1 from '@/assets/poses/outdoor-front-1.jpg';
import outdoorFrontImage2 from '@/assets/poses/outdoor-front-2.jpg';
import outdoorFrontImage3 from '@/assets/poses/outdoor-front-3.jpg';
import outdoorSideImage1 from '@/assets/poses/outdoor-side-1.jpg';
import outdoorSideImage2 from '@/assets/poses/outdoor-side-2.jpg';
import outdoorSideImage3 from '@/assets/poses/outdoor-side-3.jpg';
import shadeDappledImage1 from '@/assets/poses/shade-dappled-1.jpg';
import shadeDappledImage2 from '@/assets/poses/shade-dappled-2.jpg';
import shadeDappledImage3 from '@/assets/poses/shade-dappled-3.jpg';
import windowBacklightImage1 from '@/assets/poses/window-backlight-1.jpg';
import windowBacklightImage2 from '@/assets/poses/window-backlight-2.jpg';
import windowBacklightImage3 from '@/assets/poses/window-backlight-3.jpg';
import windowWarmNightImage1 from '@/assets/poses/window-warm-night-1.jpg';
import windowWarmNightImage2 from '@/assets/poses/window-warm-night-2.jpg';
import windowWarmNightImage3 from '@/assets/poses/window-warm-night-3.jpg';
import type { Composition, PosePlan, SceneId } from '@/types';

const sceneImages: Record<SceneId, readonly [string, string, string]> = {
  'indoor-soft': [indoorSoftImage1, indoorSoftImage2, indoorSoftImage3],
  'indoor-mixed': [indoorMixedImage1, indoorMixedImage2, indoorMixedImage3],
  'window-backlight': [
    windowBacklightImage1,
    windowBacklightImage2,
    windowBacklightImage3,
  ],
  'shade-dappled': [shadeDappledImage1, shadeDappledImage2, shadeDappledImage3],
  'outdoor-front': [outdoorFrontImage1, outdoorFrontImage2, outdoorFrontImage3],
  'outdoor-side': [outdoorSideImage1, outdoorSideImage2, outdoorSideImage3],
  'city-night': [cityNightImage1, cityNightImage2, cityNightImage3],
  'window-warm-night': [
    windowWarmNightImage1,
    windowWarmNightImage2,
    windowWarmNightImage3,
  ],
};

const sceneGuides: Record<
  SceneId,
  { place: string; light: string; avoid: string }
> = {
  'indoor-soft': {
    place: '离背景两步，身体转向窗光',
    light: '让脸轻轻迎向最亮处',
    avoid: '别贴墙站，避免顶灯在眼窝留下阴影',
  },
  'indoor-mixed': {
    place: '退到单一主光覆盖的位置',
    light: '关闭或避开头顶杂色灯',
    avoid: '脸上出现一半黄一半青时立即换位',
  },
  'window-backlight': {
    place: '站到窗前一臂，轮廓压住亮窗边缘',
    light: '下巴微抬接住反射光',
    avoid: '发丝高光过曝时向室内退半步',
  },
  'shade-dappled': {
    place: '寻找整片阴影而不是碎光中心',
    light: '让亮斑落在衣服而非面部',
    avoid: '鼻尖、额头有白斑时左右移动半步',
  },
  'outdoor-front': {
    place: '身体斜站，脸回到镜头',
    light: '闭眼放松，倒数时再睁眼',
    avoid: '正午强光下不要持续仰头眯眼',
  },
  'outdoor-side': {
    place: '鼻尖朝向光源约 20°',
    light: '让鼻影落在远侧脸颊内',
    avoid: '暗侧眼睛无眼神光时转回 10°',
  },
  'city-night': {
    place: '靠近路灯或招牌边缘一米',
    light: '背景灯点与头部错开',
    avoid: '不要边走边拍，先稳住再连拍',
  },
  'window-warm-night': {
    place: '与橱窗呈 30°，距离约半米',
    light: '用暖橱窗照亮近侧脸',
    avoid: '镜头正对玻璃会拍到自己和杂乱反射',
  },
};
const variants: {
  suffix: string;
  focal: number;
  composition: Composition;
  head: string;
  shoulders: string;
  hands: string;
  feet: string;
  gaze: string;
  framing: string;
}[] = [
  {
    suffix: '松弛半身',
    focal: 50,
    composition: '三分法',
    head: '下巴微收，头向亮侧倾 5°',
    shoulders: '一高一低，近镜头肩膀放松',
    hands: '一手轻触衣领，手指分开不握拳',
    feet: '重心放在后脚，前膝自然弯',
    gaze: '先看光源，再慢慢回看镜头',
    framing: '眼睛落上三分线，视线前方留空间',
  },
  {
    suffix: '环境叙事',
    focal: 35,
    composition: '框架',
    head: '脸保持侧面轮廓，下巴向前一点',
    shoulders: '身体侧转 45°，肩线带出方向',
    hands: '一手扶门框或栏杆，另一手自然下垂',
    feet: '前后脚错开，脚尖朝行进方向',
    gaze: '越过镜头看向远处',
    framing: '借门窗或树影做前景框架，人物占画面三分之一',
  },
  {
    suffix: '安静特写',
    focal: 85,
    composition: '居中',
    head: '额头轻向镜头，下巴微收',
    shoulders: '双肩下沉，只露少量肩线',
    hands: '手背轻托下颌，避免掌心正对镜头',
    feet: '保持稳定站姿即可',
    gaze: '近侧眼睛直视镜头，眼神放松',
    framing: '双眼位于上三分线，头顶保留一指空间',
  },
];

export const POSE_PLANS: PosePlan[] = (
  Object.keys(sceneGuides) as SceneId[]
).flatMap((scene, sceneIndex) =>
  variants.map((v, i) => {
    const g = sceneGuides[scene];
    return {
      id: `${scene}-${i + 1}`,
      name: `${v.suffix} · ${g.place.split('，')[0]}`,
      scene,
      focal: v.focal,
      composition: v.composition,
      head: v.head,
      shoulders: v.shoulders,
      hands: v.hands,
      feet: v.feet,
      gaze: v.gaze,
      direction: `${g.place}。摄影师话术：“很好，肩膀松下来，保持这个方向，眼睛慢慢回到我这里。”`,
      framing: `${v.framing}；${g.light}。`,
      avoid:
        g.avoid +
        (sceneIndex % 2
          ? '，并检查背景线条不要切过头顶。'
          : '，拍前检查手指和衣角是否完整。'),
      imageUrl: sceneImages[scene][i],
      imageAlt: `${v.suffix}人像姿势参考图`,
    };
  }),
);

export function rankPlans(
  scene: SceneId,
  focalLength: number,
  shallow: boolean,
): PosePlan[] {
  return POSE_PLANS.map(p => ({
    ...p,
    score:
      (p.scene === scene ? 100 : 0) +
      Math.max(0, 35 - Math.abs(p.focal - focalLength)) +
      (shallow && p.focal === 85 ? 12 : 0),
  }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);
}
