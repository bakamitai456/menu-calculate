export function buildBackupPayload(ingredients, fixedCostItems, menus, mdr) {
  return { version: 1, ingredients, fixedCostItems, menus, mdr };
}

export function serializeBackup(payload) {
  return JSON.stringify(payload, null, 2);
}

export function parseBackupJSON(text) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, error: 'Invalid file — could not read JSON.' };
  }
}

export function validateBackupShape(data) {
  if (
    !Array.isArray(data.ingredients) ||
    !Array.isArray(data.fixedCostItems) ||
    !Array.isArray(data.menus) ||
    typeof data.mdr !== 'number' ||
    !isFinite(data.mdr)
  ) {
    return 'Invalid backup file — missing required fields.';
  }
  if (data.version !== 1) return 'Unsupported backup version.';
  return null;
}

export function buildDatedFilename(dateStr) {
  return `menu-calculator-backup-${dateStr}.json`;
}
