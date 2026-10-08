import { DEFAULT_DEVICE } from '@/data/devices';
import { rankPlans } from '@/data/poses';
import { recommend } from '@/lib/recommendationEngine';
import { classifyScene } from '@/lib/sceneEngine';
import * as store from '@/lib/storage';
import type { Device, Favorite, SceneResult, UserMode } from '@/types';
import { useEffect, useMemo, useState } from 'react';

const INITIAL_SCENE = classifyScene({
  brightness: 58,
  warmth: 54,
  centerEdge: 4,
  highlights: 18,
  contrast: 28,
  clutter: 24,
});

export function useFrameSage() {
  const [devices, setDevices] = useState<Device[]>(() => store.loadDevices());
  const [currentId, setCurrentId] = useState<string | null>(() =>
    store.loadCurrentId(),
  );
  const [mode, setModeState] = useState<UserMode>(() => store.loadMode());
  const [scene, setScene] = useState<SceneResult>(INITIAL_SCENE);
  const [favorites, setFavorites] = useState<Favorite[]>(() =>
    store.loadFavorites(),
  );

  const device =
    devices.find(item => item.id === currentId) ?? devices[0] ?? DEFAULT_DEVICE;
  const params = useMemo(
    () => recommend(device, scene, mode),
    [device, scene, mode],
  );
  const plans = useMemo(() => {
    const aperture = Number.parseFloat(params.aperture.slice(2));
    const bokehFactor =
      Number.isFinite(device.bokehFactor) && device.bokehFactor > 0
        ? device.bokehFactor
        : 1;
    const effectiveAperture = aperture / bokehFactor;
    return rankPlans(
      scene.id,
      device.focalLength || 50,
      Number.isFinite(effectiveAperture) && effectiveAperture <= 2.4,
    );
  }, [device, params.aperture, scene.id]);

  useEffect(() => {
    if (devices.length > 0 && !devices.some(item => item.id === currentId)) {
      const fallbackId = devices[0].id;
      setCurrentId(fallbackId);
      store.saveCurrentId(fallbackId);
    }
  }, [currentId, devices]);

  const saveDevice = (next: Device) => {
    setDevices(previous => {
      const items = previous.some(item => item.id === next.id)
        ? previous.map(item => (item.id === next.id ? next : item))
        : [...previous, next];
      store.saveDevices(items);
      return items;
    });
    setCurrentId(next.id);
    store.saveCurrentId(next.id);
  };

  const deleteDevice = (id: string) => {
    setDevices(previous => {
      if (previous.length <= 1) return previous;
      const items = previous.filter(item => item.id !== id);
      store.saveDevices(items);
      if (id === currentId) {
        setCurrentId(items[0].id);
        store.saveCurrentId(items[0].id);
      }
      return items;
    });
  };

  const selectDevice = (id: string) => {
    if (!devices.some(item => item.id === id)) return;
    setCurrentId(id);
    store.saveCurrentId(id);
  };

  const setMode = (next: UserMode) => {
    setModeState(next);
    store.saveMode(next);
  };

  const addFavorite = (planIndex: number) => {
    const plan = plans[planIndex] ?? plans[0];
    if (!plan) return;
    const item: Favorite = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      note: '',
      scene,
      device,
      params,
      plan,
    };
    setFavorites(previous => {
      const items = [item, ...previous];
      store.saveFavorites(items);
      return items;
    });
  };

  const updateFavorite = (id: string, note: string) => {
    setFavorites(previous => {
      const items = previous.map(item =>
        item.id === id ? { ...item, note } : item,
      );
      store.saveFavorites(items);
      return items;
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites(previous => {
      const items = previous.filter(item => item.id !== id);
      store.saveFavorites(items);
      return items;
    });
  };

  const applyFavorite = (favorite: Favorite) => {
    setScene(favorite.scene);
    saveDevice(favorite.device);
  };

  const clear = () => {
    store.clearAppData();
    setDevices([]);
    setFavorites([]);
    setCurrentId(null);
    setModeState('beginner');
    setScene(INITIAL_SCENE);
  };

  return {
    devices,
    device,
    mode,
    scene,
    params,
    plans,
    favorites,
    setScene,
    saveDevice,
    deleteDevice,
    selectDevice,
    setMode,
    addFavorite,
    updateFavorite,
    removeFavorite,
    applyFavorite,
    clear,
  };
}
