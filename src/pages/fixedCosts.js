import * as repo from '../io/repository.js';
import { validateItem } from '../domain/validate.js';
import { applyFixedCostToAllMenus, removeFixedCostFromAllMenus } from '../domain/bulkFixedCost.js';
import { renderFixedCostTable, renderFixedCostEditCells } from '../render/fixedCosts.js';
import { wireMdrControl, wireExportImport, wireSyncControls, wireSidebarAndSettings } from './shared/navControls.js';

const fcBody = document.getElementById('fcBody');
const fcAddForm = document.getElementById('fcAddForm');
const fcError = document.getElementById('fcError');

document.getElementById('showFcAddBtn').onclick = () => { fcAddForm.style.display = 'flex'; fcError.textContent = ''; };
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
}

function doDeleteFC(id) {
  const usedBy = repo.fixedCostUsedBy(id);
  if (usedBy.length > 0) { alert(`Cannot delete — used by: ${usedBy.join(', ')}`); return; }
  if (confirm('Delete this fixed cost item?')) { repo.deleteFixedCost(id); renderFC(); }
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
  try {
    const now = new Date().toISOString();
    repo.saveMenus(compute(repo.getMenus(), now));
  } finally {
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

wireSidebarAndSettings();
wireMdrControl();
wireExportImport();
wireSyncControls({ onDownloaded: renderFC });

renderFC();
