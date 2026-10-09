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
export type ImageGenerationProvider = 'ark' | 'openai' | 'custom';
export type ImageGenerationTransport = 'direct' | 'proxy';
export interface ImageGenerationConfig {
  provider: ImageGenerationProvider;
  displayName: string;
  baseUrl: string;
  model: string;
  transport: ImageGenerationTransport;
  proxyUrl: string;
}
export type SubjectMotion = 'still' | 'walking' | 'fast';
export type HoldingState = 'steady' | 'normal' | 'shaky' | 'tripod';
export type GroupSize = 'single' | 'couple' | 'group';
export interface ShootingContext {
  motion: SubjectMotion;
  holding: HoldingState;
  groupSize: GroupSize;
}
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
export interface SceneAssessment {
  primary: SceneResult;
  confidence: number;
  alternative: Pick<SceneResult, 'id' | 'name'>;
  risks: string[];
  manuallyConfirmed: boolean;
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
export type OutfitStyle = '清新' | '通勤' | '复古' | '街头' | '优雅' | '休闲';
export type ClothingType = '裙装' | '裤装' | '长外套' | '短外套' | '运动装';
export type EnvironmentFeature =
  | '窗边'
  | '墙面'
  | '座椅'
  | '栏杆'
  | '街道'
  | '树木'
  | '开阔空间';
export interface OutfitProfile {
  clothingTypes: string[];
  styles: string[];
  footwearAccessories: string[];
  movementRestrictions: string[];
}
export interface EnvironmentProfile {
  usableObjects: string[];
  spaces: string[];
  backgroundStructures: string[];
  lightTendencies: string[];
}
export interface PortraitContextAnalysis {
  outfit: OutfitProfile;
  environment: EnvironmentProfile;
  confidence: number;
  summary: string;
  source: 'vision' | 'manual';
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
  personalizationReason?: string;
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
