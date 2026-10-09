import assert from 'node:assert/strict';
import test from 'node:test';
import { CAMERA_BRANDS } from '../src/data/deviceCatalog';
import {
  autofillCatalogSelection,
  bodiesForBrand,
  compatibleLenses,
  matchCatalogDevice,
} from '../src/lib/deviceCatalog';
import type { Device } from '../src/types';

const manual: Device = {
  id: 'manual',
  brand: 'Unknown',
  model: 'Custom',
  isoLimit: 2000,
  dynamicRange: 12,
  colorBias: '自定义',
  focalLength: 40,
  maxAperture: 2,
  bokehFactor: 0.8,
  minFocus: 0.3,
  notes: '手工值',
};

test('每个品牌至少包含 3 款机身和 4 款兼容镜头', () => {
  for (const brand of CAMERA_BRANDS) {
    const bodies = bodiesForBrand(brand);
    assert.ok(bodies.length >= 3);
    assert.ok(compatibleLenses(bodies[0].id).length >= 4);
  }
});

test('可匹配已有的组合型号并恢复目录联动项', () => {
  const match = matchCatalogDevice({
    brand: 'Sony',
    model: 'A7 IV + FE 50mm F1.8',
  });
  assert.equal(match.body?.id, 'sony-a7iv');
  assert.equal(match.lens?.id, 'sony-50-18');
});

test('机身与兼容镜头联动填充全部推荐参数', () => {
  const filled = autofillCatalogSelection(manual, 'canon-r6ii', 'canon-85-2');
  assert.equal(filled.id, manual.id);
  assert.equal(filled.brand, 'Canon');
  assert.match(filled.model, /EOS R6 Mark II.*RF 85mm/);
  assert.equal(filled.isoLimit, 6400);
  assert.equal(filled.dynamicRange, 14.2);
  assert.equal(filled.focalLength, 85);
  assert.equal(filled.maxAperture, 2);
  assert.equal(filled.bokehFactor, 1.1);
  assert.equal(filled.minFocus, 0.35);
  assert.match(filled.colorBias, /肤色/);
  assert.match(filled.notes, /全画幅/);
});

test('未知型号不匹配，未知或不兼容选择保持原手工值', () => {
  assert.deepEqual(matchCatalogDevice(manual), {});
  assert.deepEqual(
    autofillCatalogSelection(manual, 'missing', 'canon-85-2'),
    manual,
  );
  assert.deepEqual(
    autofillCatalogSelection(manual, 'sony-a7iv', 'canon-85-2'),
    manual,
  );
});

test('自动填充后仍可手工覆盖且不会被纯函数隐式改回', () => {
  const filled = autofillCatalogSelection(manual, 'fuji-xt5', 'fuji-56-12');
  const overridden = { ...filled, isoLimit: 1600, notes: '我的实测设置' };
  assert.equal(overridden.isoLimit, 1600);
  assert.equal(overridden.notes, '我的实测设置');
});
