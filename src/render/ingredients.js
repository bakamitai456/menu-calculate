import { esc } from '../domain/escape.js';
import { fmt } from '../domain/format.js';
import { costPerUnit } from '../domain/calc.js';

export function renderIngredientRow(ing) {
  const cpu = costPerUnit(ing);
  return `<tr data-id="${esc(ing.id)}">
    <td>${esc(ing.name)}</td>
    <td>${ing.bulkQty}</td>
    <td>${esc(ing.bulkUnit)}</td>
    <td class="text-right">${fmt(ing.bulkPrice)}</td>
    <td class="text-right">${fmt(cpu)}</td>
    <td class="text-right">
      <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(ing.id)}">Edit</button>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(ing.id)}">Delete</button>
    </td>
  </tr>`;
}

export function renderIngredientTable(list) {
  return list.length === 0
    ? '<tr><td colspan="6" style="color:#aaa;padding:16px">No ingredients yet.</td></tr>'
    : list.map(renderIngredientRow).join('');
}

export function renderIngredientEditCells(ing) {
  return `
    <td><input name="name" value="${esc(ing.name)}" style="width:120px"></td>
    <td><input name="bulkQty" type="number" value="${ing.bulkQty}" min="0.001" step="any" style="width:70px"></td>
    <td><input name="bulkUnit" value="${esc(ing.bulkUnit)}" style="width:60px"></td>
    <td><input name="bulkPrice" type="number" value="${ing.bulkPrice}" min="0" step="any" style="width:80px"></td>
    <td></td>
    <td class="text-right">
      <button class="btn btn-primary btn-sm" data-action="save-edit" data-id="${esc(ing.id)}">Save</button>
      <button class="btn btn-ghost btn-sm" data-action="cancel-edit">Cancel</button>
    </td>`;
}
