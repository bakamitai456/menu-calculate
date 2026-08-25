import * as repo from '../io/repository.js';
import { validateItem } from '../domain/validate.js';
import { calcMenu } from '../domain/calc.js';
import { filterMenus } from '../domain/menuFilter.js';
import { renderMenuGrid } from '../render/menus.js';
import { renderIngRow, renderFcRow, renderPreview } from '../render/menuModal.js';
import { renderMsOptions } from '../render/filterBar.js';
import { wireMdrControl, wireExportImport, wireSyncControls, wireSidebarAndSettings } from './shared/navControls.js';

wireSidebarAndSettings();
wireMdrControl(() => renderMenus());

// === MENU CARDS ===
const menuGrid = document.getElementById('menuGrid');
const expandedMenuIds = new Set();
const menuFilters = { name: '', ingredientIds: new Set(), fixedCostIds: new Set() };

function renderMenus() {
  const menus = filterMenus(repo.getMenus(), {
    name: menuFilters.name,
    ingredientIds: [...menuFilters.ingredientIds],
    fixedCostIds: [...menuFilters.fixedCostIds],
  });
  menuGrid.innerHTML = renderMenuGrid(menus, {
    ingredients: repo.getIngredients(),
    fixedCosts: repo.getFixedCosts(),
    mdr: repo.getMDR(),
  }, expandedMenuIds);
}

function doDeleteMenu(id) {
  if (confirm('Delete this menu?')) { repo.deleteMenu(id); renderMenus(); }
}

function doDuplicateMenu(id) {
  const menu = repo.getMenus().find(m => m.id === id);
  if (!menu) return;
  const { id: _oldId, updatedAt: _updatedAt, ...rest } = menu;
  repo.saveMenu({ ...rest, id: crypto.randomUUID(), name: `${menu.name} (Copy)` });
  renderMenus();
}

menuGrid.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'edit') openEditMenu(id);
  else if (action === 'delete') doDeleteMenu(id);
  else if (action === 'duplicate') doDuplicateMenu(id);
  else if (action === 'toggle-details') {
    if (expandedMenuIds.has(id)) expandedMenuIds.delete(id); else expandedMenuIds.add(id);
    renderMenus();
  }
});

// === MENU FILTER BAR ===
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

function updateClearFiltersVisibility() {
  const hasFilters = menuFilters.name !== '' || menuFilters.ingredientIds.size > 0 || menuFilters.fixedCostIds.size > 0;
  clearFiltersBtn.style.display = hasFilters ? '' : 'none';
}

document.getElementById('menuNameFilter').addEventListener('input', e => {
  menuFilters.name = e.target.value;
  updateClearFiltersVisibility();
  renderMenus();
});

function wireMsFilter({ dropdownId, toggleId, searchId, optionsId, countId, getItems, selectedIds }) {
  const dropdown = document.getElementById(dropdownId);
  const toggle = document.getElementById(toggleId);
  const search = document.getElementById(searchId);
  const options = document.getElementById(optionsId);
  const count = document.getElementById(countId);

  function renderOptions() {
    options.innerHTML = renderMsOptions(getItems(), selectedIds, search.value);
  }

  function updateCount() {
    if (selectedIds.size > 0) { count.textContent = selectedIds.size; count.style.display = ''; }
    else { count.style.display = 'none'; }
  }

  toggle.addEventListener('click', () => {
    const willOpen = !dropdown.classList.contains('open');
    document.querySelectorAll('.ms-dropdown.open').forEach(el => el.classList.remove('open'));
    if (willOpen) {
      dropdown.classList.add('open');
      search.value = '';
      renderOptions();
      search.focus();
    }
  });

  search.addEventListener('input', renderOptions);

  options.addEventListener('change', e => {
    if (!e.target.matches('input[type="checkbox"]')) return;
    if (e.target.checked) selectedIds.add(e.target.value); else selectedIds.delete(e.target.value);
    updateCount();
    updateClearFiltersVisibility();
    renderMenus();
  });

  return { renderOptions, updateCount };
}

const ingMsFilter = wireMsFilter({
  dropdownId: 'ingFilterDropdown', toggleId: 'ingFilterToggle', searchId: 'ingFilterSearch',
  optionsId: 'ingFilterOptions', countId: 'ingFilterCount',
  getItems: () => repo.getIngredients(), selectedIds: menuFilters.ingredientIds,
});
const fcMsFilter = wireMsFilter({
  dropdownId: 'fcFilterDropdown', toggleId: 'fcFilterToggle', searchId: 'fcFilterSearch',
  optionsId: 'fcFilterOptions', countId: 'fcFilterCount',
  getItems: () => repo.getFixedCosts(), selectedIds: menuFilters.fixedCostIds,
});

document.addEventListener('click', e => {
  document.querySelectorAll('.ms-dropdown.open').forEach(el => {
    if (!el.contains(e.target)) el.classList.remove('open');
  });
});

clearFiltersBtn.onclick = () => {
  menuFilters.name = '';
  menuFilters.ingredientIds.clear();
  menuFilters.fixedCostIds.clear();
  document.getElementById('menuNameFilter').value = '';
  ingMsFilter.updateCount();
  fcMsFilter.updateCount();
  updateClearFiltersVisibility();
  renderMenus();
};

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
  modal.classList.add('open'); document.getElementById('menuModalBackdrop').classList.add('open');
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
  modal.classList.add('open'); document.getElementById('menuModalBackdrop').classList.add('open');
  updatePreview();
}

document.getElementById('addMenuBtn').onclick = openAddMenu;
document.getElementById('cancelMenuBtn').onclick = () => { modal.classList.remove('open'); document.getElementById('menuModalBackdrop').classList.remove('open'); };
document.getElementById('cancelMenuBtnFooter').onclick = () => { modal.classList.remove('open'); document.getElementById('menuModalBackdrop').classList.remove('open'); };
document.getElementById('menuModalBackdrop').addEventListener('click', () => {
  modal.classList.remove('open');
  document.getElementById('menuModalBackdrop').classList.remove('open');
});

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
  modal.classList.remove('open'); document.getElementById('menuModalBackdrop').classList.remove('open');
  renderMenus();
};

// === FLOATING QUICK-ADD BAR ===
document.getElementById('fabAddMenuBtn').onclick = openAddMenu;

wireExportImport();
wireSyncControls({ onDownloaded: () => { renderMenus(); } });

// Init
renderMenus();
