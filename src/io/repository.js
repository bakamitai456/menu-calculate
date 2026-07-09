import { KEYS } from './keys.js';
import * as storage from './storage.js';
import { upsertById, removeById } from '../records/listOps.js';
import { addTombstone } from '../records/tombstones.js';

const nowISO = () => new Date().toISOString();

function saveTombstone(id, type, now) {
  storage.saveList(KEYS.tombstones, addTombstone(getTombstones(), id, type, now));
}

// --- MDR ---
export function getMDR() {
  const v = storage.getItem(KEYS.mdr);
  return v !== null ? parseFloat(v) : 0.321;
}
export function setMDR(rate) {
  storage.setItem(KEYS.mdr, rate);
}

// --- Ingredients ---
export function getIngredients() {
  return storage.getList(KEYS.ingredients);
}
export function saveIngredient(item, now = nowISO()) {
  storage.saveList(KEYS.ingredients, upsertById(getIngredients(), { ...item, updatedAt: now }));
}
export function deleteIngredient(id, now = nowISO()) {
  saveTombstone(id, 'ingredient', now);
  storage.saveList(KEYS.ingredients, removeById(getIngredients(), id));
}

// --- Fixed Cost Items ---
export function getFixedCosts() {
  return storage.getList(KEYS.fixedCosts);
}
export function saveFixedCost(item, now = nowISO()) {
  storage.saveList(KEYS.fixedCosts, upsertById(getFixedCosts(), { ...item, updatedAt: now }));
}
export function deleteFixedCost(id, now = nowISO()) {
  saveTombstone(id, 'fixedCost', now);
  storage.saveList(KEYS.fixedCosts, removeById(getFixedCosts(), id));
}

// --- Menus ---
export function getMenus() {
  return storage.getList(KEYS.menus);
}
export function saveMenu(menu, now = nowISO()) {
  storage.saveList(KEYS.menus, upsertById(getMenus(), { ...menu, updatedAt: now }));
}
export function deleteMenu(id, now = nowISO()) {
  saveTombstone(id, 'menu', now);
  storage.saveList(KEYS.menus, removeById(getMenus(), id));
}

// --- Tombstones ---
export function getTombstones() {
  return storage.getList(KEYS.tombstones);
}

// --- Sync accessors ---
export function getSyncUrl() {
  return storage.getItem(KEYS.syncUrl) || '';
}
export function setSyncUrl(url) {
  storage.setItem(KEYS.syncUrl, url.trim());
}
export function getSyncInterval() {
  const v = parseInt(storage.getItem(KEYS.syncInterval), 10);
  return Number.isFinite(v) && v >= 3 ? v : 30;
}
export function setSyncInterval(seconds) {
  storage.setItem(KEYS.syncInterval, Math.max(3, Math.round(seconds)));
}
export function getLastSyncAt() {
  return storage.getItem(KEYS.lastSyncAt) || '1970-01-01T00:00:00.000Z';
}
export function setLastSyncAt(ts) {
  storage.setItem(KEYS.lastSyncAt, ts);
}

// --- Usage guards ---
export function ingredientUsedBy(id) {
  return getMenus().filter(m => m.ingredients.some(i => i.ingredientId === id)).map(m => m.name);
}
export function fixedCostUsedBy(id) {
  return getMenus().filter(m => m.fixedCostItems.some(f => f.fixedCostItemId === id)).map(m => m.name);
}

// --- Bulk apply (used by the sync engine to write a merged payload) ---
export function applyMerged(merged) {
  storage.saveList(KEYS.ingredients, merged.ingredients);
  storage.saveList(KEYS.fixedCosts, merged.fixedCostItems);
  storage.saveList(KEYS.menus, merged.menus);
  storage.saveList(KEYS.tombstones, merged.tombstones);
}
