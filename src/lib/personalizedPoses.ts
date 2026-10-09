import type {
  EnvironmentProfile,
  OutfitProfile,
  PosePlan,
  SceneId,
} from '@/types';

const has = (values: string[], value: string) => values.includes(value);
const append = (base: string, extra: string) => `${base} ${extra}`.trim();

export function personalizePosePlans(
  plans: readonly PosePlan[],
  scene: SceneId,
  outfit: OutfitProfile,
  environment: EnvironmentProfile,
  limit = 3,
): PosePlan[] {
  const reasons: string[] = [];
  if (has(outfit.styles, '街头')) reasons.push('街头风格适合带入更多环境叙事');
  if (has(environment.usableObjects, '座椅'))
    reasons.push('现场座椅可形成稳定的坐姿层次');
  if (
    has(environment.usableObjects, '栏杆') ||
    has(environment.backgroundStructures, '墙面')
  )
    reasons.push('可借栏杆或墙面提供身体支撑');
  if (has(environment.spaces, '开阔空间'))
    reasons.push('开阔空间适合行走与引导线');
  if (has(environment.lightTendencies, '窗边'))
    reasons.push('窗边光可强化人物轮廓');
  if (reasons.length === 0) reasons.push('按当前场景与已选标签综合匹配');

  return plans
    .map(plan => {
      const narrative =
        /环境叙事/.test(plan.name) || plan.composition === '框架';
      const quiet = /安静特写|松弛/.test(plan.name);
      let score = plan.scene === scene ? 100 : 0;
      if (has(outfit.styles, '街头') && narrative) score += 35;
      if ((has(outfit.styles, '优雅') || has(outfit.styles, '清新')) && quiet)
        score += 18;
      if (has(outfit.styles, '通勤') && (quiet || plan.focal === 50))
        score += 16;
      if (has(outfit.styles, '复古') && plan.focal === 85) score += 16;
      if (has(outfit.styles, '休闲') && /松弛|环境叙事/.test(plan.name))
        score += 14;
      if (has(outfit.clothingTypes, '运动装') && narrative) score += 18;
      if (
        has(environment.usableObjects, '座椅') &&
        (narrative || plan.composition === '框架')
      )
        score += 30;
      if (
        (has(environment.usableObjects, '栏杆') ||
          has(environment.backgroundStructures, '墙面')) &&
        narrative
      )
        score += 26;
      if (has(environment.spaces, '开阔空间') && narrative) score += 28;
      if (has(environment.spaces, '街道') && narrative) score += 22;
      if (
        has(environment.backgroundStructures, '树木') &&
        plan.composition === '框架'
      )
        score += 20;
      if (
        has(environment.lightTendencies, '窗边') &&
        plan.scene.includes('window')
      )
        score += 24;

      const restricted =
        has(outfit.clothingTypes, '裙装') ||
        has(outfit.clothingTypes, '长外套');
      const directionExtras: string[] = [];
      const avoidExtras: string[] = [];
      if (has(environment.usableObjects, '座椅'))
        directionExtras.push('可先侧坐椅边，膝盖同向并保持背部舒展。');
      if (has(environment.usableObjects, '栏杆'))
        directionExtras.push('让一只手轻搭栏杆，身体不要把重量全部压上去。');
      if (has(environment.backgroundStructures, '墙面'))
        directionExtras.push('肩背离墙一拳，单侧轻靠形成自然支点。');
      if (has(environment.spaces, '开阔空间'))
        directionExtras.push('沿背景线缓慢走两步，在重心交换时连拍。');
      if (restricted) {
        score += quiet ? 12 : -10;
        avoidExtras.push('裙装或长外套避免大跨步，也不要双手同时插袋。');
      }
      for (const restriction of outfit.movementRestrictions)
        avoidExtras.push(`动作限制：${restriction}。`);
      return {
        ...plan,
        score,
        personalizationReason: reasons.slice(0, 2).join('；'),
        direction: append(plan.direction, directionExtras.join('')),
        avoid: append(plan.avoid, avoidExtras.join('')),
      };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, Math.min(5, Math.max(3, limit)));
}
