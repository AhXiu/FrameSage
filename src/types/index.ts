export type SceneId =
  | 'indoor-soft'
  | 'indoor-mixed'
  | 'window-backlight'
  | 'shade-dappled'
  | 'outdoor-front'
  | 'outdoor-side'
  | 'city-night'
  | 'window-warm-night';
export type UserMode = 'beginner' | 'expert';
export type Composition = '三分法' | '居中' | '框架' | '引导线' | '留白';

export interface Device {
  id: string;
  brand: string;
  model: string;
  isoLimit: number;
  dynamicRange: number;
  colorBias: string;
  focalLength: number;
  maxAperture: number;
  bokehFactor: number;
  minFocus: number;
  notes: string;
}
export interface SceneMetrics {
  brightness: number;
  warmth: number;
  centerEdge: number;
  highlights: number;
  contrast: number;
  clutter: number;
}
export interface SceneResult {
  id: SceneId;
  name: string;
  brightnessLabel: string;
  direction: string;
  temperature: string;
  clutter: string;
  explanation: string;
  metrics: SceneMetrics;
}
export interface CameraParams {
  aperture: string;
  shutter: string;
  iso: number;
  whiteBalance: string;
  exposure: string;
  metering: string;
  focus: string;
  action: string;
  principle: string;
  tradeoff: string;
  risk: string;
}
export interface PosePlan {
  id: string;
  name: string;
  scene: SceneId;
  focal: number;
  composition: Composition;
  head: string;
  shoulders: string;
  hands: string;
  feet: string;
  gaze: string;
  direction: string;
  framing: string;
  avoid: string;
  imageUrl?: string;
  imageAlt?: string;
  score?: number;
}
export interface Favorite {
  id: string;
  createdAt: string;
  note: string;
  scene: SceneResult;
  device: Device;
  params: CameraParams;
  plan: PosePlan;
}
export type TabId = 'shoot' | 'plan' | 'favorites' | 'settings';
