import { SIM_PRESETS } from '@/data/scenes';
import { useCamera } from '@/hooks/useCamera';
import { classifyScene } from '@/lib/sceneEngine';
import type { SceneMetrics, SceneResult } from '@/types';
import {
  Camera,
  CircleHelp,
  ScanLine,
  SlidersHorizontal,
  Square,
} from 'lucide-react';
import { useState } from 'react';

export function Scanner({
  scene,
  onResult,
}: { scene: SceneResult; onResult: (s: SceneResult) => void }) {
  const camera = useCamera(onResult);
  const [manual, setManual] = useState(false);
  const [metrics, setMetrics] = useState<SceneMetrics>(SIM_PRESETS[0].metrics);
  const [simBusy, setSimBusy] = useState(false);
  const simulate = async () => {
    setSimBusy(true);
    await new Promise(r => setTimeout(r, 950));
    onResult(classifyScene(metrics));
    setSimBusy(false);
  };
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
        <div className="error-note">
          <CircleHelp size={18} />
          <span>{camera.error}</span>
        </div>
      )}
      <div className="scan-actions">
        {!camera.active ? (
          <button className="primary" onClick={camera.start}>
            <Camera size={19} /> 开启后置相机
          </button>
        ) : (
          <>
            <button
              className="primary"
              disabled={camera.scanning}
              onClick={camera.scan}
            >
              <ScanLine size={19} />
              {camera.scanning ? '正在读取光线…' : '扫描当前场景'}
            </button>
            <button
              className="icon-action"
              onClick={camera.stop}
              aria-label="关闭相机"
            >
              <Square size={17} />
            </button>
          </>
        )}
        <button className="secondary" onClick={() => setManual(!manual)}>
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
              <button key={p.label} onClick={() => setMetrics(p.metrics)}>
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
                onChange={e =>
                  setMetrics({ ...metrics, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <button
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
          <span>识别场景</span>
          <strong>{scene.name}</strong>
        </div>
        <div>
          <small>亮度</small>
          <b>{scene.brightnessLabel}</b>
        </div>
        <div>
          <small>光向</small>
          <b>{scene.direction}</b>
        </div>
        <div>
          <small>色温</small>
          <b>{scene.temperature}</b>
        </div>
        <div>
          <small>背景</small>
          <b>{scene.clutter}</b>
        </div>
        <p>{scene.explanation}</p>
      </section>
    </>
  );
}
