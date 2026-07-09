import * as repo from '../io/repository.js';
import { validateItem } from '../domain/validate.js';
import { renderIngredientTable, renderIngredientEditCells } from '../render/ingredients.js';
import { wireMdrControl, wireExportImport, wireSyncControls } from './shared/navControls.js';

const tbody = document.getElementById('ingBody');
const addForm = document.getElementById('addForm');
const addError = document.getElementById('addError');

function renderIngredients() {
  tbody.innerHTML = renderIngredientTable(repo.getIngredients());
}

document.getElementById('showAddBtn').onclick = () => {
  addForm.style.display = 'flex';
  addError.textContent = '';
};
document.getElementById('cancelAddBtn').onclick = () => {
  addForm.style.display = 'none';
  addForm.reset();
};

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(addForm));
  const itemData = {
    name: data.name.trim(),
    bulkQty: parseFloat(data.bulkQty),
    bulkUnit: data.bulkUnit.trim(),
    bulkPrice: parseFloat(data.bulkPrice),
  };
  const err = validateItem(itemData);
  if (err) { addError.textContent = err; return; }
  repo.saveIngredient({ id: crypto.randomUUID(), ...itemData });
  addForm.reset();
  addForm.style.display = 'none';
  addError.textContent = '';
  renderIngredients();
});

function startEdit(id) {
  const ing = repo.getIngredients().find(x => x.id === id);
  if (!ing) return;
  tbody.querySelector(`tr[data-id="${id}"]`).innerHTML = renderIngredientEditCells(ing);
}

function saveEdit(id, row) {
  const get = name => row.querySelector(`[name="${name}"]`).value.trim();
  const data = {
    name: get('name'),
    bulkUnit: get('bulkUnit'),
    bulkQty: parseFloat(get('bulkQty')),
    bulkPrice: parseFloat(get('bulkPrice')),
  };
  const err = validateItem(data);
  if (err) { alert(err); return; }
  repo.saveIngredient({ id, ...data });
  renderIngredients();
}

function doDelete(id) {
  const usedBy = repo.ingredientUsedBy(id);
  if (usedBy.length > 0) {
    alert(`Cannot delete — used by: ${usedBy.join(', ')}`);
    return;
  }
  if (confirm('Delete this ingredient?')) {
    repo.deleteIngredient(id);
    renderIngredients();
  }
}

tbody.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'edit') startEdit(id);
  else if (action === 'delete') doDelete(id);
  else if (action === 'save-edit') saveEdit(id, btn.closest('tr'));
  else if (action === 'cancel-edit') renderIngredients();
});

wireMdrControl();
wireExportImport();
wireSyncControls({ onSynced: renderIngredients });

renderIngredients();
