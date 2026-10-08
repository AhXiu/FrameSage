import type { Device } from '@/types';

export const DEVICE_PRESETS: Omit<Device, 'id'>[] = [
  {
    brand: 'Sony',
    model: 'A7 IV + FE 50mm F1.8',
    isoLimit: 6400,
    dynamicRange: 14.7,
    colorBias: '自然偏暖',
    focalLength: 50,
    maxAperture: 1.8,
    bokehFactor: 1,
    minFocus: 0.45,
    notes: '全画幅日常人像套装',
  },
  {
    brand: 'Canon',
    model: 'EOS R6 II + RF 85mm F2',
    isoLimit: 6400,
    dynamicRange: 14.2,
    colorBias: '肤色柔和',
    focalLength: 85,
    maxAperture: 2,
    bokehFactor: 1.1,
    minFocus: 0.35,
    notes: '半身特写友好',
  },
  {
    brand: 'Fujifilm',
    model: 'X-S20 + XF 35mm F1.4',
    isoLimit: 3200,
    dynamicRange: 13.5,
    colorBias: '胶片暖调',
    focalLength: 50,
    maxAperture: 1.4,
    bokehFactor: 0.72,
    minFocus: 0.28,
    notes: 'APS-C 等效约 53mm',
  },
  {
    brand: 'Nikon',
    model: 'Z6 III + Z 35mm F1.8',
    isoLimit: 6400,
    dynamicRange: 14,
    colorBias: '中性通透',
    focalLength: 35,
    maxAperture: 1.8,
    bokehFactor: 1,
    minFocus: 0.25,
    notes: '环境人像与街拍',
  },
];

export const DEFAULT_DEVICE: Device = {
  id: 'demo-device',
  ...DEVICE_PRESETS[0],
};
