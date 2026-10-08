import type { Device, Favorite, UserMode } from '@/types';

export const KEYS = {
  devices: 'framesage.devices.v1',
  current: 'framesage.current.v1',
  favorites: 'framesage.favorites.v1',
  mode: 'framesage.mode.v1',
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
export function clearAppData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
