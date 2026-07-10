import { esc } from '../domain/escape.js';
import { fmt } from '../domain/format.js';
import { costPerUnit } from '../domain/calc.js';

export function renderIngredientRow(ing, usedInCount = 0) {
  const cpu = costPerUnit(ing);
  const usedInLabel = usedInCount === 0 ? '—' : `used in ${usedInCount} ${usedInCount === 1 ? 'menu' : 'menus'}`;
  return `<tr data-id="${esc(ing.id)}">
    <td style="font-weight:600">${esc(ing.name)}</td>
    <td class="text-right">${ing.bulkQty}</td>
    <td style="color:rgba(42,31,22,.55)">${esc(ing.bulkUnit)}</td>
    <td class="text-right">฿${fmt(ing.bulkPrice)}</td>
    <td class="text-right" style="font-weight:700">฿${fmt(cpu)}</td>
    <td style="color:rgba(42,31,22,.45);font-size:12px">${usedInLabel}</td>
    <td class="text-right">
      <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(ing.id)}">Edit</button>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(ing.id)}">Delete</button>
    </td>
  </tr>`;
}

export function renderIngredientTable(list, usedInCounts = new Map()) {
  return list.length === 0
    ? '<tr><td colspan="7" style="color:rgba(42,31,22,.4);padding:16px">No ingredients yet.</td></tr>'
    : list.map(ing => renderIngredientRow(ing, usedInCounts.get(ing.id) || 0)).join('');
}

export function renderIngredientEditCells(ing) {
  return `
    <td colspan="7">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input name="name" value="${esc(ing.name)}" placeholder="Name" style="flex:1;min-width:120px">
        <input name="bulkQty" type="number" value="${ing.bulkQty}" min="0.001" step="any" placeholder="Qty" style="width:80px">
        <input name="bulkUnit" value="${esc(ing.bulkUnit)}" placeholder="Unit" style="width:70px">
        <input name="bulkPrice" type="number" value="${ing.bulkPrice}" min="0" step="any" placeholder="Price" style="width:90px">
        <button class="btn btn-primary btn-sm" data-action="save-edit" data-id="${esc(ing.id)}">Save</button>
        <button class="btn btn-ghost btn-sm" data-action="cancel-edit">Cancel</button>
      </div>
    </td>`;
}
