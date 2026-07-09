import { KEYS } from '../io/keys.js';

export function triggerDownload(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function promptForFile() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => resolve(input.files[0] || null);
    input.click();
  });
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function writeBackupToStorage(data) {
  localStorage.setItem(KEYS.ingredients, JSON.stringify(data.ingredients));
  localStorage.setItem(KEYS.fixedCosts, JSON.stringify(data.fixedCostItems));
  localStorage.setItem(KEYS.menus, JSON.stringify(data.menus));
  localStorage.setItem(KEYS.mdr, data.mdr);
}

export function reloadPage() {
  location.reload();
}
