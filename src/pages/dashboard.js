import * as repo from '../io/repository.js';
import { validateItem } from '../domain/validate.js';
import { calcMenu } from '../domain/calc.js';
import { applyFixedCostToAllMenus, removeFixedCostFromAllMenus } from '../domain/bulkFixedCost.js';
import { renderFixedCostTable, renderFixedCostEditCells } from '../render/fixedCosts.js';
import { renderMenuGrid } from '../render/menus.js';
import { renderIngRow, renderFcRow, renderPreview } from '../render/menuModal.js';
import { wireMdrControl, wireExportImport, wireSyncControls, wireSidebarAndSettings } from './shared/navControls.js';

wireSidebarAndSettings();
wireMdrControl(() => renderMenus());

// === FIXED COST ITEMS ===
const fcBody = document.getElementById('fcBody');
const fcAddForm = document.getElementById('fcAddForm');
const fcError = document.getElementById('fcError');

document.getElementById('showFcAddBtn').onclick = () => { fcAddForm.style.display = 'flex'; };
document.getElementById('cancelFcBtn').onclick = () => { fcAddForm.style.display = 'none'; fcAddForm.reset(); };

function renderFC() {
  fcBody.innerHTML = renderFixedCostTable(repo.getFixedCosts());
}

fcAddForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(fcAddForm));
  const itemData = {
    name: data.name.trim(),
    bulkQty: parseFloat(data.bulkQty),
    bulkUnit: data.bulkUnit.trim(),
    bulkPrice: parseFloat(data.bulkPrice),
  };
  const err = validateItem(itemData);
  if (err) { fcError.textContent = err; return; }
  repo.saveFixedCost({ id: crypto.randomUUID(), ...itemData });
  fcAddForm.reset();
  fcAddForm.style.display = 'none';
  fcError.textContent = '';
  renderFC();
  renderMenus();
});

function startFcEdit(id) {
  const fc = repo.getFixedCosts().find(x => x.id === id);
  if (!fc) return;
  const row = fcBody.querySelector(`tr[data-id="${id}"]`);
  row.classList.add('editing-row');
  row.innerHTML = renderFixedCostEditCells(fc);
}

function saveFcEdit(id, row) {
  const existing = repo.getFixedCosts().find(x => x.id === id);
  const get = name => row.querySelector(`[name="${name}"]`).value.trim();
  const data = {
    name: get('name'),
    bulkUnit: get('bulkUnit'),
    bulkQty: parseFloat(get('bulkQty')),
    bulkPrice: parseFloat(get('bulkPrice')),
  };
  const err = validateItem(data);
  if (err) { alert(err); return; }
  repo.saveFixedCost({ ...existing, ...data, id });
  renderFC();
  renderMenus();
}

function doDeleteFC(id) {
  const usedBy = repo.fixedCostUsedBy(id);
  if (usedBy.length > 0) { alert(`Cannot delete — used by: ${usedBy.join(', ')}`); return; }
  if (confirm('Delete this fixed cost item?')) { repo.deleteFixedCost(id); renderFC(); renderMenus(); }
}

function setAutoAddQty(id, qtyInput) {
  const existing = repo.getFixedCosts().find(x => x.id === id);
  if (!existing) return;
  const v = parseFloat(qtyInput.value);
  const autoAddQty = !isNaN(v) && v >= 0 ? v : 0;
  repo.saveFixedCost({ ...existing, autoAddQty });
  renderFC();
}

async function runBulkFixedCostUpdate(compute) {
  const overlay = document.getElementById('bulkOverlay');
  overlay.classList.add('open');
  const wasSyncConfigured = !!repo.getSyncUrl();
  syncEngine.stop();
  try {
    const now = new Date().toISOString();
    repo.saveMenus(compute(repo.getMenus(), now));
    renderMenus();
  } finally {
    if (wasSyncConfigured) syncEngine.start();
    overlay.classList.remove('open');
  }
}

// --- Bulk action confirm modal ---
const bulkConfirmModal = document.getElementById('bulkConfirmModal');
const bulkConfirmMessage = document.getElementById('bulkConfirmMessage');
let bulkConfirmResolve = null;

function finishBulkConfirm(result) {
  bulkConfirmModal.classList.remove('open');
  const resolve = bulkConfirmResolve;
  bulkConfirmResolve = null;
  resolve?.(result);
}

document.getElementById('bulkConfirmOk').onclick = () => finishBulkConfirm(true);
document.getElementById('bulkConfirmCancel').onclick = () => finishBulkConfirm(false);
bulkConfirmModal.addEventListener('click', e => { if (e.target === bulkConfirmModal) finishBulkConfirm(false); });

function confirmBulkAction(message) {
  bulkConfirmMessage.textContent = message;
  bulkConfirmModal.classList.add('open');
  return new Promise(resolve => { bulkConfirmResolve = resolve; });
}

function showAutoAddTooltip(id) {
  const tip = fcBody.querySelector(`.apply-all-tip[data-tip-id="${id}"]`);
  if (!tip) return;
  tip.style.display = 'block';
  clearTimeout(tip._hideTimer);
  tip._hideTimer = setTimeout(() => { tip.style.display = 'none'; }, 2000);
}

