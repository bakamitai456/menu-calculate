import { esc } from '../domain/escape.js';
import { fmt } from '../domain/format.js';
import { costPerUnit } from '../domain/calc.js';

function renderAutoAddCell(fc) {
  const qty = fc.autoAddQty || 0;
  return `<td style="position:relative">
    <input type="number" class="auto-add-qty" min="0" step="any" value="${qty}" style="width:60px">
    <span class="auto-add-tip" style="display:none;position:absolute;top:100%;left:0;margin-top:4px;background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:11px;white-space:nowrap;z-index:10">Set a qty to enable Apply all</span>
  </td>`;
}

export function renderFixedCostRow(fc) {
  const cpu = costPerUnit(fc);
  const autoAddQty = fc.autoAddQty || 0;
  const applyAllStyle = autoAddQty > 0 ? '' : 'opacity:.5;cursor:not-allowed';
  return `<tr data-id="${esc(fc.id)}">
    <td>${esc(fc.name)}</td><td>${fc.bulkQty}</td><td>${esc(fc.bulkUnit)}</td>
    <td class="text-right">${fmt(fc.bulkPrice)}</td>
    <td class="text-right">${fmt(cpu)}</td>
    ${renderAutoAddCell(fc)}
    <td class="text-right">
      <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(fc.id)}">Edit</button>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(fc.id)}">Delete</button><br>
      <button class="btn btn-ghost btn-sm" data-action="apply-all" data-id="${esc(fc.id)}" style="${applyAllStyle}">Apply all</button>
      <button class="btn btn-ghost btn-sm" data-action="remove-all" data-id="${esc(fc.id)}">Remove all</button>
    </td>
  </tr>`;
}

export function renderFixedCostTable(list) {
  return list.length === 0
    ? '<tr><td colspan="7" style="color:#aaa;padding:16px">No fixed cost items yet.</td></tr>'
    : list.map(renderFixedCostRow).join('');
}

export function renderFixedCostEditCells(fc) {
  return `
    <td><input name="name" value="${esc(fc.name)}" style="width:120px"></td>
    <td><input name="bulkQty" type="number" value="${fc.bulkQty}" min="0.001" step="any" style="width:70px"></td>
    <td><input name="bulkUnit" value="${esc(fc.bulkUnit)}" style="width:60px"></td>
    <td><input name="bulkPrice" type="number" value="${fc.bulkPrice}" min="0" step="any" style="width:80px"></td>
    <td></td>
    ${renderAutoAddCell(fc)}
    <td class="text-right">
      <button class="btn btn-primary btn-sm" data-action="save-edit" data-id="${esc(fc.id)}">Save</button>
      <button class="btn btn-ghost btn-sm" data-action="cancel-edit">Cancel</button>
    </td>`;
}
