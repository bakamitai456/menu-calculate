import { esc } from '../domain/escape.js';
import { fmt } from '../domain/format.js';
import { costPerUnit } from '../domain/calc.js';

export function renderFixedCostRow(fc) {
  const cpu = costPerUnit(fc);
  return `<tr data-id="${esc(fc.id)}">
    <td>${esc(fc.name)}</td><td>${fc.bulkQty}</td><td>${esc(fc.bulkUnit)}</td>
    <td class="text-right">${fmt(fc.bulkPrice)}</td>
    <td class="text-right">${fmt(cpu)}</td>
    <td class="text-right">
      <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(fc.id)}">Edit</button>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(fc.id)}">Delete</button>
    </td>
  </tr>`;
}

export function renderFixedCostTable(list) {
  return list.length === 0
    ? '<tr><td colspan="6" style="color:#aaa;padding:16px">No fixed cost items yet.</td></tr>'
    : list.map(renderFixedCostRow).join('');
}

export function renderFixedCostEditCells(fc) {
  return `
    <td><input name="name" value="${esc(fc.name)}" style="width:120px"></td>
    <td><input name="bulkQty" type="number" value="${fc.bulkQty}" min="0.001" step="any" style="width:70px"></td>
    <td><input name="bulkUnit" value="${esc(fc.bulkUnit)}" style="width:60px"></td>
    <td><input name="bulkPrice" type="number" value="${fc.bulkPrice}" min="0" step="any" style="width:80px"></td>
    <td></td>
    <td class="text-right">
      <button class="btn btn-primary btn-sm" data-action="save-edit" data-id="${esc(fc.id)}">Save</button>
      <button class="btn btn-ghost btn-sm" data-action="cancel-edit">Cancel</button>
    </td>`;
}
