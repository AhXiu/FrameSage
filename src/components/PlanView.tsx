import {
  type TrialProblem,
  buildShootingChecklist,
  getCorrectionAdvice,
} from '@/lib/shootingCoach';
import type {
  CameraParams,
  Device,
  PosePlan,
  SceneResult,
  ShootingContext,
  UserMode,
} from '@/types';
import {
  Aperture,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Focus,
  Gauge,
  Lightbulb,
  Move,
  ShieldAlert,
  Timer,
} from 'lucide-react';
import { useState } from 'react';
import { PersonalizedPoseWorkspace } from './PersonalizedPoseWorkspace';

export function PlanView({
  scene,
  params,
  plans,
  active,
  setActive,
  personalized,
  onApplyPersonalized,
  onRestorePlans,
  mode,
  device,
  context,
  onContextChange,
  isFavorited,
  onFavorite,
}: {
  scene: SceneResult;
  params: CameraParams;
  plans: PosePlan[];
  active: number;
  setActive: (n: number) => void;
  personalized: boolean;
  onApplyPersonalized: (plans: PosePlan[]) => void;
  onRestorePlans: () => void;
  mode: UserMode;
  device: Device;
  context: ShootingContext;
  onContextChange: (context: ShootingContext) => void;
  isFavorited: boolean;
  onFavorite: () => void;
}) {
  const plan = plans[active] ?? plans[0];
  const [problem, setProblem] = useState<TrialProblem | null>(null);
  if (!plan) return null;
  const checklist = buildShootingChecklist(scene, params, plan, context);
  const advice = problem
    ? getCorrectionAdvice(problem, device, scene, params)
    : null;
  return (
    <div className="plan-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">COMPLETE SET · {scene.name}</span>
          <h1>这一组，可以开拍了</h1>
          <p>
            {mode === 'beginner'
              ? '照着参数设置，再用一句话引导人物。'
              : '参数、权衡、姿态与风险已按当前设备联动。'}
          </p>
        </div>
        <button
          className={`save-button${isFavorited ? ' active' : ''}`}
          onClick={onFavorite}
          aria-pressed={isFavorited}
          aria-label={isFavorited ? '取消收藏当前方案' : '收藏当前方案'}
        >
          <Bookmark size={18} fill={isFavorited ? 'currentColor' : 'none'} />
          {isFavorited ? '已收藏' : '收藏'}
        </button>
      </header>
      <section className="context-card" aria-label="拍摄意图">
        <div>
          <span className="eyebrow">SHOOTING INTENT</span>
          <h2>现场状态</h2>
        </div>
        <ChoiceRow
          label="人物"
          value={context.motion}
          options={[
            ['still', '静止'],
            ['walking', '自然走动'],
            ['fast', '快速动作'],
          ]}
          onChange={motion => onContextChange({ ...context, motion })}
        />
        <ChoiceRow
          label="持机"
          value={context.holding}
          options={[
            ['steady', '稳定手持'],
            ['normal', '普通手持'],
            ['shaky', '容易手抖'],
            ['tripod', '三脚架'],
          ]}
          onChange={holding => onContextChange({ ...context, holding })}
        />
        <ChoiceRow
          label="人数"
          value={context.groupSize}
          options={[
            ['single', '单人'],
            ['couple', '双人'],
            ['group', '多人'],
          ]}
          onChange={groupSize => onContextChange({ ...context, groupSize })}
        />
      </section>
      <section className="checklist-card">
        <div className="section-title">
          <div>
            <span className="eyebrow">3-STEP FIELD GUIDE</span>
            <h2>三步开拍</h2>
          </div>
        </div>
        <ol>
          {checklist.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
      <section className="parameter-card">
        <div className="section-title">
          <div>
            <span className="eyebrow">CAMERA SETTINGS</span>
            <h2>推荐参数</h2>
          </div>
          <span className="rule-chip">规则生成</span>
        </div>
        <div className="parameter-grid">
          <Param icon={<Aperture />} label="光圈" value={params.aperture} />
          <Param icon={<Timer />} label="快门" value={params.shutter} />
          <Param icon={<Gauge />} label="ISO" value={String(params.iso)} />
          <Param
            icon={<Lightbulb />}
            label="白平衡"
            value={params.whiteBalance}
          />
          <Param icon={<Move />} label="曝光补偿" value={params.exposure} />
          <Param icon={<Eye />} label="测光" value={params.metering} />
          <Param icon={<Focus />} label="对焦" value={params.focus} />
        </div>
        <div className="action-callout">
          <Check />
          <div>
            <small>现在这样做</small>
            <strong>{params.action}</strong>
          </div>
        </div>
        {mode === 'expert' && (
          <div className="expert-grid">
            <p>
              <b>取舍</b>
              {params.tradeoff}
            </p>
            <p>
              <b>风险</b>
              {params.risk}
            </p>
          </div>
        )}
      </section>
      <section className="correction-card">
        <button
          type="button"
          className="correction-toggle"
          onClick={() => setProblem(problem ? null : 'face-dark')}
          aria-expanded={Boolean(problem)}
        >
          试拍不理想？
        </button>
        {problem && (
          <div className="correction-panel">
            <div className="problem-options" aria-label="选择试拍问题">
              {(
                [
                  ['face-dark', '脸太暗'],
                  ['motion-blur', '人物糊'],
                  ['noise', '噪点高'],
                  ['background-clipped', '背景过曝'],
                  ['skin-color', '肤色偏色'],
                ] as [TrialProblem, string][]
              ).map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setProblem(id)}
                  aria-pressed={problem === id}
                >
                  {label}
                </button>
              ))}
            </div>
            {advice && (
              <div className="advice">
                <strong>{advice.title} · 按顺序调整</strong>
                <ol>
                  {advice.steps.map(step => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <small>基于当前设置的规则建议，不会读取或分析你的照片。</small>
              </div>
            )}
          </div>
        )}
      </section>
      <PersonalizedPoseWorkspace
        scene={scene.id}
        applied={personalized}
        onApply={onApplyPersonalized}
        onRestore={onRestorePlans}
      />
      <section className="pose-card">
        <div className="pose-visual">
          <div className="pose-silhouette" aria-hidden="true">
            <i />
            <b />
          </div>
          {plan.imageUrl && (
            <img
              className="pose-photo"
              src={plan.imageUrl}
              alt={plan.imageAlt ?? plan.name}
              loading="lazy"
              decoding="async"
              onError={event => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
          <CompositionOverlay type={plan.composition} />
          <span>{plan.focal}mm</span>
          <small>{plan.composition}</small>
        </div>
        <div className="pose-content">
          <div className="pose-nav">
            <button
              onClick={() =>
                setActive((active + plans.length - 1) % plans.length)
              }
              aria-label="上一套"
            >
              <ChevronLeft />
            </button>
            <span>
              {active + 1} / {plans.length} ·{' '}
              {personalized ? '个性化排序' : '最匹配方案'}
            </span>
            <button
              onClick={() => setActive((active + 1) % plans.length)}
              aria-label="下一套"
            >
              <ChevronRight />
            </button>
          </div>
          <h2>{plan.name}</h2>
          {plan.personalizationReason && (
            <p className="recommendation-reason">
              <b>为什么推荐</b>
              {plan.personalizationReason}
            </p>
          )}
          <p className="director">{plan.direction}</p>
          <div className="pose-points">
            <span>
              <b>头</b>
              {plan.head}
            </span>
            <span>
              <b>肩</b>
              {plan.shoulders}
            </span>
            <span>
              <b>手</b>
              {plan.hands}
            </span>
            <span>
              <b>脚</b>
              {plan.feet}
            </span>
            <span>
              <b>视线</b>
              {plan.gaze}
            </span>
          </div>
          <div className="framing">
            <b>构图</b>
            {plan.framing}
          </div>
        </div>
      </section>
      <section className="warning-card">
        <ShieldAlert />
        <div>
          <span>智能避坑提醒</span>
          <strong>{plan.avoid}</strong>
          <p>{params.risk}</p>
        </div>
      </section>
    </div>
  );
}
function Param({
  icon,
  label,
  value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="param">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
export function CompositionOverlay({ type }: { type: string }) {
  return (
    <div
      className={`composition-lines ${type === '居中' ? 'center' : type === '框架' ? 'frame' : ''}`}
    >
      <i />
      <i />
      <b />
      <b />
    </div>
  );
}

function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="choice-row">
      <span>{label}</span>
      <div>
        {options.map(([id, text]) => (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={value === id}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
