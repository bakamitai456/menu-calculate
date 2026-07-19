import * as repo from '../../io/repository.js';
import { buildBackupPayload, serializeBackup, validateBackupShape, parseBackupJSON, buildDatedFilename } from '../../importExport/serialize.js';
import { triggerDownload, promptForFile, readFileAsText, writeBackupToStorage, reloadPage } from '../../importExport/io.js';
import { downloadFromRemote, uploadToRemote } from '../../sync/actions.js';
import { buildLocalPayload } from '../../sync/payload.js';
import { fetchRemote, pushRemote } from '../../sync/io.js';

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

export function wireSidebarAndSettings() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  toggleBtn.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    toggleBtn.textContent = collapsed ? '›' : '‹';
    toggleBtn.title = collapsed ? 'Expand' : 'Collapse';
  });

  const backdrop = document.getElementById('settingsBackdrop');
  const panel = document.getElementById('settingsPanel');
  const openBtn = document.getElementById('settingsOpenBtn');
  const closeBtn = document.getElementById('settingsCloseBtn');
  const open = () => { backdrop.classList.add('open'); panel.classList.add('open'); };
  const close = () => { backdrop.classList.remove('open'); panel.classList.remove('open'); };
  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
}

export function wireSyncControls({ onDownloaded }) {
  const overlay = document.getElementById('syncOverlay');
  const overlayText = document.getElementById('syncOverlayText');

  function onStatusChange(status) {
    if (status === 'downloading') {
      overlayText.textContent = 'Downloading…';
      overlay.classList.add('open');
    } else if (status === 'uploading') {
      overlayText.textContent = 'Uploading…';
      overlay.classList.add('open');
    } else if (status === 'error') {
      overlay.classList.remove('open');
      alert('Sync failed. Please check the URL and your connection, then try again.');
    } else {
      overlay.classList.remove('open');
    }
  }

  const syncDeps = {
    getSyncUrl: repo.getSyncUrl,
    buildLocalPayload: () => buildLocalPayload({
      ingredients: repo.getIngredients(),
      fixedCostItems: repo.getFixedCosts(),
      menus: repo.getMenus(),
      tombstones: repo.getTombstones(),
    }),
    applyRemotePayload: repo.applyRemotePayload,
    fetchRemote,
    pushRemote,
    onStatusChange,
    onDownloaded,
  };

  const syncUrlInput = document.getElementById('syncUrlInput');
  syncUrlInput.value = repo.getSyncUrl();
  syncUrlInput.addEventListener('change', () => {
    repo.setSyncUrl(syncUrlInput.value.trim());
  });
  document.getElementById('syncDownloadBtn').onclick = () => downloadFromRemote(syncDeps);
  document.getElementById('syncUploadBtn').onclick = () => uploadToRemote(syncDeps);
}
