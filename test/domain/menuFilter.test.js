import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterMenus } from '../../src/domain/menuFilter.js';

const menus = [
  { id: 'm1', name: 'Cheeseburger', ingredients: [{ ingredientId: 'bun' }, { ingredientId: 'beef' }], fixedCostItems: [{ fixedCostItemId: 'box' }] },
  { id: 'm2', name: 'Grilled Chicken Sandwich', ingredients: [{ ingredientId: 'bun' }, { ingredientId: 'chicken' }], fixedCostItems: [{ fixedCostItemId: 'box' }, { fixedCostItemId: 'napkin' }] },
  { id: 'm3', name: 'Salad', ingredients: [{ ingredientId: 'lettuce' }], fixedCostItems: [] },
];

test('returns all menus when no filters are given', () => {
  assert.deepEqual(filterMenus(menus, {}).map(m => m.id), ['m1', 'm2', 'm3']);
});

test('filters by name, case-insensitively and by substring', () => {
  assert.deepEqual(filterMenus(menus, { name: 'chicken' }).map(m => m.id), ['m2']);
  assert.deepEqual(filterMenus(menus, { name: 'CHEESE' }).map(m => m.id), ['m1']);
});

test('filters by ingredient membership, matching any selected ingredient', () => {
  assert.deepEqual(filterMenus(menus, { ingredientIds: ['chicken'] }).map(m => m.id), ['m2']);
  assert.deepEqual(filterMenus(menus, { ingredientIds: ['beef', 'lettuce'] }).map(m => m.id), ['m1', 'm3']);
});

test('filters by fixed cost membership, matching any selected fixed cost', () => {
  assert.deepEqual(filterMenus(menus, { fixedCostIds: ['napkin'] }).map(m => m.id), ['m2']);
  assert.deepEqual(filterMenus(menus, { fixedCostIds: ['box'] }).map(m => m.id), ['m1', 'm2']);
});

test('combines all filters with AND semantics', () => {
  assert.deepEqual(
    filterMenus(menus, { name: 'e', ingredientIds: ['bun'], fixedCostIds: ['napkin'] }).map(m => m.id),
    ['m2']
  );
});

test('ignores menus that do not match every filter', () => {
  assert.deepEqual(filterMenus(menus, { name: 'salad', ingredientIds: ['bun'] }), []);
});
