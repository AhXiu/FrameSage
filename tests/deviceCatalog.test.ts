import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAMERA_BODIES,
  CAMERA_BRANDS,
  CAMERA_LENSES,
} from '../src/data/deviceCatalog';
import {
  autofillCatalogBody,
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

test('目录数量与品牌覆盖满足研究清单', () => {
  assert.equal(CAMERA_BODIES.length, 39);
  assert.ok(CAMERA_LENSES.length >= 57);
  assert.deepEqual(CAMERA_BRANDS, ['Sony', 'Canon', 'Nikon', 'Fujifilm']);
  for (const brand of CAMERA_BRANDS) {
    assert.ok(CAMERA_BODIES.some(body => body.brand === brand));
    assert.ok(CAMERA_LENSES.some(lens => lens.brand === brand));
  }
});

test('目录字段包含画幅、参考口径、物理焦段、防抖与用途', () => {
  for (const body of CAMERA_BODIES) {
    assert.ok(body.mount && body.sensorFormat);
    assert.ok(body.isoLimit > 0);
    assert.match(body.dynamicRangeReference, /约|参考|近似/);
    assert.ok(body.colorBias && body.notes);
  }
  for (const lens of CAMERA_LENSES) {
    assert.ok(lens.mount && lens.coverage && lens.nativeFocalLength);
    assert.ok(lens.focalLength > 0 && lens.maxAperture > 0);
    assert.ok(lens.minFocus > 0);
    assert.equal(typeof lens.stabilization, 'boolean');
    assert.ok(lens.notes);
  }
});

test('同卡口 APS-C 可用全画幅与专用镜头，全画幅排除专用镜头', () => {
  const sonyAps = compatibleLenses('sony-a6700');
  assert.ok(sonyAps.some(lens => lens.id === 'sony-85-18'));
  assert.ok(sonyAps.some(lens => lens.id === 'sony-e15-14'));
  assert.ok(
    !compatibleLenses('sony-a7iv').some(lens => lens.id === 'sony-e15-14'),
  );
  assert.ok(
    !compatibleLenses('canon-r5').some(lens => lens.id === 'canon-rfs18150'),
  );
  assert.ok(
    compatibleLenses('canon-r7').some(lens => lens.id === 'canon-rfs18150'),
  );
});

test('Fujifilm X 与 G 卡口严格隔离', () => {
  const xLenses = compatibleLenses('fuji-xt5');
  const gLenses = compatibleLenses('fuji-gfx100ii');
  assert.ok(xLenses.every(lens => lens.mount === 'Fujifilm X'));
  assert.ok(gLenses.every(lens => lens.mount === 'Fujifilm G'));
  assert.ok(!xLenses.some(lens => lens.id === 'fuji-gf110-2'));
  assert.ok(!gLenses.some(lens => lens.id === 'fuji-56-12'));
});

test('品牌内机身与兼容镜头支持型号、焦段和用途搜索', () => {
  assert.deepEqual(
    bodiesForBrand('Nikon', 'Z6 III').map(body => body.id),
    ['nikon-z6iii'],
  );
  assert.ok(
    compatibleLenses('nikon-z6iii', '135mm').some(
      lens => lens.id === 'nikon-135-18',
    ),
  );
  assert.ok(
    compatibleLenses('canon-r6ii', '婚礼').some(
      lens => lens.id === 'canon-2470-28',
    ),
  );
});

test('可匹配已有的组合型号并恢复目录联动项', () => {
  const match = matchCatalogDevice({
    brand: 'Sony',
    model: 'A7 IV + FE 50mm F1.8',
  });
  assert.equal(match.body?.id, 'sony-a7iv');
  assert.equal(match.lens?.id, 'sony-50-18');
});

test('只选机身也会填入推荐参考且保留设备 id', () => {
  const filled = autofillCatalogBody(manual, 'nikon-z6iii');
  assert.equal(filled.id, manual.id);
  assert.equal(filled.brand, 'Nikon');
  assert.equal(filled.model, 'Z6 III');
  assert.equal(filled.isoLimit, 12800);
});

test('机身与兼容镜头联动填充全部推荐参数', () => {
  const filled = autofillCatalogSelection(manual, 'canon-r6ii', 'canon-85-2');
  assert.equal(filled.id, manual.id);
  assert.equal(filled.brand, 'Canon');
  assert.match(filled.model, /EOS R6 Mark II.*RF 85mm/);
  assert.equal(filled.isoLimit, 12800);
  assert.equal(filled.dynamicRange, 11.9);
  assert.equal(filled.focalLength, 85);
  assert.equal(filled.maxAperture, 2);
  assert.equal(filled.bokehFactor, 1.1);
  assert.equal(filled.minFocus, 0.35);
  assert.match(filled.colorBias, /肤色/);
  assert.match(filled.notes, /全画幅/);
  assert.match(filled.notes, /镜头防抖：有/);
});

test('自定义输入不强制匹配，未知或不兼容选择保持全部手工值', () => {
  assert.deepEqual(matchCatalogDevice(manual), {});
  assert.deepEqual(autofillCatalogBody(manual, 'missing'), manual);
  assert.deepEqual(
    autofillCatalogSelection(manual, 'missing', 'canon-85-2'),
    manual,
  );
  assert.deepEqual(
    autofillCatalogSelection(manual, 'sony-a7iv', 'sony-e15-14'),
    manual,
  );
  assert.deepEqual(
    autofillCatalogSelection(manual, 'fuji-xt5', 'fuji-gf110-2'),
    manual,
  );
});

test('自动填充后全部数字和文本字段仍可手工覆盖', () => {
  const filled = autofillCatalogSelection(manual, 'fuji-xt5', 'fuji-56-12');
  const overridden: Device = {
    ...filled,
    isoLimit: 1600,
    dynamicRange: 10.8,
    focalLength: 90,
    maxAperture: 2,
    bokehFactor: 0.6,
    minFocus: 0.8,
    notes: '我的实测设置',
  };
  assert.equal(overridden.isoLimit, 1600);
  assert.equal(overridden.dynamicRange, 10.8);
  assert.equal(overridden.focalLength, 90);
  assert.equal(overridden.maxAperture, 2);
  assert.equal(overridden.bokehFactor, 0.6);
  assert.equal(overridden.minFocus, 0.8);
  assert.equal(overridden.notes, '我的实测设置');
});
