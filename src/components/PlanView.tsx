import type { CameraParams, PosePlan, SceneResult, UserMode } from '@/types';
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

export function PlanView({
  scene,
  params,
  plans,
  active,
  setActive,
  mode,
  onFavorite,
}: {
  scene: SceneResult;
  params: CameraParams;
  plans: PosePlan[];
  active: number;
  setActive: (n: number) => void;
  mode: UserMode;
  onFavorite: () => void;
}) {
  const plan = plans[active] ?? plans[0];
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
        <button className="save-button" onClick={onFavorite}>
          <Bookmark size={18} /> 收藏
        </button>
      </header>
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
              <b>原理</b>
              {params.principle}
            </p>
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
      <section className="pose-card">
        <div className="pose-visual">
          <CompositionOverlay type={plan.composition} />
          <span>{plan.focal}mm</span>
          <div className="pose-silhouette">
            <i />
            <b />
          </div>
          <small>{plan.composition}</small>
        </div>
        <div className="pose-content">
          <div className="pose-nav">
            <button
              onClick={() => setActive((active + 2) % 3)}
              aria-label="上一套"
            >
              <ChevronLeft />
            </button>
            <span>{active + 1} / 3 · 最匹配方案</span>
            <button
              onClick={() => setActive((active + 1) % 3)}
              aria-label="下一套"
            >
              <ChevronRight />
            </button>
          </div>
          <h2>{plan.name}</h2>
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
