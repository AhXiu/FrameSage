import {
  PROVIDER_DEFAULTS,
  validateImageGenerationConfig,
} from '@/lib/imageGeneration';
import {
  loadImageGenerationAppKey,
  loadImageGenerationConfig,
  saveImageGenerationAppKey,
  saveImageGenerationConfig,
} from '@/lib/storage';
import type { ImageGenerationConfig, ImageGenerationProvider } from '@/types';
import { Eye, EyeOff, KeyRound, Trash2 } from 'lucide-react';
import { useState } from 'react';

const PROVIDERS: [ImageGenerationProvider, string][] = [
  ['ark', '火山方舟 Seedream'],
  ['openai', 'OpenAI Images'],
  ['custom', '自定义 OpenAI-compatible'],
];

export function ImageGenerationSettings() {
  const [config, setConfig] = useState(loadImageGenerationConfig);
  const [appKey, setAppKey] = useState(loadImageGenerationAppKey);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState('');

  const update = (patch: Partial<ImageGenerationConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveImageGenerationConfig(next);
    setMessage('');
  };
  const selectProvider = (provider: ImageGenerationProvider) => {
    const defaults = PROVIDER_DEFAULTS[provider];
    update({ provider, ...defaults });
  };
  const updateKey = (value: string) => {
    setAppKey(value);
    saveImageGenerationAppKey(value);
    setMessage('');
  };
  const validate = () => {
    const errors = validateImageGenerationConfig(config, appKey);
    setMessage(
      errors.length
        ? errors.join(' ')
        : '配置格式有效。此检查不会发送请求或验证额度。',
    );
  };

  return (
    <section className="setting-card block generation-settings">
      <div className="setting-heading">
        <KeyRound />
        <div>
          <h2>图片生成服务</h2>
          <p>用于个性化姿势的写实 AI 示意预览，与视觉分析服务相互独立。</p>
        </div>
      </div>
      <div className="generation-form">
        <label>
          服务提供商
          <select
            value={config.provider}
            onChange={event =>
              selectProvider(
                event.currentTarget.value as ImageGenerationProvider,
              )
            }
            aria-label="图片生成服务提供商"
          >
            {PROVIDERS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          显示名称
          <input
            value={config.displayName}
            onChange={event =>
              update({ displayName: event.currentTarget.value })
            }
          />
        </label>
        <label>
          Model ID（可编辑）
          <input
            value={config.model}
            onChange={event => update({ model: event.currentTarget.value })}
            placeholder="填写控制台已开通的 Model ID"
          />
        </label>
        <label>
          Base URL
          <input
            inputMode="url"
            value={config.baseUrl}
            onChange={event => update({ baseUrl: event.currentTarget.value })}
            placeholder="https://…"
          />
        </label>
        <label>
          调用模式
          <select
            value={config.transport}
            onChange={event =>
              update({
                transport: event.currentTarget
                  .value as ImageGenerationConfig['transport'],
              })
            }
          >
            <option value="direct">浏览器直连（BYOK）</option>
            <option value="proxy">服务端代理（推荐生产环境）</option>
          </select>
        </label>
        {config.transport === 'proxy' && (
          <label>
            代理地址
            <input
              inputMode="url"
              value={config.proxyUrl}
              onChange={event =>
                update({ proxyUrl: event.currentTarget.value })
              }
              placeholder="https://your-proxy.example/generate"
            />
          </label>
        )}
        <label>
          AppKey（仅当前标签页）
          <span className="secret-input">
            <input
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              value={appKey}
              onChange={event => updateKey(event.currentTarget.value)}
              placeholder={
                config.transport === 'proxy'
                  ? '代理模式通常无需填写'
                  : '未预置 Key'
              }
              aria-label="图片生成 AppKey"
            />
            <button
              type="button"
              onClick={() => setShowKey(value => !value)}
              aria-label={showKey ? '隐藏 AppKey' : '显示 AppKey'}
              aria-pressed={showKey}
            >
              {showKey ? <EyeOff /> : <Eye />}
            </button>
            <button
              type="button"
              onClick={() => updateKey('')}
              aria-label="清除 AppKey"
              disabled={!appKey}
            >
              <Trash2 />
            </button>
          </span>
        </label>
      </div>
      <p className="security-note">
        非敏感配置保存在 localStorage；AppKey 仅保存在
        sessionStorage，关闭标签页即失效。生产环境推荐 proxy。浏览器 BYOK 会把
        Key 发送给所选提供商，并可能受 CORS 限制。
      </p>
      <button
        type="button"
        className="secondary config-check"
        onClick={validate}
      >
        校验连接配置
      </button>
      {message && <output className="workspace-message">{message}</output>}
    </section>
  );
}
