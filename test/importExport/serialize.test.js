import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBackupPayload,
  serializeBackup,
  parseBackupJSON,
  validateBackupShape,
  buildDatedFilename,
} from '../../src/importExport/serialize.js';

test('buildBackupPayload assembles the expected shape', () => {
  assert.deepEqual(buildBackupPayload(['i'], ['f'], ['m'], 0.3), {
    version: 1,
    ingredients: ['i'],
    fixedCostItems: ['f'],
    menus: ['m'],
    mdr: 0.3,
  });
});

test('serialize/parse round-trips a payload', () => {
  const payload = buildBackupPayload([], [], [], 0.321);
  const { ok, data } = parseBackupJSON(serializeBackup(payload));
  assert.equal(ok, true);
  assert.deepEqual(data, payload);
});

test('parseBackupJSON reports failure on invalid JSON', () => {
  const result = parseBackupJSON('{not json');
  assert.equal(result.ok, false);
  assert.match(result.error, /Invalid file/);
});

test('validateBackupShape rejects missing required fields', () => {
  assert.match(validateBackupShape({ ingredients: [], fixedCostItems: [], menus: [], mdr: 'x' }), /missing required fields/);
});

test('validateBackupShape rejects unsupported version', () => {
  const data = { ingredients: [], fixedCostItems: [], menus: [], mdr: 0.3, version: 2 };
  assert.match(validateBackupShape(data), /Unsupported backup version/);
});

test('validateBackupShape accepts a well-formed payload', () => {
  const data = { ingredients: [], fixedCostItems: [], menus: [], mdr: 0.3, version: 1 };
  assert.equal(validateBackupShape(data), null);
});

test('buildDatedFilename embeds the given date string', () => {
  assert.equal(buildDatedFilename('2024-01-01'), 'menu-calculator-backup-2024-01-01.json');
});
