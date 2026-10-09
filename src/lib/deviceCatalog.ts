import { CAMERA_BODIES, CAMERA_LENSES } from '@/data/deviceCatalog';
import type { CameraBody, CameraBrand, CameraLens } from '@/data/deviceCatalog';
import type { Device } from '@/types';

const normalize = (value: string) =>
  value.toLocaleLowerCase().replaceAll(/[^\p{L}\p{N}]+/gu, '');

const includesQuery = (values: string[], query: string) => {
  const needle = normalize(query);
  return !needle || values.some(value => normalize(value).includes(needle));
};

export function bodiesForBrand(brand: string, query = ''): CameraBody[] {
  return CAMERA_BODIES.filter(
    body =>
      body.brand === brand &&
      includesQuery(
        [body.brand, body.model, body.mount, body.sensorFormat, body.notes],
        query,
      ),
  );
}

export function isLensCompatible(body: CameraBody, lens: CameraLens): boolean {
  if (body.brand !== lens.brand || body.mount !== lens.mount) return false;
  if (body.sensorFormat === 'APS-C') {
    return lens.coverage === 'APS-C' || lens.coverage === 'Full Frame';
  }
  return body.sensorFormat === lens.coverage;
}

export function compatibleLenses(bodyId: string, query = ''): CameraLens[] {
  const body = CAMERA_BODIES.find(item => item.id === bodyId);
  if (!body) return [];
  return CAMERA_LENSES.filter(
    lens =>
      isLensCompatible(body, lens) &&
      includesQuery(
        [
          lens.brand,
          lens.model,
          lens.mount,
          lens.coverage,
          lens.nativeFocalLength,
          lens.notes,
        ],
        query,
      ),
  );
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

export function autofillCatalogBody(device: Device, bodyId: string): Device {
  const body = CAMERA_BODIES.find(item => item.id === bodyId);
  if (!body) return device;
  return {
    ...device,
    brand: body.brand,
    model: body.model,
    isoLimit: body.isoLimit,
    dynamicRange: body.dynamicRange,
    colorBias: body.colorBias,
    notes: body.notes,
  };
}

export function autofillCatalogSelection(
  device: Device,
  bodyId: string,
  lensId: string,
): Device {
  const body = CAMERA_BODIES.find(item => item.id === bodyId);
  const lens = CAMERA_LENSES.find(item => item.id === lensId);
  if (!body || !lens || !isLensCompatible(body, lens)) return device;

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
    notes: `${body.notes}；${lens.notes}；镜头防抖：${lens.stabilization ? '有' : '无'}`,
  };
}
