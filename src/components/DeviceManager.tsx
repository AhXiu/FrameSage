import {
  CAMERA_BODIES,
  CAMERA_BRANDS,
  CAMERA_LENSES,
} from '@/data/deviceCatalog';
import { DEVICE_PRESETS } from '@/data/devices';
import {
  autofillCatalogBody,
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
  const initialEditing = forced && devices.length === 0 ? empty() : null;
  const initialMatch = initialEditing ? matchCatalogDevice(initialEditing) : {};
  const [editing, setEditing] = useState<Device | null>(initialEditing);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [brandChoice, setBrandChoice] = useState(initialMatch.brand ?? '');
  const [brandQuery, setBrandQuery] = useState(initialMatch.brand ?? '');
  const [bodyChoice, setBodyChoice] = useState(initialMatch.body?.id ?? '');
  const [bodyQuery, setBodyQuery] = useState(initialMatch.body?.model ?? '');
  const [lensChoice, setLensChoice] = useState(initialMatch.lens?.id ?? '');
  const [lensQuery, setLensQuery] = useState(initialMatch.lens?.model ?? '');
  const [customBody, setCustomBody] = useState(false);
  const [customLens, setCustomLens] = useState(false);

  const beginEdit = (device: Device) => {
    const found = matchCatalogDevice(device);
    setEditing(device);
    setBrandChoice(found.brand ?? '');
    setBrandQuery(found.brand ?? device.brand);
    setBodyChoice(found.body?.id ?? '');
    setBodyQuery(found.body?.model ?? '');
    setLensChoice(found.lens?.id ?? '');
    setLensQuery(found.lens?.model ?? '');
    setCustomBody(!found.body && Boolean(device.model));
    setCustomLens(!found.lens && Boolean(device.model));
    setMessage('');
  };

  const choosePreset = (index: number) =>
    beginEdit({
      id: editing?.id ?? crypto.randomUUID(),
      ...DEVICE_PRESETS[index],
    });

  const chooseBrand = (value: string) => {
    setBrandQuery(value);
    const brand = CAMERA_BRANDS.find(
      item => item.toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
    );
    if (!brand) return;
    setBrandChoice(brand);
    setBrandQuery(brand);
    setBodyChoice('');
    setBodyQuery('');
    setLensChoice('');
    setLensQuery('');
    setCustomBody(false);
    setCustomLens(false);
    if (editing) setEditing({ ...editing, brand });
  };

  const chooseBody = (value: string) => {
    setBodyQuery(value);
    const selected = CAMERA_BODIES.find(
      body => body.brand === brandChoice && body.model === value,
    );
    if (!selected) return;
    setBodyChoice(selected.id);
    setBodyQuery(selected.model);
    setLensChoice('');
    setLensQuery('');
    setCustomBody(false);
    setCustomLens(false);
    if (editing) {
      setEditing(autofillCatalogBody(editing, selected.id));
      setMessage('已填充机身推荐参数，请继续选择镜头或使用自定义镜头');
    }
  };

  const chooseLens = (value: string) => {
    setLensQuery(value);
    const selected = CAMERA_LENSES.find(
      item =>
        item.model === value && compatibleLenses(bodyChoice).includes(item),
    );
    if (!selected) return;
    setLensChoice(selected.id);
    setLensQuery(selected.model);
    setCustomLens(false);
    if (editing && bodyChoice) {
      setEditing(autofillCatalogSelection(editing, bodyChoice, selected.id));
      setMessage('已自动填充目录参数，下面全部数字字段仍可手工覆盖');
    }
  };

  const selectCustomBody = () => {
    setCustomBody(true);
    setBodyChoice('');
    setBodyQuery('');
    setLensChoice('');
    setLensQuery('');
    setCustomLens(true);
    setMessage('已选择自定义机身，请在下方手动填写品牌、型号与参数');
  };

  const selectCustomLens = () => {
    setCustomLens(true);
    setLensChoice('');
    setLensQuery('');
    setMessage('已选择自定义镜头，请在下方手动填写型号 / 镜头与参数');
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

  const bodySuggestions = bodiesForBrand(brandChoice, bodyQuery);
  const lensSuggestions = compatibleLenses(bodyChoice, lensQuery);

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
          {devices.map(device => (
            <div
              className={
                device.id === current.id ? 'device-row active' : 'device-row'
              }
              key={device.id}
            >
              <button
                onClick={() => {
                  onSelect(device.id);
                  setOpen(false);
                }}
              >
                <Check size={15} />
                {device.brand} {device.model}
              </button>
              <button aria-label="编辑设备" onClick={() => beginEdit(device)}>
                <Pencil size={15} />
              </button>
              <button
                aria-label="删除设备"
                onClick={() =>
                  devices.length <= 1
                    ? setMessage('至少保留一台设备')
                    : onDelete(device.id)
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
              搜索内置目录可自动填充，也可分别选择自定义机身或镜头。原有预设与本机数据继续可用。
            </p>
            <div className="catalog-selects" aria-label="相机镜头目录">
              <label>
                搜索 / 选择品牌
                <input
                  list="camera-brand-options"
                  value={brandQuery}
                  placeholder="输入 Sony、Canon…"
                  onChange={event => chooseBrand(event.target.value)}
                />
                <datalist id="camera-brand-options">
                  {CAMERA_BRANDS.map(brand => (
                    <option value={brand} key={brand} />
                  ))}
                </datalist>
              </label>
              <label>
                搜索 / 选择机身
                <input
                  list="camera-body-options"
                  value={bodyQuery}
                  disabled={!brandChoice}
                  placeholder={brandChoice ? '输入型号搜索' : '请先选择品牌'}
                  onChange={event => chooseBody(event.target.value)}
                />
                <datalist id="camera-body-options">
                  {bodySuggestions.map(item => (
                    <option
                      value={item.model}
                      label={`${item.mount} · ${item.sensorFormat}`}
                      key={item.id}
                    />
                  ))}
                </datalist>
                <button
                  type="button"
                  className={
                    customBody ? 'custom-choice active' : 'custom-choice'
                  }
                  onClick={selectCustomBody}
                >
                  自定义机身
                </button>
              </label>
              <label>
                搜索 / 选择兼容镜头
                <input
                  list="camera-lens-options"
                  value={lensQuery}
                  disabled={!bodyChoice}
                  placeholder={
                    bodyChoice ? '输入焦段或型号搜索' : '请先选择机身'
                  }
                  onChange={event => chooseLens(event.target.value)}
                />
                <datalist id="camera-lens-options">
                  {lensSuggestions.map(item => (
                    <option
                      value={item.model}
                      label={`${item.nativeFocalLength} · ${item.coverage} · ${item.stabilization ? '防抖' : '无镜头防抖'}`}
                      key={item.id}
                    />
                  ))}
                </datalist>
                <button
                  type="button"
                  className={
                    customLens ? 'custom-choice active' : 'custom-choice'
                  }
                  onClick={selectCustomLens}
                >
                  自定义镜头
                </button>
              </label>
            </div>
            <p className="catalog-note">
              高感 ISO 是 FrameSage
              推荐阈值，动态范围是不同测试口径下的近似参考；两者都不是厂商官方精确规格，请按实拍与输出需求覆盖。
            </p>
            <details className="legacy-presets">
              <summary>使用原有快捷预设</summary>
              <div className="preset-grid">
                {DEVICE_PRESETS.map((preset, index) => (
                  <button
                    key={preset.model}
                    onClick={() => choosePreset(index)}
                  >
                    <strong>{preset.brand}</strong>
                    <span>{preset.model}</span>
                  </button>
                ))}
              </div>
            </details>
            <div className="form-grid">
              <Text
                label="品牌"
                value={editing.brand}
                set={value => setEditing({ ...editing, brand: value })}
              />
              <Text
                label="型号 / 镜头"
                value={editing.model}
                set={value => setEditing({ ...editing, model: value })}
              />
              <Num
                label="高感 ISO（FrameSage 推荐阈值）"
                value={editing.isoLimit}
                set={value => setEditing({ ...editing, isoLimit: value })}
              />
              <Num
                label="动态范围参考（档，近似）"
                value={editing.dynamicRange}
                step="0.1"
                set={value => setEditing({ ...editing, dynamicRange: value })}
              />
              <Text
                label="色彩倾向（工程标签）"
                value={editing.colorBias}
                set={value => setEditing({ ...editing, colorBias: value })}
              />
              <Num
                label="焦段 / 规则代表焦段（mm）"
                value={editing.focalLength}
                set={value => setEditing({ ...editing, focalLength: value })}
              />
              <Num
                label="最大光圈"
                value={editing.maxAperture}
                step="0.1"
                set={value => setEditing({ ...editing, maxAperture: value })}
              />
              <Num
                label="虚化系数"
                value={editing.bokehFactor}
                step="0.01"
                set={value => setEditing({ ...editing, bokehFactor: value })}
              />
              <Num
                label="最近对焦距离（m）"
                value={editing.minFocus}
                step="0.01"
                set={value => setEditing({ ...editing, minFocus: value })}
              />
              <Text
                label="说明"
                value={editing.notes}
                set={value => setEditing({ ...editing, notes: value })}
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
}: { label: string; value: string; set: (value: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={event => set(event.target.value)} />
    </label>
  );
}

function Num({
  label,
  value,
  set,
  step = '1',
}: {
  label: string;
  value: number;
  set: (value: number) => void;
  step?: string;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={event => set(Number(event.target.value))}
      />
    </label>
  );
}
