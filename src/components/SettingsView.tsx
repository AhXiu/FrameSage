import type { Device, UserMode } from '@/types';
import { RotateCcw, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { DeviceManager } from './DeviceManager';

export function SettingsView({
  mode,
  setMode,
  devices,
  current,
  onSave,
  onDelete,
  onSelect,
  onClear,
}: {
  mode: UserMode;
  setMode: (m: UserMode) => void;
  devices: Device[];
  current: Device;
  onSave: (d: Device) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="settings-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">PERSONAL DARKROOM</span>
          <h1>设置</h1>
          <p>让建议适合你的器材与拍摄习惯。</p>
        </div>
      </header>
      <section className="setting-card">
        <div className="setting-icon">
          <Sparkles />
        </div>
        <div className="setting-main">
          <h2>指导模式</h2>
          <p>新手只看结论；发烧友会同时看到原理、取舍与风险。</p>
          <div className="segment">
            <button
              className={mode === 'beginner' ? 'active' : ''}
              onClick={() => setMode('beginner')}
            >
              新手模式
            </button>
            <button
              className={mode === 'expert' ? 'active' : ''}
              onClick={() => setMode('expert')}
            >
              发烧友模式
            </button>
          </div>
        </div>
      </section>
      <section className="setting-card block">
        <div className="setting-heading">
          <Wrench />
          <div>
            <h2>我的设备</h2>
            <p>管理机身和镜头，推荐会按焦段与高感上限联动。</p>
          </div>
        </div>
        <DeviceManager
          devices={devices}
          current={current}
          onSave={onSave}
          onDelete={onDelete}
          onSelect={onSelect}
        />
      </section>
      <section className="setting-card">
        <div className="setting-icon">
          <ShieldCheck />
        </div>
        <div className="setting-main">
          <h2>隐私说明</h2>
          <p>
            摄像头画面只在浏览器内取一帧，并通过 Canvas
            计算统计指标。照片不会上传、不会保存；设备与收藏仅存在本机
            localStorage。
          </p>
        </div>
      </section>
      <section className="setting-card danger">
        <div className="setting-icon">
          <RotateCcw />
        </div>
        <div className="setting-main">
          <h2>清空本地数据</h2>
          <p>删除设备、收藏和偏好，操作不可撤销。</p>
          <button
            onClick={() => {
              if (window.confirm('确定清空 FrameSage 的全部本地数据？'))
                onClear();
            }}
          >
            清空全部数据
          </button>
        </div>
      </section>
    </div>
  );
}
