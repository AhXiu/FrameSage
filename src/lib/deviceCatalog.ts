import { CAMERA_BODIES, CAMERA_LENSES } from '@/data/deviceCatalog';
import type { CameraBody, CameraBrand, CameraLens } from '@/data/deviceCatalog';
import type { Device } from '@/types';

const normalize = (value: string) =>
  value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '');

export function bodiesForBrand(brand: string): CameraBody[] {
  return CAMERA_BODIES.filter(body => body.brand === brand);
}

export function compatibleLenses(bodyId: string): CameraLens[] {
  const body = CAMERA_BODIES.find(item => item.id === bodyId);
  return body ? CAMERA_LENSES.filter(lens => lens.mount === body.mount) : [];
}

export function matchCatalogDevice(device: Pick<Device, 'brand' | 'model'>): {
  brand?: CameraBrand;
  body?: CameraBody;
  lens?: CameraLens;
} {
  const brand = CAMERA_BODIES.find(
    item => normalize(item.brand) === normalize(device.brand),
  )?.brand;
  if (!brand) return {};
  const normalizedModel = normalize(device.model);
  const body = CAMERA_BODIES.find(
    item =>
      item.brand === brand && normalizedModel.includes(normalize(item.model)),
  );
  const lens = CAMERA_LENSES.find(
    item =>
      item.brand === brand && normalizedModel.includes(normalize(item.model)),
  );
  return { brand, body, lens };
}

export function autofillCatalogSelection(
  device: Device,
  bodyId: string,
  lensId: string,
): Device {
  const body = CAMERA_BODIES.find(item => item.id === bodyId);
  const lens = CAMERA_LENSES.find(item => item.id === lensId);
  if (!body || !lens || body.mount !== lens.mount) return device;

  return {
    ...device,
    brand: body.brand,
    model: `${body.model} + ${lens.model}`,
    isoLimit: body.isoLimit,
    dynamicRange: body.dynamicRange,
    colorBias: body.colorBias,
    focalLength: lens.focalLength,
    maxAperture: lens.maxAperture,
    bokehFactor: lens.bokehFactor,
    minFocus: lens.minFocus,
    notes: `${body.notes}；${lens.notes}`,
  };
}
