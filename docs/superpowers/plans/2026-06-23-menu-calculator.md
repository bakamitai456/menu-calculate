# Menu Profit Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-page plain HTML/CSS/JS web app that calculates menu profit across front-store and delivery channels using bulk-purchase ingredient and fixed cost data.

**Architecture:** All data persists in localStorage. `app.js` owns all data access and calculation logic and is shared by both pages. `index.html` is the main dashboard (fixed costs + menus); `ingredients.html` manages ingredients. No build step, no framework, no server required.

**Tech Stack:** Plain HTML5, CSS3, vanilla JavaScript (ES6+), localStorage

## Global Constraints

- No external libraries, frameworks, or CDN dependencies
- All files must work when opened directly from the filesystem (no `http://` server required — no ES modules, use classic `<script>` tags)
- Currency: Thai Baht (฿)
- Default MDR: 32.1% stored as `0.321`
- LocalStorage keys: `mc_ingredients`, `mc_fixed_cost_items`, `mc_menus`, `mc_mdr`
- UUIDs generated via `crypto.randomUUID()`
- All numeric inputs: positive numbers only, validated before save

---

### Task 1: Data Layer (`app.js`)

**Files:**
- Create: `app.js`

**Interfaces:**
- Produces: `Storage` object (global) with methods used by all tasks below

- [ ] **Step 1: Create `app.js` with storage helpers and data model**

```js
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
```

- [ ] **Step 2: Verify data layer in browser console**

Open any `.html` file (even a blank one) that includes `<script src="app.js"></script>`.
In the browser console run:
```js
Storage.saveIngredient({ id: crypto.randomUUID(), name: 'Test', bulkQty: 1000, bulkUnit: 'g', bulkPrice: 45 });
console.log(Storage.getIngredients()); // Should show array with 1 item
console.log(costPerUnit(Storage.getIngredients()[0])); // Should log 0.045
Storage.deleteIngredient(Storage.getIngredients()[0].id);
console.log(Storage.getIngredients()); // Should show []
```

- [ ] **Step 3: Commit**
```bash
git add app.js
git commit -m "feat: add data layer and calculation helpers"
```

---

### Task 2: Shared Styles (`style.css`)

**Files:**
- Create: `style.css`

**Interfaces:**
- Produces: CSS classes used by all HTML files

- [ ] **Step 1: Create `style.css`**

