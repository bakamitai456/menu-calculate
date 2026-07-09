import { test } from 'node:test';
import assert from 'node:assert/strict';
import { costPerUnit, calcMenu } from '../../src/domain/calc.js';

test('costPerUnit divides price by bulk qty', () => {
  assert.equal(costPerUnit({ bulkQty: 4, bulkPrice: 10 }), 2.5);
});

test('costPerUnit returns 0 when bulkQty is zero or negative', () => {
  assert.equal(costPerUnit({ bulkQty: 0, bulkPrice: 10 }), 0);
  assert.equal(costPerUnit({ bulkQty: -1, bulkPrice: 10 }), 0);
});

test('calcMenu ignores rows referencing missing ingredient/fixedCost ids', () => {
  const menu = {
    ingredients: [{ ingredientId: 'missing', qty: 3 }],
    fixedCostItems: [{ fixedCostItemId: 'missing', qty: 1 }],
    frontStorePrice: 10,
    deliveryPrice: 12,
  };
  const result = calcMenu(menu, { ingredients: [], fixedCosts: [], mdr: 0.3 });
  assert.equal(result.ingredientCost, 0);
  assert.equal(result.fixedCost, 0);
  assert.equal(result.totalCost, 0);
});

test('calcMenu computes cost, margin, and delivery numbers', () => {
  const menu = {
    ingredients: [{ ingredientId: 'i1', qty: 2 }],
    fixedCostItems: [{ fixedCostItemId: 'f1', qty: 1 }],
    frontStorePrice: 20,
    deliveryPrice: 25,
  };
  const deps = {
    ingredients: [{ id: 'i1', bulkQty: 10, bulkPrice: 10 }], // costPerUnit = 1
    fixedCosts: [{ id: 'f1', bulkQty: 5, bulkPrice: 5 }],     // costPerUnit = 1
    mdr: 0.2,
  };
  const result = calcMenu(menu, deps);
  assert.equal(result.ingredientCost, 2);
  assert.equal(result.fixedCost, 1);
  assert.equal(result.totalCost, 3);
  assert.equal(result.frontProfit, 17);
  assert.equal(result.frontMargin, 85);
  assert.equal(result.deliveryNet, 20);
  assert.equal(result.deliveryProfit, 17);
  assert.equal(result.deliveryMargin, 68);
});

test('calcMenu returns 0 margin when price is 0', () => {
  const menu = { ingredients: [], fixedCostItems: [], frontStorePrice: 0, deliveryPrice: 0 };
  const result = calcMenu(menu, { ingredients: [], fixedCosts: [], mdr: 0.3 });
  assert.equal(result.frontMargin, 0);
  assert.equal(result.deliveryMargin, 0);
});
