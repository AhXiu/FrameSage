import assert from 'node:assert/strict';
import test from 'node:test';
import {
  KEYS,
  SESSION_KEYS,
  clearAppData,
  loadDevices,
  loadImageGenerationAppKey,
  saveDevices,
  saveImageGenerationAppKey,
  saveImageGenerationConfig,
} from '../src/lib/storage';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}
Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  value: new MemoryStorage(),
  configurable: true,
});
test('设备可以持久化并读取', () => {
  const devices = [
    {
      id: '1',
      brand: 'Test',
      model: '50mm',
      isoLimit: 3200,
      dynamicRange: 13,
      colorBias: '中性',
      focalLength: 50,
      maxAperture: 1.8,
      bokehFactor: 1,
      minFocus: 0.4,
      notes: '',
    },
  ];
  saveDevices(devices);
  assert.deepEqual(loadDevices(), devices);
});
test('损坏数据安全降级为空数组', () => {
  localStorage.setItem(KEYS.devices, '{bad');
  assert.deepEqual(loadDevices(), []);
});
test('清空只移除应用键', () => {
  localStorage.setItem('other', 'keep');
  localStorage.setItem(KEYS.mode, 'expert');
  clearAppData();
  assert.equal(localStorage.getItem(KEYS.mode), null);
  assert.equal(localStorage.getItem('other'), 'keep');
});

test('生成 AppKey 只进入 sessionStorage，非敏感配置才进入 localStorage', () => {
  const appKey = 'unit-test-key';
  saveImageGenerationConfig({
    provider: 'custom',
    displayName: 'Custom',
    baseUrl: 'https://images.example/generate',
    model: 'custom-model',
    transport: 'direct',
    proxyUrl: '',
  });
  saveImageGenerationAppKey(appKey);
  assert.equal(loadImageGenerationAppKey(), appKey);
  assert.equal(
    sessionStorage.getItem(SESSION_KEYS.imageGenerationAppKey),
    appKey,
  );
  assert.doesNotMatch(
    localStorage.getItem(KEYS.imageGeneration) ?? '',
    /unit-test-key/,
  );
});

test('清空应用数据同时清除会话 Key', () => {
  saveImageGenerationAppKey('temporary-key');
  clearAppData();
  assert.equal(
    sessionStorage.getItem(SESSION_KEYS.imageGenerationAppKey),
    null,
  );
});
