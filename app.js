// app.js
const KEYS = {
  ingredients: 'mc_ingredients',
  fixedCosts: 'mc_fixed_cost_items',
  menus: 'mc_menus',
  mdr: 'mc_mdr',
};

const Storage = {
  // --- MDR ---
  getMDR() {
    const v = localStorage.getItem(KEYS.mdr);
    return v !== null ? parseFloat(v) : 0.321;
  },
  setMDR(rate) {
    localStorage.setItem(KEYS.mdr, rate);
  },

  // --- Generic CRUD helpers ---
  _getList(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  _saveList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  },

  // --- Ingredients ---
  getIngredients() { return this._getList(KEYS.ingredients); },
  saveIngredient(item) {
    const list = this.getIngredients();
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    this._saveList(KEYS.ingredients, list);
  },
  deleteIngredient(id) {
    this._saveList(KEYS.ingredients, this.getIngredients().filter(x => x.id !== id));
  },

  // --- Fixed Cost Items ---
  getFixedCosts() { return this._getList(KEYS.fixedCosts); },
  saveFixedCost(item) {
    const list = this.getFixedCosts();
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    this._saveList(KEYS.fixedCosts, list);
  },
  deleteFixedCost(id) {
    this._saveList(KEYS.fixedCosts, this.getFixedCosts().filter(x => x.id !== id));
  },

  // --- Menus ---
  getMenus() { return this._getList(KEYS.menus); },
  saveMenu(menu) {
    const list = this.getMenus();
    const idx = list.findIndex(x => x.id === menu.id);
    if (idx >= 0) list[idx] = menu; else list.push(menu);
    this._saveList(KEYS.menus, list);
  },
  deleteMenu(id) {
    this._saveList(KEYS.menus, this.getMenus().filter(x => x.id !== id));
  },

  // --- Usage guards ---
  ingredientUsedBy(id) {
    return this.getMenus().filter(m => m.ingredients.some(i => i.ingredientId === id)).map(m => m.name);
  },
  fixedCostUsedBy(id) {
    return this.getMenus().filter(m => m.fixedCostItems.some(f => f.fixedCostItemId === id)).map(m => m.name);
  },
};

// --- Calculation helpers ---
function costPerUnit(item) {
  return item.bulkQty > 0 ? item.bulkPrice / item.bulkQty : 0;
}

function calcMenu(menu) {
  const ingredients = Storage.getIngredients();
  const fixedCosts = Storage.getFixedCosts();
  const mdr = Storage.getMDR();

  const ingredientCost = menu.ingredients.reduce((sum, row) => {
    const ing = ingredients.find(i => i.id === row.ingredientId);
    return sum + (ing ? costPerUnit(ing) * row.qty : 0);
  }, 0);

  const fixedCost = menu.fixedCostItems.reduce((sum, row) => {
    const fc = fixedCosts.find(f => f.id === row.fixedCostItemId);
    return sum + (fc ? costPerUnit(fc) * row.qty : 0);
  }, 0);

  const totalCost = ingredientCost + fixedCost;
  const frontProfit = menu.frontStorePrice - totalCost;
  const frontMargin = menu.frontStorePrice > 0 ? (frontProfit / menu.frontStorePrice) * 100 : 0;
  const deliveryNet = menu.deliveryPrice * (1 - mdr);
  const deliveryProfit = deliveryNet - totalCost;
  const deliveryMargin = menu.deliveryPrice > 0 ? (deliveryProfit / menu.deliveryPrice) * 100 : 0;

  return { ingredientCost, fixedCost, totalCost, frontProfit, frontMargin, deliveryNet, deliveryProfit, deliveryMargin };
}

function fmt(n) { return n.toFixed(2); }
function fmtPct(n) { return n.toFixed(1) + '%'; }
