import { esc } from '../domain/escape.js';
import { fmt } from '../domain/format.js';
import { costPerUnit } from '../domain/calc.js';

function renderActionsCell(fc) {
  const autoAddQty = fc.autoAddQty || 0;
  const applyAllStyle = autoAddQty > 0 ? '' : 'color:rgba(42,31,22,.3)';
  return `<td class="text-right">
    <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(fc.id)}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(fc.id)}">Delete</button>
      </div>
      <div style="display:flex;gap:6px;position:relative">
        <button class="btn btn-ghost btn-sm" data-action="apply-all" data-id="${esc(fc.id)}" style="${applyAllStyle}">Apply all</button>
        <span class="apply-all-tip" data-tip-id="${esc(fc.id)}" style="display:none">Set an Auto-Add Qty above 0 first</span>
        <button class="btn btn-ghost btn-sm" data-action="remove-all" data-id="${esc(fc.id)}">Remove all</button>
      </div>
    </div>
  </td>`;
}

export function renderFixedCostRow(fc) {
  const cpu = costPerUnit(fc);
  const autoAddQty = fc.autoAddQty || 0;
  return `<tr data-id="${esc(fc.id)}">
    <td style="font-weight:600">${esc(fc.name)}</td>
    <td class="text-right">${fc.bulkQty}</td>
    <td style="color:rgba(42,31,22,.55)">${esc(fc.bulkUnit)}</td>
    <td class="text-right">฿${fmt(fc.bulkPrice)}</td>
    <td class="text-right" style="font-weight:700">฿${fmt(cpu)}</td>
    <td class="text-right"><input type="number" class="auto-add-qty" min="0" step="any" value="${autoAddQty}" style="width:70px;text-align:right"></td>
    ${renderActionsCell(fc)}
  </tr>`;
}

export function renderFixedCostTable(list) {
  return list.length === 0
    ? '<tr><td colspan="7" style="color:rgba(42,31,22,.4);padding:16px">No fixed cost items yet.</td></tr>'
    : list.map(renderFixedCostRow).join('');
}

export function renderFixedCostEditCells(fc) {
  return `
    <td colspan="7">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input name="name" value="${esc(fc.name)}" placeholder="Name" style="flex:1;min-width:120px">
        <input name="bulkQty" type="number" value="${fc.bulkQty}" min="0.001" step="any" placeholder="Qty" style="width:80px">
        <input name="bulkUnit" value="${esc(fc.bulkUnit)}" placeholder="Unit" style="width:70px">
        <input name="bulkPrice" type="number" value="${fc.bulkPrice}" min="0" step="any" placeholder="Price" style="width:90px">
        <button class="btn btn-primary btn-sm" data-action="save-edit" data-id="${esc(fc.id)}">Save</button>
        <button class="btn btn-ghost btn-sm" data-action="cancel-edit">Cancel</button>
      </div>
    </td>`;
}
