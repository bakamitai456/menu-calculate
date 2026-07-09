import { esc } from '../domain/escape.js';
import { fmt, fmtPct } from '../domain/format.js';
import { calcMenu, costPerUnit } from '../domain/calc.js';

export function profitClass(n) {
  return n >= 0 ? 'profit-pos' : 'profit-neg';
}

export function renderMenuCard(menu, { ingredients, fixedCosts, mdr }) {
  const r = calcMenu(menu, { ingredients, fixedCosts, mdr });
  const ingLines = menu.ingredients.map(row => {
    const ing = ingredients.find(i => i.id === row.ingredientId);
    if (!ing) return '';
    return `<tr><td>${esc(ing.name)} × ${row.qty} ${esc(ing.bulkUnit)}</td><td>฿${fmt(costPerUnit(ing) * row.qty)}</td></tr>`;
  }).join('');
  const fcLines = menu.fixedCostItems.map(row => {
    const fc = fixedCosts.find(f => f.id === row.fixedCostItemId);
    if (!fc) return '';
    return `<tr><td>${esc(fc.name)} × ${row.qty} ${esc(fc.bulkUnit)}</td><td>฿${fmt(costPerUnit(fc) * row.qty)}</td></tr>`;
  }).join('');

  return `<div class="menu-card" data-id="${esc(menu.id)}">
    <h3>${esc(menu.name)}
      <span class="card-actions">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(menu.id)}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(menu.id)}">Delete</button>
      </span>
    </h3>
    <table class="cost-table">
      <tr><td colspan="2" style="color:#aaa;font-size:11px;padding-bottom:2px">INGREDIENTS</td></tr>
      ${ingLines}
      <tr><td colspan="2" style="color:#aaa;font-size:11px;padding:4px 0 2px">FIXED COSTS</td></tr>
      ${fcLines}
      <tr class="cost-total"><td>Total Cost</td><td>฿${fmt(r.totalCost)}</td></tr>
    </table>
    <table class="profit-table">
      <thead><tr><th>Channel</th><th>Price</th><th>Net</th><th>Profit</th><th>Margin</th></tr></thead>
      <tbody>
        <tr>
          <td>Front Store</td>
          <td>฿${fmt(menu.frontStorePrice)}</td>
          <td>฿${fmt(menu.frontStorePrice)}</td>
          <td class="${profitClass(r.frontProfit)}">฿${fmt(r.frontProfit)}</td>
          <td class="${profitClass(r.frontMargin)}">${fmtPct(r.frontMargin)}</td>
        </tr>
        <tr>
          <td>Delivery</td>
          <td>฿${fmt(menu.deliveryPrice)}</td>
          <td>฿${fmt(r.deliveryNet)}</td>
          <td class="${profitClass(r.deliveryProfit)}">฿${fmt(r.deliveryProfit)}</td>
          <td class="${profitClass(r.deliveryMargin)}">${fmtPct(r.deliveryMargin)}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

export function renderMenuGrid(menus, deps) {
  return menus.length === 0
    ? '<p style="color:#aaa">No menus yet. Click "+ Add Menu" to get started.</p>'
    : menus.map(menu => renderMenuCard(menu, deps)).join('');
}
