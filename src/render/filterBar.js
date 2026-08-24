import { esc } from '../domain/escape.js';

export function renderMsOptions(items, selectedIds, searchTerm = '') {
  const term = searchTerm.trim().toLowerCase();
  const matches = term ? items.filter(i => i.name.toLowerCase().includes(term)) : items;
  if (matches.length === 0) return '<div class="ms-empty">No matches</div>';
  return matches.map(i => `<label class="ms-option">
    <input type="checkbox" value="${esc(i.id)}" ${selectedIds.has(i.id) ? 'checked' : ''}>
    <span>${esc(i.name)}</span>
  </label>`).join('');
}