```css
/* style.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  font-size: 14px;
  background: #f5f5f5;
  color: #222;
}

/* NAV */
nav {
  background: #1a1a2e;
  color: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  height: 52px;
}
nav .brand { font-weight: 700; font-size: 16px; margin-right: auto; }
nav a { color: #ccc; text-decoration: none; font-size: 14px; }
nav a:hover, nav a.active { color: #fff; }
.mdr-control { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.mdr-control input {
  width: 56px; padding: 2px 6px; border: 1px solid #555;
  background: #2a2a4a; color: #fff; border-radius: 4px; text-align: right;
}

/* MAIN LAYOUT */
main { max-width: 1100px; margin: 24px auto; padding: 0 16px; }
section { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.1); margin-bottom: 24px; padding: 20px; }
section h2 { font-size: 16px; font-weight: 600; margin-bottom: 14px; color: #1a1a2e; }

/* TABLES */
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #eee; padding: 6px 8px; }
td { padding: 8px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
tr:last-child td { border-bottom: none; }
td input[type="text"], td input[type="number"] {
  width: 100%; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;
}

/* BUTTONS */
.btn { padding: 6px 14px; border: none; border-radius: 5px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-primary { background: #1a1a2e; color: #fff; }
.btn-primary:hover { background: #2a2a5e; }
.btn-sm { padding: 3px 8px; font-size: 12px; }
.btn-danger { background: #e53e3e; color: #fff; }
.btn-danger:hover { background: #c53030; }
.btn-ghost { background: transparent; color: #555; border: 1px solid #ddd; }
.btn-ghost:hover { background: #f5f5f5; }
.btn-link { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 12px; padding: 0; text-decoration: underline; }

/* ADD ROW */
.add-row { margin-top: 10px; }
.add-row form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
.add-row form input { padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; }
.add-row form input[name="name"] { width: 160px; }
.add-row form input[name="bulkQty"], .add-row form input[name="bulkPrice"] { width: 90px; }
.add-row form input[name="bulkUnit"] { width: 70px; }

/* MENU CARDS */
.menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.menu-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; }
.menu-card h3 { font-size: 15px; font-weight: 600; margin-bottom: 10px; display: flex; justify-content: space-between; }
.menu-card .card-actions { display: flex; gap: 6px; }
.cost-table { width: 100%; font-size: 12px; margin-bottom: 10px; }
.cost-table td { padding: 2px 4px; color: #555; }
.cost-table td:last-child { text-align: right; }
.cost-total { font-weight: 600; border-top: 1px solid #eee; color: #222; }
.profit-table { width: 100%; font-size: 12px; border-top: 2px solid #eee; padding-top: 8px; margin-top: 4px; }
.profit-table th { font-size: 11px; color: #aaa; text-transform: uppercase; padding: 3px 4px; }
.profit-table td { padding: 3px 4px; }
.profit-table td:not(:first-child) { text-align: right; }
.profit-pos { color: #16a34a; font-weight: 600; }
.profit-neg { color: #dc2626; font-weight: 600; }

/* MODAL */
.modal-backdrop {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,.5); z-index: 100; align-items: center; justify-content: center;
}
.modal-backdrop.open { display: flex; }
.modal {
  background: #fff; border-radius: 10px; padding: 24px;
  width: 540px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
}
.modal h2 { font-size: 16px; margin-bottom: 16px; }
.modal label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; margin-top: 12px; }
.modal input[type="text"], .modal input[type="number"], .modal select {
  width: 100%; padding: 7px 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 13px;
}
.row-list { margin-top: 8px; }
.row-item { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; font-size: 13px; }
.row-item select { flex: 1; }
.row-item input[type="number"] { width: 80px; }
.row-item .unit-label { color: #888; min-width: 28px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.preview-box { background: #f8f8f8; border-radius: 6px; padding: 10px 14px; margin-top: 14px; font-size: 13px; }
.preview-box h4 { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 6px; }

/* QUICK-ADD INLINE */
.quick-add-form { background: #f0f4ff; border-radius: 6px; padding: 10px; margin-top: 8px; font-size: 13px; }
.quick-add-form .form-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.quick-add-form input { padding: 5px 8px; border: 1px solid #c5d0f5; border-radius: 4px; font-size: 13px; }
.quick-add-form input[name="name"] { width: 140px; }
.quick-add-form input[name="bulkQty"], .quick-add-form input[name="bulkPrice"] { width: 80px; }
.quick-add-form input[name="bulkUnit"] { width: 60px; }

/* UTILITY */
.text-right { text-align: right; }
.text-sm { font-size: 12px; color: #888; }
.mt-2 { margin-top: 8px; }
.error-msg { color: #dc2626; font-size: 12px; margin-top: 4px; }
```

- [ ] **Step 2: Commit**
```bash
git add style.css
git commit -m "feat: add shared styles"
```

---

### Task 3: Ingredients Page (`ingredients.html`)

**Files:**
- Create: `ingredients.html`

**Interfaces:**
- Consumes: `Storage.getIngredients()`, `Storage.saveIngredient()`, `Storage.deleteIngredient()`, `Storage.ingredientUsedBy()`, `costPerUnit()`, `fmt()` from `app.js`