async function applyAllFC(id, qty) {
  if (qty <= 0) { showAutoAddTooltip(id); return; }
  const fc = repo.getFixedCosts().find(x => x.id === id);
  const ok = await confirmBulkAction(`Apply "${fc?.name ?? ''}" (qty ${qty}) to every menu that doesn't already have it?`);
  if (!ok) return;
  runBulkFixedCostUpdate((menus, now) => applyFixedCostToAllMenus(menus, id, qty, now));
}

async function removeAllFC(id) {
  const fc = repo.getFixedCosts().find(x => x.id === id);
  const ok = await confirmBulkAction(`Remove "${fc?.name ?? ''}" from every menu?`);
  if (!ok) return;
  runBulkFixedCostUpdate((menus, now) => removeFixedCostFromAllMenus(menus, id, now));
}

fcBody.addEventListener('change', e => {
  if (e.target.matches('.auto-add-qty')) {
    const id = e.target.closest('tr').dataset.id;
    setAutoAddQty(id, e.target);
  }
});

fcBody.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'edit') startFcEdit(id);
  else if (action === 'delete') doDeleteFC(id);
  else if (action === 'save-edit') saveFcEdit(id, btn.closest('tr'));
  else if (action === 'cancel-edit') renderFC();
  else if (action === 'apply-all') applyAllFC(id, repo.getFixedCosts().find(x => x.id === id)?.autoAddQty || 0);
  else if (action === 'remove-all') removeAllFC(id);
});

// === MENU CARDS ===
const menuGrid = document.getElementById('menuGrid');

function renderMenus() {
  menuGrid.innerHTML = renderMenuGrid(repo.getMenus(), {
    ingredients: repo.getIngredients(),
    fixedCosts: repo.getFixedCosts(),
    mdr: repo.getMDR(),
  });
}

function doDeleteMenu(id) {
  if (confirm('Delete this menu?')) { repo.deleteMenu(id); renderMenus(); }
}

menuGrid.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'edit') openEditMenu(id);
  else if (action === 'delete') doDeleteMenu(id);
});

// === MENU MODAL ===
const modal = document.getElementById('menuModal');
const ingRows = document.getElementById('ingRows');
const fcRows = document.getElementById('fcRows');

function updatePreview() {
  const frontPrice = parseFloat(document.getElementById('frontPrice').value) || 0;
  const deliveryPrice = parseFloat(document.getElementById('deliveryPrice').value) || 0;
  const mdr = repo.getMDR();

  const ingData = [...ingRows.querySelectorAll('.row-item')].map(row => ({
    ingredientId: row.querySelector('.ing-select').value,
    qty: parseFloat(row.querySelector('.ing-qty').value) || 0,
  }));
  const fcData = [...fcRows.querySelectorAll('.row-item')].map(row => ({
    fixedCostItemId: row.querySelector('.fc-select').value,
    qty: parseFloat(row.querySelector('.fc-qty').value) || 0,
  }));

  const tempMenu = { id: '__preview', name: '', ingredients: ingData, fixedCostItems: fcData, frontStorePrice: frontPrice, deliveryPrice };
  const r = calcMenu(tempMenu, { ingredients: repo.getIngredients(), fixedCosts: repo.getFixedCosts(), mdr });
  document.getElementById('previewContent').innerHTML = renderPreview(r, mdr);
}

ingRows.addEventListener('change', e => {
  if (e.target.matches('.ing-select')) {
    const ing = repo.getIngredients().find(i => i.id === e.target.value);
    e.target.closest('.row-item').querySelector('.unit-label').textContent = ing ? ing.bulkUnit : '';
    updatePreview();
  }
});
ingRows.addEventListener('input', e => {
  if (e.target.matches('.ing-qty')) updatePreview();
});
ingRows.addEventListener('click', e => {
  if (e.target.closest('[data-action="remove-row"]')) {
    e.target.closest('.row-item').remove();
    updatePreview();
  }
});

fcRows.addEventListener('change', e => {
  if (e.target.matches('.fc-select')) {
    const fc = repo.getFixedCosts().find(f => f.id === e.target.value);
    e.target.closest('.row-item').querySelector('.unit-label').textContent = fc ? fc.bulkUnit : '';
    updatePreview();
  }
});
fcRows.addEventListener('input', e => {
  if (e.target.matches('.fc-qty')) updatePreview();
});
fcRows.addEventListener('click', e => {
  if (e.target.closest('[data-action="remove-row"]')) {
    e.target.closest('.row-item').remove();
    updatePreview();
  }
});

document.getElementById('addIngRowBtn').onclick = () => {
  const ingredients = repo.getIngredients();
  if (ingredients.length === 0) { alert('Add ingredients first via the Ingredients page.'); return; }
  ingRows.insertAdjacentHTML('beforeend', renderIngRow(ingredients, ingredients[0].id, ''));
  updatePreview();
};

