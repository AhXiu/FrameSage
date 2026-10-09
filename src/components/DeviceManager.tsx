import { CAMERA_BRANDS } from '@/data/deviceCatalog';
import { DEVICE_PRESETS } from '@/data/devices';
import {
  autofillCatalogSelection,
  bodiesForBrand,
  compatibleLenses,
  matchCatalogDevice,
} from '@/lib/deviceCatalog';
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
  const match = editing ? matchCatalogDevice(editing) : {};
  const [brandChoice, setBrandChoice] = useState(match.brand ?? '');
  const [bodyChoice, setBodyChoice] = useState(match.body?.id ?? '');
  const [lensChoice, setLensChoice] = useState(match.lens?.id ?? '');

  const beginEdit = (device: Device) => {
    const found = matchCatalogDevice(device);
    setEditing(device);
    setBrandChoice(found.brand ?? '');
    setBodyChoice(found.body?.id ?? '');
    setLensChoice(found.lens?.id ?? '');
    setMessage('');
  };
  const choosePreset = (index: number) =>
    beginEdit({
      id: editing?.id ?? crypto.randomUUID(),
      ...DEVICE_PRESETS[index],
    });
  const chooseBrand = (brand: string) => {
    setBrandChoice(brand);
    setBodyChoice('');
    setLensChoice('');
  };
  const chooseBody = (bodyId: string) => {
    setBodyChoice(bodyId);
    setLensChoice('');
  };
  const chooseLens = (lensId: string) => {
    setLensChoice(lensId);
    if (editing && bodyChoice && lensId) {
      setEditing(autofillCatalogSelection(editing, bodyChoice, lensId));
      setMessage('已自动填充目录参数，可继续手工修改');
    }
  };
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
              <button aria-label="编辑设备" onClick={() => beginEdit(d)}>
                <Pencil size={15} />
              </button>
              <button
                aria-label="删除设备"
                onClick={() =>
                  devices.length <= 1
                    ? setMessage('至少保留一台设备')
                    : onDelete(d.id)
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button className="text-action" onClick={() => beginEdit(empty())}>
        <Plus size={16} /> 添加相机与镜头
      </button>
      {message && !editing && <p className="inline-message">{message}</p>}
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
              可选择内置目录自动填充，也可使用原有预设或完整手动录入。所有参数都能修改并仅保存在本机。
            </p>
            <div className="catalog-selects" aria-label="相机镜头目录">
              <label>
                品牌
                <select
                  value={brandChoice}
                  onChange={e => chooseBrand(e.target.value)}
                >
                  <option value="">手动输入 / 未知品牌</option>
                  {CAMERA_BRANDS.map(brand => (
                    <option key={brand}>{brand}</option>
                  ))}
                </select>
              </label>
              <label>
                机身
                <select
                  value={bodyChoice}
                  disabled={!brandChoice}
                  onChange={e => chooseBody(e.target.value)}
                >
                  <option value="">选择机身</option>
                  {bodiesForBrand(brandChoice).map(body => (
                    <option value={body.id} key={body.id}>
                      {body.model}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                兼容镜头
                <select
                  value={lensChoice}
                  disabled={!bodyChoice}
                  onChange={e => chooseLens(e.target.value)}
                >
                  <option value="">选择兼容镜头</option>
                  {compatibleLenses(bodyChoice).map(lens => (
                    <option value={lens.id} key={lens.id}>
                      {lens.model}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="catalog-note">
              高感 ISO 阈值为 FrameSage
              推荐值，并非厂商官方规格；请按实际画质偏好调整。
            </p>
            <details className="legacy-presets">
              <summary>使用原有快捷预设</summary>
              <div className="preset-grid">
                {DEVICE_PRESETS.map((p, i) => (
                  <button key={p.model} onClick={() => choosePreset(i)}>
                    <strong>{p.brand}</strong>
                    <span>{p.model}</span>
                  </button>
                ))}
              </div>
            </details>
            <div className="form-grid">
              <Text
                label="品牌"
                value={editing.brand}
                set={v => setEditing({ ...editing, brand: v })}
              />
              <Text
                label="型号 / 镜头"
                value={editing.model}
                set={v => setEditing({ ...editing, model: v })}
              />
              <Num
                label="高感 ISO 推荐阈值"
                value={editing.isoLimit}
                set={v => setEditing({ ...editing, isoLimit: v })}
              />
              <Num
                label="动态范围（档）"
                value={editing.dynamicRange}
                step="0.1"
                set={v => setEditing({ ...editing, dynamicRange: v })}
              />
              <Text
                label="色彩倾向"
                value={editing.colorBias}
                set={v => setEditing({ ...editing, colorBias: v })}
              />
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
                step="0.01"
                set={v => setEditing({ ...editing, bokehFactor: v })}
              />
              <Num
                label="最近对焦距离（m）"
                value={editing.minFocus}
                step="0.01"
                set={v => setEditing({ ...editing, minFocus: v })}
              />
              <Text
                label="说明"
                value={editing.notes}
                set={v => setEditing({ ...editing, notes: v })}
              />
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

function Text({
  label,
  value,
  set,
}: { label: string; value: string; set: (v: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={e => set(e.target.value)} />
    </label>
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
