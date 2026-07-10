import { esc } from '../domain/escape.js';
import { fmt, fmtPct } from '../domain/format.js';
import { calcMenu, costPerUnit } from '../domain/calc.js';

export function profitClass(n) {
  return n >= 0 ? 'profit-pos' : 'profit-neg';
}

function channelBlock(label, price, profit, margin) {
  const sign = profit >= 0 ? '+' : '-';
  return `<div>
    <div class="menu-card-channel-label">${esc(label)} · ฿${fmt(price)}</div>
    <div class="menu-card-profit ${profitClass(profit)}">${sign}฿${fmt(Math.abs(profit))} <span class="margin">(${fmtPct(margin)})</span></div>
  </div>`;
}

export function renderMenuCard(menu, { ingredients, fixedCosts, mdr }, isExpanded = false) {
  const r = calcMenu(menu, { ingredients, fixedCosts, mdr });
  const ingLines = menu.ingredients.map(row => {
    const ing = ingredients.find(i => i.id === row.ingredientId);
    if (!ing) return '';
    return `<div class="menu-card-details-line"><span>${esc(ing.name)} × ${row.qty} ${esc(ing.bulkUnit)}</span><span>฿${fmt(costPerUnit(ing) * row.qty)}</span></div>`;
  }).join('');
  const fcLines = menu.fixedCostItems.map(row => {
    const fc = fixedCosts.find(f => f.id === row.fixedCostItemId);
    if (!fc) return '';
    return `<div class="menu-card-details-line"><span>${esc(fc.name)} × ${row.qty} ${esc(fc.bulkUnit)}</span><span>฿${fmt(costPerUnit(fc) * row.qty)}</span></div>`;
  }).join('');

  return `<div class="menu-card" data-id="${esc(menu.id)}">
    <div class="menu-card-header">
      <div class="menu-card-name">${esc(menu.name)}</div>
      <div class="menu-card-actions">
        <button class="btn btn-ghost btn-sm" data-action="toggle-details" data-id="${esc(menu.id)}">${isExpanded ? '▾' : '▸'} Details</button>
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(menu.id)}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(menu.id)}">Delete</button>
      </div>
    </div>
    <div class="menu-card-total">
      <span class="menu-card-total-label">Total Cost</span>
      <span class="menu-card-total-value">฿${fmt(r.totalCost)}</span>
    </div>
    <div class="menu-card-channels">
      ${channelBlock('Front Store', menu.frontStorePrice, r.frontProfit, r.frontMargin)}
      ${channelBlock('Delivery', menu.deliveryPrice, r.deliveryProfit, r.deliveryMargin)}
    </div>
    <div class="menu-card-details" style="${isExpanded ? '' : 'display:none'}">
      <div class="menu-card-details-label">Ingredients</div>
      ${ingLines}
      <div class="menu-card-details-label" style="margin-top:10px">Fixed Costs</div>
      ${fcLines}
      <div class="menu-card-details-total"><span>Total Cost</span><span>฿${fmt(r.totalCost)}</span></div>
    </div>
  </div>`;
}

export function renderMenuGrid(menus, deps, expandedIds = new Set()) {
  return menus.length === 0
    ? '<p style="color:rgba(42,31,22,.4)">No menus yet. Click "+ Add Menu" to get started.</p>'
    : menus.map(menu => renderMenuCard(menu, deps, expandedIds.has(menu.id))).join('');
}