document.getElementById('addFcRowBtn').onclick = () => {
  const fixedCosts = repo.getFixedCosts();
  if (fixedCosts.length === 0) { alert('Add fixed cost items first.'); return; }
  fcRows.insertAdjacentHTML('beforeend', renderFcRow(fixedCosts, fixedCosts[0].id, ''));
  updatePreview();
};

// Quick-add ingredient
const quickAddForm = document.getElementById('quickAddForm');
const quickIngError = document.getElementById('quickIngError');

document.getElementById('quickAddIngBtn').onclick = () => { quickAddForm.style.display = 'block'; };
document.getElementById('cancelQuickIngBtn').onclick = () => {
  quickAddForm.style.display = 'none';
  quickAddForm.querySelectorAll('input').forEach(i => { i.value = ''; });
  quickIngError.textContent = '';
};
document.getElementById('saveQuickIngBtn').onclick = () => {
  const get = name => quickAddForm.querySelector(`[name="${name}"]`).value.trim();
  const data = { name: get('name'), bulkQty: parseFloat(get('bulkQty')), bulkUnit: get('bulkUnit'), bulkPrice: parseFloat(get('bulkPrice')) };
  const err = validateItem(data);
  if (err) { quickIngError.textContent = err; return; }
  const newIng = { id: crypto.randomUUID(), ...data };
  repo.saveIngredient(newIng);
  quickAddForm.querySelectorAll('input').forEach(i => { i.value = ''; });
  quickAddForm.style.display = 'none';
  quickIngError.textContent = '';
  ingRows.insertAdjacentHTML('beforeend', renderIngRow(repo.getIngredients(), newIng.id, ''));
  updatePreview();
};

document.getElementById('frontPrice').addEventListener('input', updatePreview);
document.getElementById('deliveryPrice').addEventListener('input', updatePreview);

function openAddMenu() {
  document.getElementById('menuId').value = '';
  document.getElementById('modalTitle').textContent = 'Add Menu';
  document.getElementById('menuName').value = '';
  ingRows.innerHTML = '';
  const fixedCosts = repo.getFixedCosts();
  const autoAddItems = fixedCosts.filter(fc => (fc.autoAddQty || 0) > 0);
  fcRows.innerHTML = autoAddItems.map(fc => renderFcRow(fixedCosts, fc.id, fc.autoAddQty)).join('');
  document.getElementById('frontPrice').value = '';
  document.getElementById('deliveryPrice').value = '';
  document.getElementById('menuError').textContent = '';
  quickAddForm.style.display = 'none';
  quickIngError.textContent = '';
  document.getElementById('previewContent').innerHTML = '<span style="color:#aaa;font-size:12px">Fill in ingredients and prices to see profit.</span>';
  modal.classList.add('open');
  updatePreview();
}

function openEditMenu(id) {
  const menu = repo.getMenus().find(m => m.id === id);
  if (!menu) return;
  document.getElementById('menuId').value = id;
  document.getElementById('modalTitle').textContent = 'Edit Menu';
  document.getElementById('menuName').value = menu.name;
  const ingredients = repo.getIngredients();
  const fixedCosts = repo.getFixedCosts();
  ingRows.innerHTML = menu.ingredients.map(row => renderIngRow(ingredients, row.ingredientId, row.qty)).join('');
  fcRows.innerHTML = menu.fixedCostItems.map(row => renderFcRow(fixedCosts, row.fixedCostItemId, row.qty)).join('');
  document.getElementById('frontPrice').value = menu.frontStorePrice;
  document.getElementById('deliveryPrice').value = menu.deliveryPrice;
  document.getElementById('menuError').textContent = '';
  quickAddForm.style.display = 'none';
  modal.classList.add('open');
  updatePreview();
}

document.getElementById('addMenuBtn').onclick = openAddMenu;
document.getElementById('cancelMenuBtn').onclick = () => modal.classList.remove('open');
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

document.getElementById('saveMenuBtn').onclick = () => {
  const name = document.getElementById('menuName').value.trim();
  if (!name) { document.getElementById('menuError').textContent = 'Menu name is required.'; return; }

  const ingData = [...ingRows.querySelectorAll('.row-item')].map(row => ({
    ingredientId: row.querySelector('.ing-select').value,
    qty: parseFloat(row.querySelector('.ing-qty').value) || 0,
  })).filter(r => r.qty > 0);

  const fcData = [...fcRows.querySelectorAll('.row-item')].map(row => ({
    fixedCostItemId: row.querySelector('.fc-select').value,
    qty: parseFloat(row.querySelector('.fc-qty').value) || 0,
  })).filter(r => r.qty > 0);

  const frontStorePrice = parseFloat(document.getElementById('frontPrice').value) || 0;
  const deliveryPrice = parseFloat(document.getElementById('deliveryPrice').value) || 0;

  const id = document.getElementById('menuId').value || crypto.randomUUID();
  repo.saveMenu({ id, name, ingredients: ingData, fixedCostItems: fcData, frontStorePrice, deliveryPrice });
  modal.classList.remove('open');
  renderMenus();
};

wireExportImport();
const syncEngine = wireSyncControls({ onSynced: () => { renderFC(); renderMenus(); } });

// Init
renderFC();
renderMenus();
