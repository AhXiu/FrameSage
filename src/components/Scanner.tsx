import { SCENE_INFO, SIM_PRESETS } from '@/data/scenes';
import { useCamera } from '@/hooks/useCamera';
import { confirmScene, evaluateScene } from '@/lib/sceneEngine';
import type { SceneAssessment, SceneId, SceneMetrics } from '@/types';
import {
  Camera,
  CircleHelp,
  ScanLine,
  SlidersHorizontal,
  Square,
} from 'lucide-react';
import { useState } from 'react';

const SCENE_IDS = Object.keys(SCENE_INFO) as SceneId[];

export function Scanner({
  assessment,
  onResult,
}: {
  assessment: SceneAssessment;
  onResult: (s: SceneAssessment) => void;
}) {
  const scene = assessment.primary;
  const camera = useCamera(onResult);
  const [manual, setManual] = useState(false);
  const [metrics, setMetrics] = useState<SceneMetrics>(SIM_PRESETS[0].metrics);
  const [simBusy, setSimBusy] = useState(false);
  const simulate = async () => {
    setSimBusy(true);
    await new Promise(resolve => setTimeout(resolve, 950));
    onResult(evaluateScene(metrics));
    setSimBusy(false);
  };
  const correct = (id: SceneId) => onResult(confirmScene(scene.metrics, id));

  return (
    <>
      <div className="viewfinder">
        <video
          ref={camera.videoRef}
          muted
          playsInline
          aria-label="摄像头实时取景"
        />
        <div className="camera-art">
          <div className="sun-orb" />
          <div className="subject-shape" />
        </div>
        <div className="focus-corners">
          <i />
          <i />
          <i />
          <i />
        </div>
        <span className="privacy-pill">
          <Square size={10} fill="currentColor" /> 本地取帧 · 不上传
        </span>
        <div className="finder-copy">
          <span className="eyebrow">FRAME SAGE / PORTRAIT</span>
          <h1>
            读懂光，
            <br />
            再按下快门。
          </h1>
          <p>实时分析亮度、色温与光向，生成更适合你设备的人像方案。</p>
        </div>
      </div>
      {camera.error && (
        <div className="error-note" role="alert">
          <CircleHelp size={18} />
          <span>{camera.error}</span>
          <button type="button" onClick={camera.start}>
            重试
          </button>
        </div>
      )}
      <div className="scan-actions">
        {!camera.active ? (
          <button type="button" className="primary" onClick={camera.start}>
            <Camera size={19} /> 开启后置相机
          </button>
        ) : (
          <>
            <button
              type="button"
              className="primary"
              disabled={camera.scanning}
              onClick={camera.scan}
            >
              <ScanLine size={19} />
              {camera.scanning ? '正在读取光线…' : '扫描当前场景'}
            </button>
            <button
              type="button"
              className="icon-action"
              onClick={camera.stop}
              aria-label="关闭相机"
            >
              <Square size={17} />
            </button>
          </>
        )}
        <button
          type="button"
          className="secondary"
          onClick={() => setManual(!manual)}
          aria-pressed={manual}
        >
          <SlidersHorizontal size={18} /> 手动模拟
        </button>
      </div>
      {(camera.scanning || simBusy) && (
        <div className="scan-progress">
          <span />
          <p>本地规则正在分析亮度、色温与明暗分布…</p>
        </div>
      )}
      {manual && (
        <section className="manual-card">
          <div className="section-title">
            <div>
              <span className="eyebrow">DEMO FALLBACK</span>
              <h2>手动模拟环境</h2>
            </div>
            <span className="rule-chip">确定性规则</span>
          </div>
          <div className="preset-line">
            {SIM_PRESETS.map(p => (
              <button
                type="button"
                key={p.label}
                onClick={() => setMetrics(p.metrics)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {(
            [
              'brightness',
              'warmth',
              'centerEdge',
              'highlights',
              'contrast',
              'clutter',
            ] as const
          ).map(key => (
            <label className="range-row" key={key}>
              <span>
                {
                  {
                    brightness: '环境亮度',
                    warmth: '色温偏暖',
                    centerEdge: '中心亮度差',
                    highlights: '局部亮斑',
                    contrast: '画面对比度',
                    clutter: '背景杂乱度',
                  }[key]
                }{' '}
                <b>{metrics[key]}</b>
              </span>
              <input
                type="range"
                min={key === 'centerEdge' ? -50 : 0}
                max="100"
                value={metrics[key]}
                onChange={event =>
                  setMetrics({ ...metrics, [key]: Number(event.target.value) })
                }
              />
            </label>
          ))}
          <button
            type="button"
            className="primary wide"
            onClick={simulate}
            disabled={simBusy}
          >
            {simBusy ? '扫描中…' : '模拟扫描'}
          </button>
        </section>
      )}
      <section className="analysis-strip">
        <div className="scene-mark">
          <span>
            {assessment.manuallyConfirmed ? '已手动确认' : '识别场景'}
          </span>
          <strong>{scene.name}</strong>
        </div>
        <div>
          <small>可信度</small>
          <b>{Math.round(assessment.confidence * 100)}%</b>
        </div>
        <div>
          <small>次选</small>
          <b>{assessment.alternative.name}</b>
        </div>
        <div>
          <small>光向</small>
          <b>{scene.direction}</b>
        </div>
        <div>
          <small>色温</small>
          <b>{scene.temperature}</b>
        </div>
        <p>{scene.explanation}</p>
        {!assessment.manuallyConfirmed && assessment.confidence < 0.62 && (
          <output className="confidence-warning">
            识别不够确定，请重新取景或在下方手动确认。
          </output>
        )}
        {assessment.risks.map(risk => (
          <p className="scene-risk" key={risk}>
            {risk}
          </p>
        ))}
        <div className="scene-correction" aria-label="手动纠正场景">
          <small>场景不对？点选后立即重算方案</small>
          <div>
            {SCENE_IDS.map(id => (
              <button
                type="button"
                key={id}
                onClick={() => correct(id)}
                aria-pressed={scene.id === id}
              >
                {SCENE_INFO[id].name}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
