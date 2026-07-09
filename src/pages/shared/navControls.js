import * as repo from '../../io/repository.js';
import { buildBackupPayload, serializeBackup, validateBackupShape, parseBackupJSON, buildDatedFilename } from '../../importExport/serialize.js';
import { triggerDownload, promptForFile, readFileAsText, writeBackupToStorage, reloadPage } from '../../importExport/io.js';
import { createSyncEngine } from '../../sync/engine.js';
import { createConflictModalController } from '../../ui/conflictModal.js';
import { buildLocalPayload } from '../../sync/payload.js';
import { fetchRemote, pushRemote } from '../../sync/io.js';
import { merge } from '../../sync/merge.js';

export function wireMdrControl(onChange) {
  const mdrInput = document.getElementById('mdrInput');
  mdrInput.value = (repo.getMDR() * 100).toFixed(1);
  mdrInput.addEventListener('change', () => {
    const v = parseFloat(mdrInput.value);
    if (!isNaN(v) && v >= 0 && v <= 100) { repo.setMDR(v / 100); onChange?.(); }
    else mdrInput.value = (repo.getMDR() * 100).toFixed(1);
  });
}

export function wireExportImport() {
  document.getElementById('exportBtn').onclick = () => {
    const payload = buildBackupPayload(repo.getIngredients(), repo.getFixedCosts(), repo.getMenus(), repo.getMDR());
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(buildDatedFilename(dateStr), serializeBackup(payload));
  };

  document.getElementById('importBtn').onclick = async () => {
    const file = await promptForFile();
    if (!file) return;
    const text = await readFileAsText(file);
    const { ok, data, error } = parseBackupJSON(text);
    if (!ok) { alert(error); return; }
    const shapeError = validateBackupShape(data);
    if (shapeError) { alert(shapeError); return; }
    if (!confirm('This will replace all current data. Continue?')) return;
    writeBackupToStorage(data);
    reloadPage();
  };
}

export function wireSyncControls({ onSynced }) {
  function setSyncStatus(status) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    el.dataset.status = status;
    const labels = { idle: 'Synced', syncing: 'Syncing...', conflict: 'Conflict', error: 'Error' };
    el.querySelector('.sync-status-text').textContent = labels[status] || status;
  }

  const resolveConflicts = createConflictModalController({
    modal: document.getElementById('conflictModal'),
    counter: document.getElementById('conflictCounter'),
    localEl: document.getElementById('conflictLocal'),
    remoteEl: document.getElementById('conflictRemote'),
    keepLocalBtn: document.getElementById('conflictKeepLocal'),
    keepRemoteBtn: document.getElementById('conflictKeepRemote'),
  });

  const syncEngine = createSyncEngine({
    getSyncUrl: repo.getSyncUrl,
    getLastSyncAt: repo.getLastSyncAt,
    setLastSyncAt: repo.setLastSyncAt,
    getSyncInterval: repo.getSyncInterval,
    setSyncInterval: repo.setSyncInterval,
    buildLocalPayload: () => buildLocalPayload({
      ingredients: repo.getIngredients(),
      fixedCostItems: repo.getFixedCosts(),
      menus: repo.getMenus(),
      tombstones: repo.getTombstones(),
    }),
    applyMerged: repo.applyMerged,
    fetchRemote,
    pushRemote,
    merge,
    onStatusChange: setSyncStatus,
    onConflict: resolveConflicts,
    onSynced,
  });

  const syncUrlInput = document.getElementById('syncUrlInput');
  syncUrlInput.value = repo.getSyncUrl();
  syncUrlInput.addEventListener('change', () => {
    const url = syncUrlInput.value.trim();
    repo.setSyncUrl(url);
    url ? syncEngine.start() : syncEngine.stop();
  });
  document.getElementById('syncNowBtn').onclick = () => syncEngine.syncOnce();
  if (repo.getSyncUrl()) syncEngine.start();

  const syncIntervalInput = document.getElementById('syncIntervalInput');
  syncIntervalInput.value = repo.getSyncInterval();
  syncIntervalInput.addEventListener('change', () => {
    const seconds = parseInt(syncIntervalInput.value, 10);
    if (!Number.isFinite(seconds)) return;
    syncEngine.setIntervalSeconds(seconds);
    syncIntervalInput.value = repo.getSyncInterval();
  });

  return syncEngine;
}
