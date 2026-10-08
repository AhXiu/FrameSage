export interface RuleBasisItem {
  title: string;
  standard: string;
  description: string;
}

export const RULE_ENGINE_BASIS: RuleBasisItem[] = [
  {
    title: '曝光换算基础',
    standard: '曝光三角 · EV · ISO 2720',
    description:
      '光圈、快门与 ISO 按曝光三角协同取舍；测光解释参考 EV 曝光值体系与 18% 中性灰模型。',
  },
  {
    title: '手持安全快门',
    standard: '倒数法则 Reciprocal Rule',
    description: '安全快门不慢于焦段倒数，并按人像动作和稳定性增加保守余量。',
  },
  {
    title: '人像曝光实操',
    standard: '优先保证人脸曝光',
    description:
      '测光模式、曝光补偿和眼部对焦采用职业人像摄影中广泛使用的现场方法。',
  },
  {
    title: '冲突取舍策略',
    standard: 'FrameSage 工程策略',
    description:
      '手持外景人像默认优先保障快门，再平衡 ISO、光圈与背景；这不是强制摄影公理。',
  },
];

export const RULE_ENGINE_BOUNDARY =
  'FrameSage 根据本地画面指标生成可执行建议，但不是经校准的独立测光表。复杂光线下请结合相机直方图与现场试拍复核；后续版本将支持自定义取舍权重。';
