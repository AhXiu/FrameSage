import {
  DEFAULT_IMAGE_GENERATION_CONFIG,
  normalizeImageGenerationConfig,
} from '@/lib/imageGeneration';
import type {
  Device,
  Favorite,
  ImageGenerationConfig,
  UserMode,
} from '@/types';

export const KEYS = {
  devices: 'framesage.devices.v1',
  current: 'framesage.current.v1',
  favorites: 'framesage.favorites.v1',
  mode: 'framesage.mode.v1',
  imageGeneration: 'framesage.image-generation.v1',
} as const;

export const SESSION_KEYS = {
  imageGenerationAppKey: 'framesage.image-generation.app-key.v1',
} as const;

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
export function loadDevices(): Device[] {
  return typeof localStorage === 'undefined'
    ? []
    : safeParse(localStorage.getItem(KEYS.devices), []);
}
export function saveDevices(devices: Device[]): void {
  localStorage.setItem(KEYS.devices, JSON.stringify(devices));
}
export function loadCurrentId(): string | null {
  return typeof localStorage === 'undefined'
    ? null
    : localStorage.getItem(KEYS.current);
}
export function saveCurrentId(id: string): void {
  localStorage.setItem(KEYS.current, id);
}
export function loadFavorites(): Favorite[] {
  return typeof localStorage === 'undefined'
    ? []
    : safeParse(localStorage.getItem(KEYS.favorites), []);
}
export function saveFavorites(items: Favorite[]): void {
  localStorage.setItem(KEYS.favorites, JSON.stringify(items));
}
export function loadMode(): UserMode {
  return typeof localStorage === 'undefined'
    ? 'beginner'
    : localStorage.getItem(KEYS.mode) === 'expert'
      ? 'expert'
      : 'beginner';
}
export function saveMode(mode: UserMode): void {
  localStorage.setItem(KEYS.mode, mode);
}
export function loadImageGenerationConfig(): ImageGenerationConfig {
  if (typeof localStorage === 'undefined')
    return DEFAULT_IMAGE_GENERATION_CONFIG;
  return normalizeImageGenerationConfig(
    safeParse<Partial<ImageGenerationConfig> | null>(
      localStorage.getItem(KEYS.imageGeneration),
      null,
    ),
  );
}
export function saveImageGenerationConfig(config: ImageGenerationConfig): void {
  const safeConfig = normalizeImageGenerationConfig(config);
  localStorage.setItem(KEYS.imageGeneration, JSON.stringify(safeConfig));
}
export function loadImageGenerationAppKey(): string {
  return typeof sessionStorage === 'undefined'
    ? ''
    : (sessionStorage.getItem(SESSION_KEYS.imageGenerationAppKey) ?? '');
}
export function saveImageGenerationAppKey(appKey: string): void {
  if (appKey)
    sessionStorage.setItem(SESSION_KEYS.imageGenerationAppKey, appKey);
  else sessionStorage.removeItem(SESSION_KEYS.imageGenerationAppKey);
}
export function clearAppData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  if (typeof sessionStorage !== 'undefined')
    Object.values(SESSION_KEYS).forEach(key => sessionStorage.removeItem(key));
}
