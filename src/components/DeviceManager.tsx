import { DEVICE_PRESETS } from '@/data/devices';
import type { Device } from '@/types';
import { Check, ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

const empty = (): Device => ({
  id: crypto.randomUUID(),
  brand: '',
  model: '',
  isoLimit: 3200,
  dynamicRange: 13,
  colorBias: '中性',
  focalLength: 50,
  maxAperture: 1.8,
  bokehFactor: 1,
  minFocus: 0.4,
  notes: '',
});
export function DeviceManager({
  devices,
  current,
  onSave,
  onDelete,
  onSelect,
  forced = false,
}: {
  devices: Device[];
  current: Device;
  onSave: (d: Device) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  forced?: boolean;
}) {
  const [editing, setEditing] = useState<Device | null>(
    forced && devices.length === 0 ? empty() : null,
  );
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const choosePreset = (index: number) =>
    setEditing({
      id: editing?.id ?? crypto.randomUUID(),
      ...DEVICE_PRESETS[index],
    });
  const submit = () => {
    if (!editing?.brand.trim() || !editing.model.trim()) {
      setMessage('请填写品牌和型号');
      return;
    }
    onSave({
      ...editing,
      isoLimit: Math.max(100, editing.isoLimit || 3200),
      focalLength: Math.max(1, editing.focalLength || 50),
      maxAperture: Math.max(0.7, editing.maxAperture || 2.8),
    });
    setEditing(null);
    setMessage('设备已保存');
  };
  return (
    <section className="device-panel">
      <button
        className="device-current"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="device-dot" />
        <span>
          <small>当前设备</small>
          <strong>
            {devices.length
              ? `${current.brand} · ${current.model}`
              : '尚未添加设备'}
          </strong>
        </span>
        <ChevronDown size={18} />
      </button>
      {open && devices.length > 0 && (
        <div className="device-list">
          {devices.map(d => (
            <div
              className={
                d.id === current.id ? 'device-row active' : 'device-row'
              }
              key={d.id}
            >
              <button
                onClick={() => {
                  onSelect(d.id);
                  setOpen(false);
                }}
              >
                <Check size={15} />
                {d.brand} {d.model}
              </button>
              <button aria-label="编辑设备" onClick={() => setEditing(d)}>
                <Pencil size={15} />
              </button>
              <button
                aria-label="删除设备"
                onClick={() => {
                  if (devices.length <= 1) setMessage('至少保留一台设备');
                  else onDelete(d.id);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button className="text-action" onClick={() => setEditing(empty())}>
        <Plus size={16} /> 添加相机与镜头
      </button>
      {message && <p className="inline-message">{message}</p>}
      {editing && (
        <div className="modal-backdrop">
          <dialog open className="modal-card" aria-label="设备编辑">
            <div className="modal-head">
              <div>
                <span className="eyebrow">MY KIT</span>
                <h2>{devices.length ? '编辑拍摄设备' : '先添加你的设备'}</h2>
              </div>
              {!forced && (
                <button onClick={() => setEditing(null)} aria-label="关闭">
                  <X />
                </button>
              )}
            </div>
            <p className="muted">
              选择常用预设，或完整手动录入。参数只保存在本机。
            </p>
            <div className="preset-grid">
              {DEVICE_PRESETS.map((p, i) => (
                <button key={p.model} onClick={() => choosePreset(i)}>
                  <strong>{p.brand}</strong>
                  <span>{p.model}</span>
                </button>
              ))}
            </div>
            <div className="form-grid">
              <label>
                品牌
                <input
                  value={editing.brand}
                  onChange={e =>
                    setEditing({ ...editing, brand: e.target.value })
                  }
                />
              </label>
              <label>
                型号 / 镜头
                <input
                  value={editing.model}
                  onChange={e =>
                    setEditing({ ...editing, model: e.target.value })
                  }
                />
              </label>
              <Num
                label="高感 ISO 阈值"
                value={editing.isoLimit}
                set={v => setEditing({ ...editing, isoLimit: v })}
              />
              <Num
                label="动态范围（档）"
                value={editing.dynamicRange}
                set={v => setEditing({ ...editing, dynamicRange: v })}
              />
              <label>
                色彩倾向
                <input
                  value={editing.colorBias}
                  onChange={e =>
                    setEditing({ ...editing, colorBias: e.target.value })
                  }
                />
              </label>
              <Num
                label="焦段（mm）"
                value={editing.focalLength}
                set={v => setEditing({ ...editing, focalLength: v })}
              />
              <Num
                label="最大光圈"
                value={editing.maxAperture}
                step="0.1"
                set={v => setEditing({ ...editing, maxAperture: v })}
              />
              <Num
                label="虚化系数"
                value={editing.bokehFactor}
                step="0.1"
                set={v => setEditing({ ...editing, bokehFactor: v })}
              />
              <Num
                label="最近对焦距离（m）"
                value={editing.minFocus}
                step="0.01"
                set={v => setEditing({ ...editing, minFocus: v })}
              />
              <label>
                备注
                <input
                  value={editing.notes}
                  onChange={e =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                />
              </label>
            </div>
            {message && <p className="inline-message">{message}</p>}
            <button className="primary wide" onClick={submit}>
              保存并使用
            </button>
          </dialog>
        </div>
      )}
    </section>
  );
}
function Num({
  label,
  value,
  set,
  step = '1',
}: { label: string; value: number; set: (v: number) => void; step?: string }) {
  return (
    <label>
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => set(Number(e.target.value))}
      />
    </label>
  );
}