- [ ] **Step 1: Create `ingredients.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ingredients — Menu Calculator</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <nav>
    <span class="brand">Menu Calculator</span>
    <a href="index.html">Dashboard</a>
    <a href="ingredients.html" class="active">Ingredients</a>
    <div class="mdr-control">
      MDR <input type="number" id="mdrInput" min="0" max="100" step="0.1"> %
    </div>
  </nav>
  <main>
    <section>
      <h2>Ingredients</h2>
      <table id="ingTable">
        <thead>
          <tr>
            <th>Name</th><th>Bulk Qty</th><th>Unit</th><th>Bulk Price (฿)</th><th>Cost / Unit (฿)</th><th></th>
          </tr>
        </thead>
        <tbody id="ingBody"></tbody>
      </table>
      <div class="add-row mt-2">
        <button class="btn btn-primary btn-sm" id="showAddBtn">+ Add Ingredient</button>
        <form id="addForm" style="display:none">
          <input name="name" placeholder="Name" required>
          <input name="bulkQty" type="number" min="0.001" step="any" placeholder="Qty" required>
          <input name="bulkUnit" placeholder="Unit (g/ml/pcs)" required>
          <input name="bulkPrice" type="number" min="0" step="any" placeholder="Price (฿)" required>
          <button type="submit" class="btn btn-primary btn-sm">Save</button>
          <button type="button" class="btn btn-ghost btn-sm" id="cancelAddBtn">Cancel</button>
        </form>
        <div class="error-msg" id="addError"></div>
      </div>
    </section>
  </main>
  <script src="app.js"></script>
  <script>
    // MDR nav control
    const mdrInput = document.getElementById('mdrInput');
    mdrInput.value = (Storage.getMDR() * 100).toFixed(1);
    mdrInput.addEventListener('change', () => {
      const v = parseFloat(mdrInput.value);
      if (!isNaN(v) && v >= 0 && v <= 100) Storage.setMDR(v / 100);
      else mdrInput.value = (Storage.getMDR() * 100).toFixed(1);
    });

    const tbody = document.getElementById('ingBody');
    const addForm = document.getElementById('addForm');
    const addError = document.getElementById('addError');

    document.getElementById('showAddBtn').onclick = () => { addForm.style.display = 'flex'; addError.textContent = ''; };
    document.getElementById('cancelAddBtn').onclick = () => { addForm.style.display = 'none'; addForm.reset(); };

    function renderIngredients() {
      const list = Storage.getIngredients();
      tbody.innerHTML = list.length === 0
        ? '<tr><td colspan="6" style="color:#aaa;padding:16px">No ingredients yet.</td></tr>'
        : list.map(ing => {
            const cpu = costPerUnit(ing);
            return `<tr data-id="${ing.id}">
              <td>${ing.name}</td>
              <td>${ing.bulkQty}</td>
              <td>${ing.bulkUnit}</td>
              <td class="text-right">${fmt(ing.bulkPrice)}</td>
              <td class="text-right">${fmt(cpu)}</td>
              <td class="text-right">
                <button class="btn btn-ghost btn-sm" onclick="startEdit('${ing.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="doDelete('${ing.id}')">Delete</button>
              </td>
            </tr>`;
          }).join('');
    }

    addForm.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(addForm));
      if (!data.name.trim()) { addError.textContent = 'Name is required.'; return; }
      Storage.saveIngredient({
        id: crypto.randomUUID(),
        name: data.name.trim(),
        bulkQty: parseFloat(data.bulkQty),
        bulkUnit: data.bulkUnit.trim(),
        bulkPrice: parseFloat(data.bulkPrice),
      });
      addForm.reset(); addForm.style.display = 'none'; addError.textContent = '';
      renderIngredients();
    });

    function startEdit(id) {
      const ing = Storage.getIngredients().find(x => x.id === id);
      if (!ing) return;
      const row = tbody.querySelector(`tr[data-id="${id}"]`);
      row.innerHTML = `
        <td><input name="name" value="${ing.name}" style="width:120px"></td>
        <td><input name="bulkQty" type="number" value="${ing.bulkQty}" min="0.001" step="any" style="width:70px"></td>
        <td><input name="bulkUnit" value="${ing.bulkUnit}" style="width:60px"></td>
        <td><input name="bulkPrice" type="number" value="${ing.bulkPrice}" min="0" step="any" style="width:80px"></td>
        <td></td>
        <td class="text-right">
          <button class="btn btn-primary btn-sm" onclick="saveEdit('${id}', this)">Save</button>
          <button class="btn btn-ghost btn-sm" onclick="renderIngredients()">Cancel</button>
        </td>`;
    }

    function saveEdit(id, btn) {
      const row = btn.closest('tr');
      const get = n => row.querySelector(`[name="${n}"]`).value.trim();
      Storage.saveIngredient({
        id, name: get('name'), bulkUnit: get('bulkUnit'),
        bulkQty: parseFloat(get('bulkQty')), bulkPrice: parseFloat(get('bulkPrice')),
      });
      renderIngredients();
    }

    function doDelete(id) {
      const usedBy = Storage.ingredientUsedBy(id);
      if (usedBy.length > 0) {
        alert(`Cannot delete — used by: ${usedBy.join(', ')}`);
        return;
      }
      if (confirm('Delete this ingredient?')) { Storage.deleteIngredient(id); renderIngredients(); }
    }

    renderIngredients();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**
  - Open `ingredients.html` in a browser
  - Add an ingredient: "Flour", 1000, g, 45 → Cost/Unit should show `0.05`
  - Edit the ingredient name and save — verify it updates
  - Reload the page — ingredient should still be there

- [ ] **Step 3: Commit**
```bash
git add ingredients.html
git commit -m "feat: add ingredient management page"
```

---

### Task 4: Main Dashboard — Nav, Fixed Cost Items, and Menu Cards (`index.html`)

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: all of `app.js` — `Storage`, `calcMenu()`, `costPerUnit()`, `fmt()`, `fmtPct()`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard — Menu Calculator</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <nav>
    <span class="brand">Menu Calculator</span>
    <a href="index.html" class="active">Dashboard</a>
    <a href="ingredients.html">Ingredients</a>
    <div class="mdr-control">
      MDR <input type="number" id="mdrInput" min="0" max="100" step="0.1"> %
    </div>
  </nav>
  <main>
    <!-- FIXED COSTS SECTION -->
    <section>
      <h2>Fixed Cost Items</h2>
      <table id="fcTable">
        <thead>
          <tr>
            <th>Name</th><th>Bulk Qty</th><th>Unit</th><th>Bulk Price (฿)</th><th>Cost / Unit (฿)</th><th></th>
          </tr>
        </thead>
        <tbody id="fcBody"></tbody>
      </table>
      <div class="add-row mt-2">
        <button class="btn btn-primary btn-sm" id="showFcAddBtn">+ Add Fixed Cost Item</button>
        <form id="fcAddForm" style="display:none">
          <input name="name" placeholder="Name" required>
          <input name="bulkQty" type="number" min="0.001" step="any" placeholder="Qty" required>
          <input name="bulkUnit" placeholder="Unit" required>
          <input name="bulkPrice" type="number" min="0" step="any" placeholder="Price (฿)" required>
          <button type="submit" class="btn btn-primary btn-sm">Save</button>
          <button type="button" class="btn btn-ghost btn-sm" id="cancelFcBtn">Cancel</button>
        </form>
        <div class="error-msg" id="fcError"></div>
      </div>
    </section>

    <!-- MENUS SECTION -->
    <section>
      <h2>Menus</h2>
      <div style="margin-bottom:14px">
        <button class="btn btn-primary" id="addMenuBtn">+ Add Menu</button>
      </div>
      <div class="menu-grid" id="menuGrid"></div>
    </section>
  </main>

  <!-- MENU MODAL -->
  <div class="modal-backdrop" id="menuModal">
    <div class="modal">
      <h2 id="modalTitle">Add Menu</h2>
      <input type="hidden" id="menuId">

      <label>Menu Name</label>
      <input type="text" id="menuName" placeholder="e.g. Pad Thai">

      <label>Ingredients</label>
      <div class="row-list" id="ingRows"></div>
      <button class="btn btn-ghost btn-sm mt-2" id="addIngRowBtn">+ Add Ingredient</button>
      <div style="margin-top:6px">
        <button class="btn-link" id="quickAddIngBtn">＋ New ingredient (quick add)</button>
      </div>
      <div class="quick-add-form" id="quickAddForm" style="display:none">
        <div class="form-row">
          <input name="name" placeholder="Name">
          <input name="bulkQty" type="number" min="0.001" step="any" placeholder="Qty">
          <input name="bulkUnit" placeholder="Unit">
          <input name="bulkPrice" type="number" min="0" step="any" placeholder="Price (฿)">
          <button type="button" class="btn btn-primary btn-sm" id="saveQuickIngBtn">Add</button>
          <button type="button" class="btn btn-ghost btn-sm" id="cancelQuickIngBtn">Cancel</button>
        </div>
        <div class="error-msg" id="quickIngError"></div>
      </div>

      <label>Fixed Cost Items</label>
      <div class="row-list" id="fcRows"></div>
      <button class="btn btn-ghost btn-sm mt-2" id="addFcRowBtn">+ Add Fixed Cost Item</button>

      <label>Front-Store Selling Price (฿)</label>
      <input type="number" id="frontPrice" min="0" step="any" placeholder="0.00">

      <label>Delivery Selling Price (฿)</label>
      <input type="number" id="deliveryPrice" min="0" step="any" placeholder="0.00">

      <div class="preview-box" id="previewBox">
        <h4>Live Preview</h4>
        <div id="previewContent" style="color:#aaa;font-size:12px">Fill in ingredients and prices to see profit.</div>
      </div>

      <div class="error-msg" id="menuError"></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="cancelMenuBtn">Cancel</button>
        <button class="btn btn-primary" id="saveMenuBtn">Save Menu</button>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
  <script>
    // --- MDR ---
    const mdrInput = document.getElementById('mdrInput');
    mdrInput.value = (Storage.getMDR() * 100).toFixed(1);
    mdrInput.addEventListener('change', () => {
      const v = parseFloat(mdrInput.value);
      if (!isNaN(v) && v >= 0 && v <= 100) { Storage.setMDR(v / 100); renderMenus(); }
      else mdrInput.value = (Storage.getMDR() * 100).toFixed(1);
    });

    // === FIXED COST ITEMS ===
    const fcBody = document.getElementById('fcBody');
    document.getElementById('showFcAddBtn').onclick = () => {
      document.getElementById('fcAddForm').style.display = 'flex';
    };
    document.getElementById('cancelFcBtn').onclick = () => {
      document.getElementById('fcAddForm').style.display = 'none';
      document.getElementById('fcAddForm').reset();
    };
    document.getElementById('fcAddForm').addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      if (!data.name.trim()) { document.getElementById('fcError').textContent = 'Name required.'; return; }
      Storage.saveFixedCost({
        id: crypto.randomUUID(), name: data.name.trim(),
        bulkQty: parseFloat(data.bulkQty), bulkUnit: data.bulkUnit.trim(), bulkPrice: parseFloat(data.bulkPrice),
      });
      e.target.reset(); e.target.style.display = 'none';
      renderFC(); renderMenus();
    });

    function renderFC() {
      const list = Storage.getFixedCosts();
      fcBody.innerHTML = list.length === 0
        ? '<tr><td colspan="6" style="color:#aaa;padding:16px">No fixed cost items yet.</td></tr>'
        : list.map(fc => {
            const cpu = costPerUnit(fc);
            return `<tr data-id="${fc.id}">
              <td>${fc.name}</td><td>${fc.bulkQty}</td><td>${fc.bulkUnit}</td>
              <td class="text-right">${fmt(fc.bulkPrice)}</td>
              <td class="text-right">${fmt(cpu)}</td>
              <td class="text-right">
                <button class="btn btn-ghost btn-sm" onclick="startFcEdit('${fc.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="doDeleteFC('${fc.id}')">Delete</button>
              </td>
            </tr>`;
          }).join('');
    }

    function startFcEdit(id) {
      const fc = Storage.getFixedCosts().find(x => x.id === id);
      if (!fc) return;
      const row = fcBody.querySelector(`tr[data-id="${id}"]`);
      row.innerHTML = `
        <td><input name="name" value="${fc.name}" style="width:120px"></td>
        <td><input name="bulkQty" type="number" value="${fc.bulkQty}" min="0.001" step="any" style="width:70px"></td>
        <td><input name="bulkUnit" value="${fc.bulkUnit}" style="width:60px"></td>
        <td><input name="bulkPrice" type="number" value="${fc.bulkPrice}" min="0" step="any" style="width:80px"></td>
        <td></td>
        <td class="text-right">
          <button class="btn btn-primary btn-sm" onclick="saveFcEdit('${id}', this)">Save</button>
          <button class="btn btn-ghost btn-sm" onclick="renderFC()">Cancel</button>
        </td>`;
    }

    function saveFcEdit(id, btn) {
      const row = btn.closest('tr');
      const get = n => row.querySelector(`[name="${n}"]`).value.trim();
      Storage.saveFixedCost({ id, name: get('name'), bulkUnit: get('bulkUnit'), bulkQty: parseFloat(get('bulkQty')), bulkPrice: parseFloat(get('bulkPrice')) });
      renderFC(); renderMenus();
    }

    function doDeleteFC(id) {
      const usedBy = Storage.fixedCostUsedBy(id);
      if (usedBy.length > 0) { alert(`Cannot delete — used by: ${usedBy.join(', ')}`); return; }
      if (confirm('Delete this fixed cost item?')) { Storage.deleteFixedCost(id); renderFC(); renderMenus(); }
    }

    // === MENU CARDS ===
    function profitClass(n) { return n >= 0 ? 'profit-pos' : 'profit-neg'; }

    function renderMenus() {
      const menus = Storage.getMenus();
      const ingredients = Storage.getIngredients();
      const fixedCosts = Storage.getFixedCosts();
      const grid = document.getElementById('menuGrid');

      if (menus.length === 0) {
        grid.innerHTML = '<p style="color:#aaa">No menus yet. Click "+ Add Menu" to get started.</p>';
        return;
      }

      grid.innerHTML = menus.map(menu => {
        const r = calcMenu(menu);
        const ingLines = menu.ingredients.map(row => {
          const ing = ingredients.find(i => i.id === row.ingredientId);
          if (!ing) return '';
          return `<tr><td>${ing.name} × ${row.qty} ${ing.bulkUnit}</td><td>฿${fmt(costPerUnit(ing) * row.qty)}</td></tr>`;
        }).join('');
        const fcLines = menu.fixedCostItems.map(row => {
          const fc = fixedCosts.find(f => f.id === row.fixedCostItemId);
          if (!fc) return '';
          return `<tr><td>${fc.name} × ${row.qty} ${fc.bulkUnit}</td><td>฿${fmt(costPerUnit(fc) * row.qty)}</td></tr>`;
        }).join('');

        return `<div class="menu-card">
          <h3>${menu.name}
            <span class="card-actions">
              <button class="btn btn-ghost btn-sm" onclick="openEditMenu('${menu.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="doDeleteMenu('${menu.id}')">Delete</button>
            </span>
          </h3>
          <table class="cost-table">
            <tr><td colspan="2" style="color:#aaa;font-size:11px;padding-bottom:2px">INGREDIENTS</td></tr>
            ${ingLines}
            <tr><td colspan="2" style="color:#aaa;font-size:11px;padding:4px 0 2px">FIXED COSTS</td></tr>
            ${fcLines}
            <tr class="cost-total"><td>Total Cost</td><td>฿${fmt(r.totalCost)}</td></tr>
          </table>
          <table class="profit-table">
            <thead><tr><th>Channel</th><th>Price</th><th>Net</th><th>Profit</th><th>Margin</th></tr></thead>
            <tbody>
              <tr>
                <td>Front Store</td>
                <td>฿${fmt(menu.frontStorePrice)}</td>
                <td>฿${fmt(menu.frontStorePrice)}</td>
                <td class="${profitClass(r.frontProfit)}">฿${fmt(r.frontProfit)}</td>
                <td class="${profitClass(r.frontMargin)}">${fmtPct(r.frontMargin)}</td>
              </tr>
              <tr>
                <td>Delivery</td>
                <td>฿${fmt(menu.deliveryPrice)}</td>
                <td>฿${fmt(r.deliveryNet)}</td>
                <td class="${profitClass(r.deliveryProfit)}">฿${fmt(r.deliveryProfit)}</td>
                <td class="${profitClass(r.deliveryMargin)}">${fmtPct(r.deliveryMargin)}</td>
              </tr>
            </tbody>
          </table>
        </div>`;
      }).join('');
    }

    function doDeleteMenu(id) {
      if (confirm('Delete this menu?')) { Storage.deleteMenu(id); renderMenus(); }
    }

    // === MENU MODAL ===
    const modal = document.getElementById('menuModal');
    const ingRows = document.getElementById('ingRows');
    const fcRows = document.getElementById('fcRows');

    function buildIngRow(ingredientId = '', qty = '') {
      const ingredients = Storage.getIngredients();
      const opts = ingredients.map(i => `<option value="${i.id}" ${i.id === ingredientId ? 'selected' : ''}>${i.name} (${i.bulkUnit})</option>`).join('');
      const ing = ingredients.find(i => i.id === ingredientId);
      const unit = ing ? ing.bulkUnit : '';
      const div = document.createElement('div');
      div.className = 'row-item';
      div.innerHTML = `
        <select class="ing-select" onchange="updateUnit(this)">${opts}</select>
        <input type="number" class="ing-qty" value="${qty}" min="0.001" step="any" placeholder="Qty">
        <span class="unit-label">${unit}</span>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.row-item').remove(); updatePreview()">✕</button>`;
      div.querySelector('.ing-select').addEventListener('change', updatePreview);
      div.querySelector('.ing-qty').addEventListener('input', updatePreview);
      return div;
    }

    function updateUnit(sel) {
      const ing = Storage.getIngredients().find(i => i.id === sel.value);
      sel.closest('.row-item').querySelector('.unit-label').textContent = ing ? ing.bulkUnit : '';
    }

    function buildFcRow(fixedCostItemId = '', qty = '') {
      const fixedCosts = Storage.getFixedCosts();
      const opts = fixedCosts.map(f => `<option value="${f.id}" ${f.id === fixedCostItemId ? 'selected' : ''}>${f.name} (${f.bulkUnit})</option>`).join('');
      const fc = fixedCosts.find(f => f.id === fixedCostItemId);
      const unit = fc ? fc.bulkUnit : '';
      const div = document.createElement('div');
      div.className = 'row-item';
      div.innerHTML = `
        <select class="fc-select">${opts}</select>
        <input type="number" class="fc-qty" value="${qty}" min="0.001" step="any" placeholder="Qty">
        <span class="unit-label">${unit}</span>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.row-item').remove(); updatePreview()">✕</button>`;
      div.querySelector('.fc-select').addEventListener('change', () => {
        const fc2 = Storage.getFixedCosts().find(f => f.id === div.querySelector('.fc-select').value);
        div.querySelector('.unit-label').textContent = fc2 ? fc2.bulkUnit : '';
        updatePreview();
      });
      div.querySelector('.fc-qty').addEventListener('input', updatePreview);
      return div;
    }

    document.getElementById('addIngRowBtn').onclick = () => {
      const ingredients = Storage.getIngredients();
      if (ingredients.length === 0) { alert('Add ingredients first via the Ingredients page.'); return; }
      ingRows.appendChild(buildIngRow(ingredients[0].id, ''));
      updatePreview();
    };

    document.getElementById('addFcRowBtn').onclick = () => {
      const fixedCosts = Storage.getFixedCosts();
      if (fixedCosts.length === 0) { alert('Add fixed cost items first.'); return; }
      fcRows.appendChild(buildFcRow(fixedCosts[0].id, ''));
      updatePreview();
    };

    // Quick-add ingredient
    document.getElementById('quickAddIngBtn').onclick = () => {
      document.getElementById('quickAddForm').style.display = 'block';
    };
    document.getElementById('cancelQuickIngBtn').onclick = () => {
      document.getElementById('quickAddForm').style.display = 'none';
      document.getElementById('quickAddForm').querySelectorAll('input').forEach(i => i.value = '');
      document.getElementById('quickIngError').textContent = '';
    };
    document.getElementById('saveQuickIngBtn').onclick = () => {
      const form = document.getElementById('quickAddForm');
      const get = n => form.querySelector(`[name="${n}"]`).value.trim();
      if (!get('name')) { document.getElementById('quickIngError').textContent = 'Name required.'; return; }
      const newIng = {
        id: crypto.randomUUID(), name: get('name'), bulkUnit: get('bulkUnit'),
        bulkQty: parseFloat(get('bulkQty')), bulkPrice: parseFloat(get('bulkPrice')),
      };
      Storage.saveIngredient(newIng);
      form.querySelectorAll('input').forEach(i => i.value = '');
      form.style.display = 'none';
      document.getElementById('quickIngError').textContent = '';
      // Auto-add a row pre-selected to the new ingredient
      ingRows.appendChild(buildIngRow(newIng.id, ''));
      updatePreview();
    };

    function updatePreview() {
      const ingredients = Storage.getIngredients();
      const fixedCosts = Storage.getFixedCosts();
      const frontPrice = parseFloat(document.getElementById('frontPrice').value) || 0;
      const deliveryPrice = parseFloat(document.getElementById('deliveryPrice').value) || 0;
      const mdr = Storage.getMDR();

      const ingData = [...ingRows.querySelectorAll('.row-item')].map(row => ({
        ingredientId: row.querySelector('.ing-select').value,
        qty: parseFloat(row.querySelector('.ing-qty').value) || 0,
      }));
      const fcData = [...fcRows.querySelectorAll('.row-item')].map(row => ({
        fixedCostItemId: row.querySelector('.fc-select').value,
        qty: parseFloat(row.querySelector('.fc-qty').value) || 0,
      }));

      const tempMenu = { id: '__preview', name: '', ingredients: ingData, fixedCostItems: fcData, frontStorePrice: frontPrice, deliveryPrice };
      const r = calcMenu(tempMenu);

      document.getElementById('previewContent').innerHTML = `
        <table style="width:100%;font-size:12px">
          <tr><td>Ingredient Cost</td><td style="text-align:right">฿${fmt(r.ingredientCost)}</td></tr>
          <tr><td>Fixed Cost</td><td style="text-align:right">฿${fmt(r.fixedCost)}</td></tr>
          <tr style="font-weight:600"><td>Total Cost</td><td style="text-align:right">฿${fmt(r.totalCost)}</td></tr>
          <tr><td colspan="2" style="padding-top:6px;color:#aaa;font-size:11px">FRONT STORE</td></tr>
          <tr><td>Profit</td><td style="text-align:right;font-weight:600;color:${r.frontProfit>=0?'#16a34a':'#dc2626'}">฿${fmt(r.frontProfit)} (${fmtPct(r.frontMargin)})</td></tr>
          <tr><td colspan="2" style="padding-top:6px;color:#aaa;font-size:11px">DELIVERY (MDR ${fmtPct(mdr*100)})</td></tr>
          <tr><td>Net Revenue</td><td style="text-align:right">฿${fmt(r.deliveryNet)}</td></tr>
          <tr><td>Profit</td><td style="text-align:right;font-weight:600;color:${r.deliveryProfit>=0?'#16a34a':'#dc2626'}">฿${fmt(r.deliveryProfit)} (${fmtPct(r.deliveryMargin)})</td></tr>
        </table>`;
    }

    document.getElementById('frontPrice').addEventListener('input', updatePreview);
    document.getElementById('deliveryPrice').addEventListener('input', updatePreview);

    function openAddMenu() {
      document.getElementById('menuId').value = '';
      document.getElementById('modalTitle').textContent = 'Add Menu';
      document.getElementById('menuName').value = '';
      ingRows.innerHTML = ''; fcRows.innerHTML = '';
      document.getElementById('frontPrice').value = '';
      document.getElementById('deliveryPrice').value = '';
      document.getElementById('menuError').textContent = '';
      document.getElementById('quickAddForm').style.display = 'none';
      document.getElementById('previewContent').innerHTML = '<span style="color:#aaa;font-size:12px">Fill in ingredients and prices to see profit.</span>';
      modal.classList.add('open');
    }

    function openEditMenu(id) {
      const menu = Storage.getMenus().find(m => m.id === id);
      if (!menu) return;
      document.getElementById('menuId').value = id;
      document.getElementById('modalTitle').textContent = 'Edit Menu';
      document.getElementById('menuName').value = menu.name;
      ingRows.innerHTML = ''; fcRows.innerHTML = '';
      menu.ingredients.forEach(row => ingRows.appendChild(buildIngRow(row.ingredientId, row.qty)));
      menu.fixedCostItems.forEach(row => fcRows.appendChild(buildFcRow(row.fixedCostItemId, row.qty)));
      document.getElementById('frontPrice').value = menu.frontStorePrice;
      document.getElementById('deliveryPrice').value = menu.deliveryPrice;
      document.getElementById('menuError').textContent = '';
      document.getElementById('quickAddForm').style.display = 'none';
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
      Storage.saveMenu({ id, name, ingredients: ingData, fixedCostItems: fcData, frontStorePrice, deliveryPrice });
      modal.classList.remove('open');
      renderMenus();
    };

    // Init
    renderFC();
    renderMenus();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify end-to-end in browser**
  1. Open `index.html`
  2. Add a fixed cost item: "Packaging Box", 100, pcs, 150 → Cost/Unit = 1.50 ฿
  3. Go to `ingredients.html`, add "Flour" 1000g ฿45, "Sugar" 500g ฿30
  4. Return to `index.html`, click "+ Add Menu"
  5. Name: "Cake Slice", add Flour × 200, Sugar × 50, Packaging Box × 1
  6. Front-store price: 80, Delivery price: 95
  7. Live preview should show: Ingredient cost = ฿9.00 + ฿3.00 = ฿12, Fixed = ฿1.50, Total = ฿13.50
  8. Front profit = ฿66.50 (83.1%), Delivery net = ฿64.45, Delivery profit = ฿50.95 (53.6%)
  9. Save — verify menu card appears with correct values
  10. Change MDR to 30% — delivery profit on card should update
  11. Reload page — all data persists
  12. Try to delete "Flour" from ingredients page → warning should appear listing "Cake Slice"

- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat: add dashboard with fixed costs, menu cards, and menu modal"
```

---

## Self-Review Checklist

- [x] Spec coverage: ingredients page ✓, fixed cost items ✓, menu cards ✓, modal with quick-add ✓, live preview ✓, MDR editable ✓, profit/margin calculations ✓, localStorage persistence ✓, delete guards ✓
- [x] No placeholders or TBD items
- [x] `costPerUnit()`, `fmt()`, `fmtPct()`, `calcMenu()` — defined in Task 1, consumed consistently in Tasks 3 and 4
- [x] `Storage.ingredientUsedBy()` and `Storage.fixedCostUsedBy()` — defined in Task 1, called in Tasks 3 and 4
- [x] `buildIngRow()` / `buildFcRow()` — defined and used only in Task 4 (index.html scope)
