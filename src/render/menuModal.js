import { esc } from '../domain/escape.js';
import { fmt, fmtPct } from '../domain/format.js';

function renderOptions(items, selectedId) {
  return items.map(i => `<option value="${esc(i.id)}" ${i.id === selectedId ? 'selected' : ''}>${esc(i.name)} (${esc(i.bulkUnit)})</option>`).join('');
}

export function renderIngRow(ingredients, ingredientId = '', qty = '') {
  const ing = ingredients.find(i => i.id === ingredientId);
  const unit = ing ? ing.bulkUnit : '';
  return `<div class="row-item">
    <select class="ing-select">${renderOptions(ingredients, ingredientId)}</select>
    <input type="number" class="ing-qty" value="${qty}" min="0.001" step="any" placeholder="Qty">
    <span class="unit-label">${esc(unit)}</span>
    <button type="button" class="btn btn-danger btn-sm" data-action="remove-row">✕</button>
  </div>`;
}

export function renderFcRow(fixedCosts, fixedCostItemId = '', qty = '') {
  const fc = fixedCosts.find(f => f.id === fixedCostItemId);
  const unit = fc ? fc.bulkUnit : '';
  return `<div class="row-item">
    <select class="fc-select">${renderOptions(fixedCosts, fixedCostItemId)}</select>
    <input type="number" class="fc-qty" value="${qty}" min="0.001" step="any" placeholder="Qty">
    <span class="unit-label">${esc(unit)}</span>
    <button type="button" class="btn btn-danger btn-sm" data-action="remove-row">✕</button>
  </div>`;
}

export function renderPreview(r, mdr) {
  return `<table style="width:100%;font-size:12px">
    <tr><td>Ingredient Cost</td><td style="text-align:right">฿${fmt(r.ingredientCost)}</td></tr>
    <tr><td>Fixed Cost</td><td style="text-align:right">฿${fmt(r.fixedCost)}</td></tr>
    <tr style="font-weight:600"><td>Total Cost</td><td style="text-align:right">฿${fmt(r.totalCost)}</td></tr>
    <tr><td colspan="2" style="padding-top:6px;color:#aaa;font-size:11px">FRONT STORE</td></tr>
    <tr><td>Profit</td><td style="text-align:right;font-weight:600;color:${r.frontProfit >= 0 ? '#16a34a' : '#dc2626'}">฿${fmt(r.frontProfit)} (${fmtPct(r.frontMargin)})</td></tr>
    <tr><td colspan="2" style="padding-top:6px;color:#aaa;font-size:11px">DELIVERY (MDR ${fmtPct(mdr * 100)})</td></tr>
    <tr><td>Net Revenue</td><td style="text-align:right">฿${fmt(r.deliveryNet)}</td></tr>
    <tr><td>Profit</td><td style="text-align:right;font-weight:600;color:${r.deliveryProfit >= 0 ? '#16a34a' : '#dc2626'}">฿${fmt(r.deliveryProfit)} (${fmtPct(r.deliveryMargin)})</td></tr>
  </table>`;
}
