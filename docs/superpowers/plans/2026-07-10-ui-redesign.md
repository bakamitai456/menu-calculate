# UI Redesign (Claude Design mockup) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the app to the warm cream/amber sidebar-based visual system from the Claude Design mockup, moving MDR/sync/export/import into a Settings slide-out panel and the Add/Edit Menu modal into a right-side slide-in panel, while keeping the existing two-page architecture, all domain/sync logic, and all element IDs `navControls.js` depends on.

**Architecture:** Pure presentation-layer change. `style.css` gets a new palette/typography/layout system; `index.html` and `ingredients.html` get a sidebar shell and a duplicated Settings panel; `src/render/*.js` functions get restyled markup (plus two small additions: menu-card Details collapse, ingredients "Used In" column); `src/pages/dashboard.js` / `src/pages/ingredients.js` get the minimal JS needed to open/close new panels and toggle card details. No changes to `src/domain/*.js`, `src/sync/*.js`, `src/io/*.js`, `src/records/*.js`, or any existing test file.

**Tech Stack:** Vanilla HTML/CSS/JS (ES modules), no build step, `node --test` for existing unit tests, static file server at `.claude/static-server.mjs` (port 8123) for browser verification.

## Global Constraints

- Preserve every element ID that `src/pages/shared/navControls.js` looks up (`mdrInput`, `syncUrlInput`, `syncIntervalInput`, `syncNowBtn`, `syncStatus`, `exportBtn`, `importBtn`) — only their container markup moves.
- No changes to `src/domain/`, `src/sync/`, `src/io/`, `src/records/` or their tests. Run `npm test` after every task to confirm the existing suite still passes (it exercises none of the UI, so it should never fail from this work — a failure means something outside scope broke).
- Two-page architecture stays: `index.html` (Dashboard) and `ingredients.html` (Ingredients) remain separate documents linked via normal `<a href>`.
- Palette: background `#fbf6ef`, sidebar/ink `#3d2b1c`, accent `#b5732c`, card bg `#fffdf9`, card border `rgba(42,31,22,.1)`, body text `#2a1f14`, success `#2f7d43`, danger `#b23b3b`, sync-idle dot `#7fbf6a`. Font: Manrope (Google Fonts).
- Verify every task in the browser via the `static-server` preview (`preview_start` with name `static-server`, already configured in `.claude/launch.json` at port 8123) — reload and check the affected page after each task.

---

### Task 1: Foundation — palette, font, sidebar shell CSS

**Files:**
- Modify: `style.css` (full rewrite of the top section: reset, body, nav → sidebar, buttons, utility classes)

**Interfaces:**
- Produces: CSS classes consumed by later tasks: `.app-shell` (flex row wrapper), `.sidebar`, `.sidebar.collapsed`, `.sidebar-header`, `.sidebar-logo`, `.sidebar-nav`, `.sidebar-nav-item`, `.sidebar-nav-item.active`, `.sidebar-footer`, `.sidebar-sync-dot`, `.sidebar-sync-dot[data-status]`, `.sidebar-settings-btn`, `.main-content` (scrollable right column), `.page-inner` (max-width 960px centered container), `.btn` / `.btn-primary` / `.btn-ghost` / `.btn-sm` / `.btn-danger` (restyled, same class names as today so existing markup in `render/*.js` keeps working without edits), `.card` (the `#fffdf9` rounded bordered container used for table wrappers and menu cards).

- [ ] **Step 1: Add the Google Fonts import and CSS custom properties at the top of `style.css`**

Replace the file's opening (from `/* style.css */` through the `body { ... }` rule) with:

```css
/* style.css */
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #fbf6ef;
  --ink: #3d2b1c;
  --text: #2a1f14;
  --accent: #b5732c;
  --card-bg: #fffdf9;
  --card-border: rgba(42,31,22,.1);
  --success: #2f7d43;
  --danger: #b23b3b;
  --sync-idle: #7fbf6a;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 14px;
  background: var(--bg);
  color: var(--text);
}

input, select, button { font-family: inherit; }
input:focus, select:focus, button:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
```

- [ ] **Step 2: Replace the `nav` rules with the sidebar/shell layout**

Remove the existing `/* NAV */` block and the later duplicate `nav { flex-wrap... }` override under `/* SYNC CONTROLS */` (both target the old top-bar `<nav>`, which no longer exists in the markup after Task 2). Add in their place:

```css
/* APP SHELL */
.app-shell { display: flex; height: 100vh; overflow: hidden; }

/* SIDEBAR */
.sidebar { width: 212px; flex: none; background: var(--ink); color: #f3e9dc; display: flex; flex-direction: column; height: 100%; transition: width .15s; }
.sidebar.collapsed { width: 60px; }
.sidebar-header { padding: 22px 16px 18px 20px; display: flex; align-items: center; gap: 10px; }
.sidebar.collapsed .sidebar-header { padding: 20px 0 16px; flex-direction: column; }
.sidebar-logo { width: 26px; height: 26px; border-radius: 7px; background: var(--accent); flex: none; }
.sidebar-title { font-weight: 800; font-size: 15px; letter-spacing: .2px; flex: 1; }
.sidebar.collapsed .sidebar-title { display: none; }
.sidebar-collapse-btn { border: none; background: rgba(255,255,255,.08); color: #d8c8b8; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; font-size: 12px; flex: none; }

.sidebar-nav { padding: 6px 12px; display: flex; flex-direction: column; gap: 2px; }
.sidebar.collapsed .sidebar-nav { padding: 6px 8px; align-items: center; }
.sidebar-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; border-left: 3px solid transparent; font-weight: 500; font-size: 13.5px; color: #d8c8b8; text-decoration: none; cursor: pointer; }
.sidebar-nav-item.active { background: rgba(255,255,255,.1); border-left-color: var(--accent); font-weight: 700; color: #f3e9dc; }
.sidebar.collapsed .sidebar-nav-item { justify-content: center; width: 40px; height: 36px; padding: 0; border-left: none; }
.sidebar.collapsed .sidebar-nav-item span.nav-label { display: none; }

.sidebar-footer { margin-top: auto; padding: 12px; border-top: 1px solid rgba(255,255,255,.1); display: flex; flex-direction: column; gap: 8px; }
.sidebar.collapsed .sidebar-footer { padding: 12px 0; align-items: center; }
.sidebar-sync-row { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #d8c8b8; padding: 0 4px; }
.sidebar.collapsed .sidebar-sync-row span.nav-label { display: none; }
.sidebar-sync-dot { width: 7px; height: 7px; border-radius: 50%; background: #555; flex-shrink: 0; }
.sidebar-sync-dot[data-status="idle"] { background: var(--sync-idle); animation: pulseDot 2s infinite; }
.sidebar-sync-dot[data-status="syncing"] { background: #f59e0b; animation: pulseDot 1s infinite; }
.sidebar-sync-dot[data-status="conflict"], .sidebar-sync-dot[data-status="error"] { background: var(--danger); }
@keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
.sidebar-settings-btn { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; font-size: 13px; color: #f3e9dc; background: rgba(255,255,255,.06); cursor: pointer; border: none; text-align: left; width: 100%; }
.sidebar.collapsed .sidebar-settings-btn { justify-content: center; width: 36px; height: 36px; padding: 0; }
.sidebar.collapsed .sidebar-settings-btn span.nav-label { display: none; }

/* MAIN */
.main-content { flex: 1; height: 100%; overflow-y: auto; }
.page-inner { max-width: 960px; margin: 0 auto; padding: 36px 44px 90px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-header h2 { font-weight: 800; font-size: 19px; color: var(--text); }
```

- [ ] **Step 3: Restyle buttons and the shared card container, keeping existing class names**

Replace the `/* BUTTONS */` block with:

```css
/* BUTTONS */
.btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #9c5f22; }
.btn-sm { padding: 5px 10px; font-size: 11.5px; font-weight: 500; border-radius: 6px; }
.btn-danger { background: var(--danger); color: #fff; }
.btn-danger:hover { background: #9c2f2f; }
.btn-ghost { background: #fff; color: var(--text); border: 1px solid var(--card-border); }
.btn-ghost:hover { background: #f8f2ea; }
.btn-link { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 12px; padding: 0; text-decoration: underline; }

/* CARD CONTAINER */
.card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; overflow: hidden; }
```

Delete the old `section`, `section h2` rules (superseded by `.page-header`/`.card`) and the old `.mdr-control` rule (superseded by Task 3's settings-panel styling) — grep first to confirm nothing else in the file still references `section` as a selector before deleting.

- [ ] **Step 4: Verify no leftover references to deleted selectors**

Run:
```bash
grep -n "^section\|\.mdr-control\|^nav " style.css
```
Expected: no output (all three selector families removed). If any remain, remove them.

- [ ] **Step 5: Commit**

```bash
git add style.css
git commit -m "style: rebuild palette, font, and sidebar shell CSS for redesign"
```

---

### Task 2: Sidebar markup in both pages

**Files:**
- Modify: `index.html` (replace `<nav>...</nav>` and wrap `<main>` content)
- Modify: `ingredients.html` (replace `<nav>...</nav>` and wrap `<main>` content)

**Interfaces:**
- Consumes: `.app-shell`, `.sidebar`, `.sidebar-header`, `.sidebar-logo`, `.sidebar-title`, `.sidebar-collapse-btn`, `.sidebar-nav`, `.sidebar-nav-item`, `.sidebar-nav-item.active`, `.sidebar-footer`, `.sidebar-sync-row`, `.sidebar-sync-dot`, `.sidebar-settings-btn`, `.main-content`, `.page-inner` from Task 1.
- Produces: `#sidebarToggleBtn`, `#settingsOpenBtn` (button ids later tasks wire up), `#sidebarSyncDot` (element the sync-status fan-out targets in Task 3), retains `id="mdrInput"` etc. are NOT here — those move to the Settings panel in Task 3. This task only replaces the nav bar with the sidebar and leaves `<main>`'s *inner content* (the `<section>` blocks) untouched except for swapping the `<main>` tag for `<div class="main-content"><div class="page-inner">...</div></div>`.

- [ ] **Step 1: Replace `index.html`'s `<nav>` block**

In `index.html`, replace:
```html
  <nav>
    <span class="brand">Menu Calculator</span>
    <a href="index.html" class="active">Dashboard</a>
    <a href="ingredients.html">Ingredients</a>
    <button class="btn btn-ghost btn-sm" id="exportBtn">Export</button>
    <button class="btn btn-ghost btn-sm" id="importBtn">Import</button>
    <div class="mdr-control">
      MDR <input type="number" id="mdrInput" min="0" max="100" step="0.1"> %
    </div>
    <div class="sync-control">
      <input type="url" id="syncUrlInput" placeholder="Apps Script URL" title="Paste your Google Apps Script Web App URL here">
      <div class="sync-rate-control" title="How often to sync with Google Sheets">
        <input type="number" id="syncIntervalInput" min="3" step="1"> s
      </div>
      <button class="btn btn-ghost btn-sm" id="syncNowBtn">Sync Now</button>
      <div class="sync-status" id="syncStatus" data-status="idle">
        <span class="sync-dot"></span>
        <span class="sync-status-text">Idle</span>
      </div>
    </div>
  </nav>
```
with:
```html
  <div class="app-shell">
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo"></div>
        <div class="sidebar-title">Menu Calculator</div>
        <button class="sidebar-collapse-btn" id="sidebarToggleBtn" title="Collapse">‹</button>
      </div>
      <div class="sidebar-nav">
        <a href="index.html" class="sidebar-nav-item active"><span>▤</span><span class="nav-label">Dashboard</span></a>
        <a href="ingredients.html" class="sidebar-nav-item"><span>☰</span><span class="nav-label">Ingredients</span></a>
      </div>
      <div class="sidebar-footer">
        <div class="sidebar-sync-row">
          <span class="sidebar-sync-dot" id="sidebarSyncDot" data-status="idle"></span>
          <span class="nav-label">Synced</span>
        </div>
        <button class="sidebar-settings-btn" id="settingsOpenBtn"><span>⚙</span><span class="nav-label">Settings</span></button>
      </div>
    </div>
    <div class="main-content">
      <div class="page-inner">
```
and change the closing `</main>` tag to `</div></div></div>` (closing `.page-inner`, `.main-content`, `.app-shell`).

- [ ] **Step 2: Repeat for `ingredients.html`**

Same replacement, except the two `sidebar-nav-item` links swap which one has `class="sidebar-nav-item active"` (Ingredients active, Dashboard not).

- [ ] **Step 3: Verify both pages still parse and render without console errors**

Use `preview_start` with name `static-server`, then `preview_eval` to navigate to `http://localhost:8123/index.html`, take a `preview_snapshot`, then navigate to `http://localhost:8123/ingredients.html` and snapshot again. Confirm the sidebar renders with "Dashboard"/"Ingredients" links and no JS console errors from `preview_console_logs` (errors are expected only for the still-missing `mdrInput`/`syncUrlInput` etc. lookups in `navControls.js` — that's expected until Task 3 adds them back; note it and move on, do not fix it in this task).

- [ ] **Step 4: Commit**

```bash
git add index.html ingredients.html
git commit -m "feat: replace top nav with sidebar shell on both pages"
```

---

### Task 3: Settings panel markup + wiring, sidebar collapse/open JS

**Files:**
- Modify: `index.html` (add Settings panel markup before `</body>`)
- Modify: `ingredients.html` (add identical Settings panel markup before `</body>`)
- Modify: `style.css` (panel + settings-specific styles)
- Modify: `src/pages/shared/navControls.js` (fan out sync status to the sidebar dot; add `wireSidebarAndSettings` helper)
- Modify: `src/pages/dashboard.js` and `src/pages/ingredients.js` (call the new `wireSidebarAndSettings` helper)

**Interfaces:**
- Consumes: `#sidebarToggleBtn`, `#settingsOpenBtn`, `#sidebarSyncDot`, `#sidebar` from Task 2.
- Produces: `wireSidebarAndSettings()` exported from `src/pages/shared/navControls.js` — takes no arguments, wires the sidebar collapse toggle and the Settings panel open/close, returns nothing. Later tasks don't depend on its return value, only that it's called once per page.
- Produces: panel CSS classes `.panel-backdrop`, `.panel-backdrop.open`, `.panel`, `.panel-right` (440px variant used by both Settings and, in Task 6, the menu editor), `.panel-header`, `.panel-close-btn`, `.panel-body`, `.settings-section-label`, `.settings-input`, `.settings-sync-row`, `.settings-sync-status`.

- [ ] **Step 1: Add Settings-panel and panel-shell CSS to `style.css`**

Append:
```css
/* SLIDE-OUT PANELS (Settings, Add/Edit Menu) */
.panel-backdrop { display: none; position: fixed; inset: 0; background: rgba(42,31,22,.45); z-index: 100; }
.panel-backdrop.open { display: block; }
.panel { position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 92vw; background: var(--bg); z-index: 101; box-shadow: -8px 0 24px rgba(42,31,22,.18); display: none; flex-direction: column; }
.panel-backdrop.open + .panel, .panel.open { display: flex; }
.panel-right { width: 440px; }
.panel-header { padding: 18px 22px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; flex: none; }
.panel-header h2 { font-weight: 800; font-size: 16px; }
.panel-close-btn { border: none; background: transparent; font-size: 18px; cursor: pointer; color: rgba(42,31,22,.5); }
.panel-body { flex: 1; overflow-y: auto; padding: 20px 22px; }

.settings-section-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(42,31,22,.5); margin-bottom: 6px; }
.settings-input { width: 100%; padding: 8px 10px; border: 1px solid rgba(42,31,22,.2); border-radius: 8px; font-size: 13.5px; margin-bottom: 20px; }
.settings-sync-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 12.5px; color: rgba(42,31,22,.6); }
.settings-sync-row input { width: 56px; padding: 6px 8px; border: 1px solid rgba(42,31,22,.2); border-radius: 6px; font-size: 12.5px; text-align: right; }
.settings-sync-status { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; margin-bottom: 24px; }
.settings-sync-status-label { display: flex; align-items: center; gap: 7px; font-size: 12.5px; }
.settings-sync-status-label .sync-dot { width: 7px; height: 7px; border-radius: 50%; background: #555; }
.settings-sync-status[data-status="idle"] .sync-dot { background: var(--sync-idle); }
.settings-sync-status[data-status="syncing"] .sync-dot { background: #f59e0b; animation: pulseDot 1s infinite; }
.settings-sync-status[data-status="conflict"] .sync-dot, .settings-sync-status[data-status="error"] .sync-dot { background: var(--danger); }
.settings-data-row { display: flex; gap: 8px; }
.settings-data-row .btn { flex: 1; }
```

- [ ] **Step 2: Add the Settings panel markup to `index.html`, immediately before `<script type="module" ...>`**

```html
  <!-- SETTINGS PANEL -->
  <div class="panel-backdrop" id="settingsBackdrop"></div>
  <div class="panel panel-right" id="settingsPanel" style="width:380px">
    <div class="panel-header">
      <h2>Settings</h2>
      <button class="panel-close-btn" id="settingsCloseBtn">✕</button>
    </div>
    <div class="panel-body">
      <div class="settings-section-label">Delivery MDR (%)</div>
      <input type="number" id="mdrInput" min="0" max="100" step="0.1" class="settings-input">

      <div class="settings-section-label">Google Sheets Sync</div>
      <input type="url" id="syncUrlInput" placeholder="Apps Script Web App URL" class="settings-input" style="margin-bottom:10px">
      <div class="settings-sync-row">
        <span>Sync every</span>
        <input type="number" id="syncIntervalInput" min="3" step="1">
        <span>seconds</span>
      </div>
      <div class="settings-sync-status" id="syncStatus" data-status="idle">
        <span class="settings-sync-status-label"><span class="sync-dot"></span><span class="sync-status-text">Idle</span></span>
        <button class="btn btn-ghost btn-sm" id="syncNowBtn">Sync Now</button>
      </div>

      <div class="settings-section-label">Data</div>
      <div class="settings-data-row">
        <button class="btn btn-ghost" id="exportBtn">Export</button>
        <button class="btn btn-ghost" id="importBtn">Import</button>
      </div>
    </div>
  </div>
```

- [ ] **Step 3: Add the identical Settings panel markup to `ingredients.html`** (same block, before its `<script type="module" ...>`)

- [ ] **Step 4: Add `wireSidebarAndSettings` to `src/pages/shared/navControls.js`**

Add this new export (leave `wireMdrControl`, `wireExportImport` untouched; modify `wireSyncControls`'s `setSyncStatus` as shown):

```js
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
```

Then, inside `wireSyncControls`'s `setSyncStatus` function, add the sidebar-dot fan-out:

```js
  function setSyncStatus(status) {
    const el = document.getElementById('syncStatus');
    if (el) {
      el.dataset.status = status;
      const labels = { idle: 'Synced', syncing: 'Syncing...', conflict: 'Conflict', error: 'Error' };
      el.querySelector('.sync-status-text').textContent = labels[status] || status;
    }
    const dot = document.getElementById('sidebarSyncDot');
    if (dot) dot.dataset.status = status;
  }
```
(This replaces the existing `setSyncStatus` body — same function name/signature, just also updates `#sidebarSyncDot`.)

- [ ] **Step 5: Call `wireSidebarAndSettings()` from both page controllers**

In `src/pages/dashboard.js`, add `wireSidebarAndSettings` to the existing import from `./shared/navControls.js` and call it once near the top (next to the existing `wireMdrControl(...)` call):
```js
import { wireMdrControl, wireExportImport, wireSyncControls, wireSidebarAndSettings } from './shared/navControls.js';

wireSidebarAndSettings();
wireMdrControl(() => renderMenus());
```

In `src/pages/ingredients.js`, same import addition, called alongside its existing `wireMdrControl()` call:
```js
import { wireMdrControl, wireExportImport, wireSyncControls, wireSidebarAndSettings } from './shared/navControls.js';

wireSidebarAndSettings();
```
(placed right before the existing `wireMdrControl();` line at the bottom of the file).

- [ ] **Step 6: Verify in browser**

`preview_start` (name `static-server`), navigate to `http://localhost:8123/index.html`, `preview_click` on `#sidebarToggleBtn` (confirm sidebar collapses via `preview_inspect` on `#sidebar` checking width), `preview_click` on `#settingsOpenBtn` (confirm `#settingsPanel` becomes visible via `preview_snapshot`), fill `#mdrInput` with a value and confirm no console errors via `preview_console_logs`. Repeat the settings-open check on `ingredients.html`.

- [ ] **Step 7: Run the existing unit test suite to confirm nothing outside the UI broke**

Run: `npm test`
Expected: all existing tests pass (this task touches no domain/sync/io code, so this is a regression guard, not a feature test).

- [ ] **Step 8: Commit**

```bash
git add index.html ingredients.html style.css src/pages/shared/navControls.js src/pages/dashboard.js src/pages/ingredients.js
git commit -m "feat: add Settings slide-out panel and sidebar collapse behavior"
```

---

### Task 4: Fixed Costs table restyle (Dashboard)

**Files:**
- Modify: `style.css` (table/inline-edit/tooltip styles, dashed add-row card)
- Modify: `src/render/fixedCosts.js` (swap classes only — no structural/behavioral change; tooltip markup moves next to the Apply-all button)
- Modify: `index.html` (wrap the Fixed Costs `<section>` in the new `.page-header`/`.card` structure)

**Interfaces:**
- Consumes: `.card`, `.btn*` from Task 1.
- Produces: `.data-table` (restyled `<table>` class, used again in Task 5/7), `.data-table thead`, `.data-table td.editing-row` (inline-edit background band), `.apply-all-tip` (repositioned tooltip class, replaces the old `.auto-add-tip`), `.add-row-card` (dashed-border inline-add form wrapper, reused in Task 7 for Ingredients).

- [ ] **Step 1: Add table/tooltip/add-row CSS to `style.css`**

Replace the existing `/* TABLES */` block and the `/* ADD ROW */` block with:
```css
/* TABLES */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(42,31,22,.4); border-bottom: 1px solid var(--card-border); padding: 9px 16px; }
.data-table th.text-right, .data-table td.text-right { text-align: right; }
.data-table td { padding: 11px 16px; border-bottom: 1px solid rgba(42,31,22,.06); vertical-align: middle; font-size: 13.5px; }
.data-table tr:last-child td { border-bottom: none; }
.data-table td input[type="text"], .data-table td input[type="number"] { width: 100%; padding: 5px 7px; border: 1px solid rgba(42,31,22,.2); border-radius: 6px; font-size: 12.5px; }
.data-table tr.editing-row td { background: #fbf1e6; }

.apply-all-tip { position: absolute; top: calc(100% + 6px); right: 0; background: #2a1f14; color: #fff; font-size: 11px; padding: 6px 10px; border-radius: 6px; white-space: nowrap; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,.2); }

/* ADD ROW */
.add-row { margin-top: 10px; }
.add-row-card { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; padding: 14px 16px; background: var(--card-bg); border: 1px dashed rgba(42,31,22,.25); border-radius: 12px; margin-top: 10px; }
.add-row-card input { padding: 7px 10px; border: 1px solid rgba(42,31,22,.2); border-radius: 6px; font-size: 13px; }
.add-row-card input[name="name"] { flex: 1; min-width: 140px; }
.add-row-card input[name="bulkQty"], .add-row-card input[name="bulkPrice"] { width: 90px; }
.add-row-card input[name="bulkUnit"] { width: 70px; }
```

- [ ] **Step 2: Update `src/render/fixedCosts.js` to use the new classes and reposition the tooltip**

Replace the whole file with:
```js
import { esc } from '../domain/escape.js';
import { fmt } from '../domain/format.js';
import { costPerUnit } from '../domain/calc.js';

function renderActionsCell(fc) {
  const autoAddQty = fc.autoAddQty || 0;
  const applyAllStyle = autoAddQty > 0 ? '' : 'color:rgba(42,31,22,.3)';
  return `<td class="text-right">
    <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(fc.id)}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(fc.id)}">Delete</button>
      </div>
      <div style="display:flex;gap:6px;position:relative">
        <button class="btn btn-ghost btn-sm" data-action="apply-all" data-id="${esc(fc.id)}" style="${applyAllStyle}">Apply all</button>
        <span class="apply-all-tip" data-tip-id="${esc(fc.id)}" style="display:none">Set an Auto-Add Qty above 0 first</span>
        <button class="btn btn-ghost btn-sm" data-action="remove-all" data-id="${esc(fc.id)}">Remove all</button>
      </div>
    </div>
  </td>`;
}

export function renderFixedCostRow(fc) {
  const cpu = costPerUnit(fc);
  const autoAddQty = fc.autoAddQty || 0;
  return `<tr data-id="${esc(fc.id)}">
    <td style="font-weight:600">${esc(fc.name)}</td>
    <td class="text-right">${fc.bulkQty}</td>
    <td style="color:rgba(42,31,22,.55)">${esc(fc.bulkUnit)}</td>
    <td class="text-right">฿${fmt(fc.bulkPrice)}</td>
    <td class="text-right" style="font-weight:700">฿${fmt(cpu)}</td>
    <td class="text-right"><input type="number" class="auto-add-qty" min="0" step="any" value="${autoAddQty}" style="width:70px;text-align:right"></td>
    ${renderActionsCell(fc)}
  </tr>`;
}

export function renderFixedCostTable(list) {
  return list.length === 0
    ? '<tr><td colspan="7" style="color:rgba(42,31,22,.4);padding:16px">No fixed cost items yet.</td></tr>'
    : list.map(renderFixedCostRow).join('');
}

export function renderFixedCostEditCells(fc) {
  return `
    <td colspan="7">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input name="name" value="${esc(fc.name)}" placeholder="Name" style="flex:1;min-width:120px">
        <input name="bulkQty" type="number" value="${fc.bulkQty}" min="0.001" step="any" placeholder="Qty" style="width:80px">
        <input name="bulkUnit" value="${esc(fc.bulkUnit)}" placeholder="Unit" style="width:70px">
        <input name="bulkPrice" type="number" value="${fc.bulkPrice}" min="0" step="any" placeholder="Price" style="width:90px">
        <button class="btn btn-primary btn-sm" data-action="save-edit" data-id="${esc(fc.id)}">Save</button>
        <button class="btn btn-ghost btn-sm" data-action="cancel-edit">Cancel</button>
      </div>
    </td>`;
}
```

Note: `renderFixedCostEditCells` changes from 7 separate `<td>`s to one `colspan="7"` cell containing a flex row — this matches the mockup's inline-edit band (a single continuous row rather than per-column inputs) and is simpler to style consistently. The row's `<tr>` still needs the `editing-row` class added by the caller (Task 4 Step 3 below).

- [ ] **Step 3: Update `src/pages/dashboard.js`'s `startFcEdit` and tooltip-show logic to match the new markup**

Replace `startFcEdit`:
```js
function startFcEdit(id) {
  const fc = repo.getFixedCosts().find(x => x.id === id);
  if (!fc) return;
  const row = fcBody.querySelector(`tr[data-id="${id}"]`);
  row.classList.add('editing-row');
  row.innerHTML = renderFixedCostEditCells(fc);
}
```

Replace `showAutoAddTooltip`:
```js
function showAutoAddTooltip(id) {
  const tip = fcBody.querySelector(`.apply-all-tip[data-tip-id="${id}"]`);
  if (!tip) return;
  tip.style.display = 'block';
  clearTimeout(tip._hideTimer);
  tip._hideTimer = setTimeout(() => { tip.style.display = 'none'; }, 2000);
}
```
(Both changes are drop-in replacements for the existing functions of the same name — no other call sites change.)

- [ ] **Step 4: Wrap the Fixed Costs section markup in `index.html` with the new header/card structure**

Replace:
```html
    <!-- FIXED COSTS SECTION -->
    <section>
      <h2>Fixed Cost Items</h2>
      <table id="fcTable">
        <thead>
          <tr>
            <th>Name</th><th>Bulk Qty</th><th>Unit</th><th>Bulk Price (฿)</th><th>Cost / Unit (฿)</th><th>Auto-Add Qty</th><th></th>
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
```
with:
```html
    <!-- FIXED COSTS SECTION -->
    <section>
      <div class="page-header">
        <h2>Fixed Costs</h2>
        <button class="btn btn-primary" id="showFcAddBtn">+ Add Fixed Cost Item</button>
      </div>
      <div class="card">
        <div style="overflow-x:auto">
          <table class="data-table" id="fcTable" style="min-width:840px">
            <thead>
              <tr>
                <th>Name</th><th class="text-right">Bulk Qty</th><th>Unit</th><th class="text-right">Bulk ฿</th><th class="text-right">Cost/Unit</th><th class="text-right">Auto-Add Qty</th><th></th>
              </tr>
            </thead>
            <tbody id="fcBody"></tbody>
          </table>
        </div>
      </div>
      <form id="fcAddForm" class="add-row-card" style="display:none">
        <input name="name" placeholder="Name" required>
        <input name="bulkQty" type="number" min="0.001" step="any" placeholder="Qty" required>
        <input name="bulkUnit" placeholder="Unit" required>
        <input name="bulkPrice" type="number" min="0" step="any" placeholder="Price (฿)" required>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
        <button type="button" class="btn btn-ghost btn-sm" id="cancelFcBtn">Cancel</button>
      </form>
      <div class="error-msg" id="fcError"></div>
    </section>
```
(The "+ Add Fixed Cost Item" button moves to the header row per the mockup; `#showFcAddBtn`, `#fcAddForm`, `#cancelFcBtn`, `#fcError` keep the same IDs so `dashboard.js`'s existing `showFcAddBtn`/`cancelFcBtn` wiring and `fcAddForm` submit handler need no changes.)

- [ ] **Step 5: Verify in browser**

`preview_start`, navigate to `http://localhost:8123/index.html`, `preview_snapshot` to confirm the Fixed Costs table renders with the new header styling, `preview_click` "Edit" on a row and confirm it becomes an inline edit band (`preview_inspect` the row for `background`), set an Auto-Add Qty to 0 and click "Apply all" to confirm the tooltip appears (`preview_snapshot` or `preview_eval` checking the tooltip's computed `display`).

- [ ] **Step 6: Commit**

```bash
git add style.css src/render/fixedCosts.js src/pages/dashboard.js index.html
git commit -m "style: restyle Fixed Costs table, inline edit, and add-row form"
```

---

### Task 5: Menu cards restyle + collapsible Details

**Files:**
- Modify: `style.css` (menu-card layout, total-cost badge, profit summary, details section)
- Modify: `src/render/menus.js` (restructure `renderMenuCard` markup; add `isExpanded` parameter)
- Modify: `src/pages/dashboard.js` (track expanded-card ids; wire the Details toggle button; wrap Menus section markup)
- Modify: `index.html` (wrap Menus section in `.page-header`)

**Interfaces:**
- Consumes: `.card`, `.btn*` from Task 1.
- Produces: `renderMenuCard(menu, deps, isExpanded)` — third parameter added (defaults false via caller), returns the card HTML with the Details block rendered but `display:none` unless `isExpanded` is true. `renderMenuGrid(menus, deps, expandedIds)` — third parameter, a `Set` of expanded menu ids, threaded through to each card.

- [ ] **Step 1: Add menu-card CSS to `style.css`**

Replace the existing `/* MENU CARDS */` block (through `.profit-neg`) with:
```css
/* MENU CARDS */
.menu-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 16px 18px; margin-bottom: 12px; }
.menu-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.menu-card-name { font-weight: 700; font-size: 15.5px; }
.menu-card-actions { display: flex; gap: 6px; }
.menu-card-total { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; background: #fbf1e6; border-radius: 8px; margin-bottom: 14px; }
.menu-card-total-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; color: rgba(42,31,22,.55); font-weight: 700; }
.menu-card-total-value { font-size: 19px; font-weight: 800; color: var(--ink); line-height: 1; }
.menu-card-channels { display: flex; gap: 28px; }
.menu-card-channel-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; color: rgba(42,31,22,.45); font-weight: 700; margin-bottom: 3px; }
.menu-card-profit { font-size: 16px; font-weight: 800; }
.menu-card-profit .margin { font-size: 12px; font-weight: 600; }
.profit-pos { color: var(--success); }
.profit-neg { color: var(--danger); }
.menu-card-details { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--card-border); }
.menu-card-details-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; color: rgba(42,31,22,.4); font-weight: 700; margin-bottom: 6px; }
.menu-card-details-line { display: flex; justify-content: space-between; font-size: 12.5px; padding: 3px 0; color: rgba(42,31,22,.75); }
.menu-card-details-total { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; padding: 8px 0 0; margin-top: 6px; border-top: 1px solid var(--card-border); }
```

- [ ] **Step 2: Rewrite `src/render/menus.js`**

```js
import { esc } from '../domain/escape.js';
import { fmt, fmtPct } from '../domain/format.js';
import { calcMenu, costPerUnit } from '../domain/calc.js';

export function profitClass(n) {
  return n >= 0 ? 'profit-pos' : 'profit-neg';
}

function channelBlock(label, price, profit, margin) {
  const sign = profit >= 0 ? '+' : '-';
  return `<div>
    <div class="menu-card-channel-label">${esc(label)} · ฿${fmt(price)}</div>
    <div class="menu-card-profit ${profitClass(profit)}">${sign}฿${fmt(Math.abs(profit))} <span class="margin">(${fmtPct(margin)})</span></div>
  </div>`;
}

export function renderMenuCard(menu, { ingredients, fixedCosts, mdr }, isExpanded = false) {
  const r = calcMenu(menu, { ingredients, fixedCosts, mdr });
  const ingLines = menu.ingredients.map(row => {
    const ing = ingredients.find(i => i.id === row.ingredientId);
    if (!ing) return '';
    return `<div class="menu-card-details-line"><span>${esc(ing.name)} × ${row.qty} ${esc(ing.bulkUnit)}</span><span>฿${fmt(costPerUnit(ing) * row.qty)}</span></div>`;
  }).join('');
  const fcLines = menu.fixedCostItems.map(row => {
    const fc = fixedCosts.find(f => f.id === row.fixedCostItemId);
    if (!fc) return '';
    return `<div class="menu-card-details-line"><span>${esc(fc.name)} × ${row.qty} ${esc(fc.bulkUnit)}</span><span>฿${fmt(costPerUnit(fc) * row.qty)}</span></div>`;
  }).join('');

  return `<div class="menu-card" data-id="${esc(menu.id)}">
    <div class="menu-card-header">
      <div class="menu-card-name">${esc(menu.name)}</div>
      <div class="menu-card-actions">
        <button class="btn btn-ghost btn-sm" data-action="toggle-details" data-id="${esc(menu.id)}">${isExpanded ? '▾' : '▸'} Details</button>
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(menu.id)}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(menu.id)}">Delete</button>
      </div>
    </div>
    <div class="menu-card-total">
      <span class="menu-card-total-label">Total Cost</span>
      <span class="menu-card-total-value">฿${fmt(r.totalCost)}</span>
    </div>
    <div class="menu-card-channels">
      ${channelBlock('Front Store', menu.frontStorePrice, r.frontProfit, r.frontMargin)}
      ${channelBlock('Delivery', menu.deliveryPrice, r.deliveryProfit, r.deliveryMargin)}
    </div>
    <div class="menu-card-details" style="${isExpanded ? '' : 'display:none'}">
      <div class="menu-card-details-label">Ingredients</div>
      ${ingLines}
      <div class="menu-card-details-label" style="margin-top:10px">Fixed Costs</div>
      ${fcLines}
      <div class="menu-card-details-total"><span>Total Cost</span><span>฿${fmt(r.totalCost)}</span></div>
    </div>
  </div>`;
}

export function renderMenuGrid(menus, deps, expandedIds = new Set()) {
  return menus.length === 0
    ? '<p style="color:rgba(42,31,22,.4)">No menus yet. Click "+ Add Menu" to get started.</p>'
    : menus.map(menu => renderMenuCard(menu, deps, expandedIds.has(menu.id))).join('');
}
```

- [ ] **Step 3: Update `src/pages/dashboard.js` to track expanded state and wire the toggle**

Add a module-level `Set` near the top (next to the other `const`s):
```js
const expandedMenuIds = new Set();
```

Update `renderMenus`:
```js
function renderMenus() {
  menuGrid.innerHTML = renderMenuGrid(repo.getMenus(), {
    ingredients: repo.getIngredients(),
    fixedCosts: repo.getFixedCosts(),
    mdr: repo.getMDR(),
  }, expandedMenuIds);
}
```

Update the `menuGrid` click handler to add the new action:
```js
menuGrid.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'edit') openEditMenu(id);
  else if (action === 'delete') doDeleteMenu(id);
  else if (action === 'toggle-details') {
    if (expandedMenuIds.has(id)) expandedMenuIds.delete(id); else expandedMenuIds.add(id);
    renderMenus();
  }
});
```

- [ ] **Step 4: Wrap the Menus section header in `index.html`**

Replace:
```html
    <!-- MENUS SECTION -->
    <section>
      <h2>Menus</h2>
      <div style="margin-bottom:14px">
        <button class="btn btn-primary" id="addMenuBtn">+ Add Menu</button>
      </div>
      <div class="menu-grid" id="menuGrid"></div>
    </section>
```
with:
```html
    <!-- MENUS SECTION -->
    <section style="margin-top:36px">
      <div class="page-header">
        <h2>Menus</h2>
        <button class="btn btn-primary" id="addMenuBtn">+ Add Menu</button>
      </div>
      <div id="menuGrid"></div>
    </section>
```
(`.menu-grid`'s CSS grid rule in `style.css` is no longer used since cards now stack vertically per the mockup — remove the `.menu-grid` rule from `style.css` in this step too, replacing it with nothing, since `#menuGrid` needs no special layout CSS now that cards are full-width stacked blocks.)

- [ ] **Step 5: Verify in browser**

`preview_start`, navigate to `http://localhost:8123/index.html`, `preview_snapshot` to confirm menu cards show the Total Cost badge and Front/Delivery summary with no breakdown visible by default, `preview_click` a card's "▸ Details" button and confirm the breakdown appears and the glyph flips to "▾" (`preview_snapshot` again), click again to confirm it collapses.

- [ ] **Step 6: Commit**

```bash
git add style.css src/render/menus.js src/pages/dashboard.js index.html
git commit -m "feat: restyle menu cards with total-cost badge and collapsible Details"
```

---

### Task 6: Add/Edit Menu modal → right slide-in panel

**Files:**
- Modify: `style.css` (menu-panel-specific rows: ingredient/fixed-cost line rows, live-preview footer — reusing `.panel*` from Task 3)
- Modify: `index.html` (change `#menuModal` markup from `.modal-backdrop`/`.modal` to `.panel-backdrop`/`.panel.panel-right`)
- Modify: `src/render/menuModal.js` (restyle row/preview HTML fragments to match new classes)

**Interfaces:**
- Consumes: `.panel-backdrop`, `.panel`, `.panel-right`, `.panel-header`, `.panel-close-btn`, `.panel-body` from Task 3.
- Produces: `.menu-panel-line` (ingredient/fixed-cost row inside the panel), `.menu-panel-picker` (select + qty + add-button row), `.menu-panel-footer` (sticky live-preview + Save/Cancel footer) — new classes only used by this modal, no other task depends on them.

- [ ] **Step 1: Rewrite `src/render/menuModal.js`**

The current file renders each row as `<div class="row-item">...</div>` and the preview as a plain `<table>` with hardcoded hex colors. Replace the whole file with:

```js
import { esc } from '../domain/escape.js';
import { fmt, fmtPct } from '../domain/format.js';

function renderOptions(items, selectedId) {
  return items.map(i => `<option value="${esc(i.id)}" ${i.id === selectedId ? 'selected' : ''}>${esc(i.name)} (${esc(i.bulkUnit)})</option>`).join('');
}

export function renderIngRow(ingredients, ingredientId = '', qty = '') {
  const ing = ingredients.find(i => i.id === ingredientId);
  const unit = ing ? ing.bulkUnit : '';
  return `<div class="row-item menu-panel-line">
    <select class="ing-select">${renderOptions(ingredients, ingredientId)}</select>
    <input type="number" class="ing-qty" value="${qty}" min="0.001" step="any" placeholder="Qty">
    <span class="unit-label">${esc(unit)}</span>
    <button type="button" class="btn btn-danger btn-sm" data-action="remove-row">✕</button>
  </div>`;
}

export function renderFcRow(fixedCosts, fixedCostItemId = '', qty = '') {
  const fc = fixedCosts.find(f => f.id === fixedCostItemId);
  const unit = fc ? fc.bulkUnit : '';
  return `<div class="row-item menu-panel-line">
    <select class="fc-select">${renderOptions(fixedCosts, fixedCostItemId)}</select>
    <input type="number" class="fc-qty" value="${qty}" min="0.001" step="any" placeholder="Qty">
    <span class="unit-label">${esc(unit)}</span>
    <button type="button" class="btn btn-danger btn-sm" data-action="remove-row">✕</button>
  </div>`;
}

export function renderPreview(r, mdr) {
  return `<table style="width:100%;font-size:12px">
    <tr><td>Ingredient Cost</td><td style="text-align:right">฿${fmt(r.ingredientCost)}</td></tr>
    <tr><td>Fixed Cost</td><td style="text-align:right">฿${fmt(r.fixedCost)}</td></tr>
    <tr style="font-weight:700"><td>Total Cost</td><td style="text-align:right">฿${fmt(r.totalCost)}</td></tr>
    <tr><td colspan="2" style="padding-top:6px;color:rgba(42,31,22,.4);font-size:11px">FRONT STORE</td></tr>
    <tr><td>Profit</td><td style="text-align:right;font-weight:700;color:${r.frontProfit >= 0 ? '#2f7d43' : '#b23b3b'}">฿${fmt(r.frontProfit)} (${fmtPct(r.frontMargin)})</td></tr>
    <tr><td colspan="2" style="padding-top:6px;color:rgba(42,31,22,.4);font-size:11px">DELIVERY (MDR ${fmtPct(mdr * 100)})</td></tr>
    <tr><td>Net Revenue</td><td style="text-align:right">฿${fmt(r.deliveryNet)}</td></tr>
    <tr><td>Profit</td><td style="text-align:right;font-weight:700;color:${r.deliveryProfit >= 0 ? '#2f7d43' : '#b23b3b'}">฿${fmt(r.deliveryProfit)} (${fmtPct(r.deliveryMargin)})</td></tr>
  </table>`;
}
```

This keeps every class hook `dashboard.js` queries (`.ing-select`, `.ing-qty`, `.fc-select`, `.fc-qty`, `.unit-label`, `[data-action="remove-row"]`) exactly as-is — only the row wrapper gains the additional `menu-panel-line` class, and the preview's hardcoded colors switch to the new palette's success/danger hex values.

- [ ] **Step 2: Add panel-specific row/footer CSS to `style.css`**

Append:
```css
/* MENU EDIT PANEL */
.menu-panel-line { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.menu-panel-line .unit-label { font-size: 11.5px; color: rgba(42,31,22,.5); min-width: 26px; }
.menu-panel-line input[type="number"] { width: 64px; padding: 5px 7px; border: 1px solid rgba(42,31,22,.2); border-radius: 6px; font-size: 12.5px; text-align: right; }
.menu-panel-picker { display: flex; align-items: center; gap: 8px; margin: 10px 0 4px; }
.menu-panel-picker select { flex: 1; padding: 6px 8px; border: 1px solid rgba(42,31,22,.2); border-radius: 6px; font-size: 12.5px; }
.menu-panel-picker input[type="number"] { width: 60px; padding: 6px 7px; border: 1px solid rgba(42,31,22,.2); border-radius: 6px; font-size: 12.5px; }
.menu-panel-footer { flex: none; padding: 14px 22px; border-top: 1px solid var(--card-border); background: var(--card-bg); }
.menu-panel-footer-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.menu-panel-footer-channels { display: flex; gap: 16px; margin-bottom: 12px; font-size: 12.5px; }
```

- [ ] **Step 3: Replace the `#menuModal` block in `index.html`**

Replace the existing:
```html
  <!-- MENU MODAL -->
  <div class="modal-backdrop" id="menuModal">
    <div class="modal">
```
opening two lines with:
```html
  <!-- MENU PANEL -->
  <div class="panel-backdrop" id="menuModalBackdrop"></div>
  <div class="panel panel-right" id="menuModal">
```
and its closing:
```html
    </div>
  </div>
```
stays as one closing `</div>` for `#menuModal` (remove the extra nested `.modal` closing div — the new structure has one fewer wrapper level). Wrap the modal's inner content (`<h2 id="modalTitle">` through the `.modal-actions` div) with `<div class="panel-header"><h2 id="modalTitle">Add Menu</h2></div><div class="panel-body">...</div>`, moving the existing `.modal-actions` buttons into a new `.menu-panel-footer` block at the end alongside the live-preview box:

```html
  <!-- MENU PANEL -->
  <div class="panel-backdrop" id="menuModalBackdrop"></div>
  <div class="panel panel-right" id="menuModal">
    <div class="panel-header">
      <h2 id="modalTitle">Add Menu</h2>
      <button class="panel-close-btn" id="cancelMenuBtn">✕</button>
    </div>
    <div class="panel-body">
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

      <div class="error-msg" id="menuError"></div>
    </div>
    <div class="menu-panel-footer">
      <div class="preview-box" id="previewBox">
        <h4>Live Preview</h4>
        <div id="previewContent" style="color:rgba(42,31,22,.4);font-size:12px">Fill in ingredients and prices to see profit.</div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="cancelMenuBtnFooter">Cancel</button>
        <button class="btn btn-primary" id="saveMenuBtn">Save Menu</button>
      </div>
    </div>
  </div>
```

Note the panel header's "✕" reuses id `cancelMenuBtn` (same behavior as before — closes without saving) and the footer adds a second, equivalent Cancel button `cancelMenuBtnFooter` for parity with the mockup's footer layout — `dashboard.js`'s existing `document.getElementById('cancelMenuBtn').onclick = ...` line needs one more line right after it:
```js
document.getElementById('cancelMenuBtnFooter').onclick = () => modal.classList.remove('open');
```
Also update the modal-open/close code in `dashboard.js` (`openAddMenu`, `openEditMenu`, and the two cancel handlers) to toggle the backdrop too — replace every `modal.classList.add('open')` with:
```js
modal.classList.add('open'); document.getElementById('menuModalBackdrop').classList.add('open');
```
and every `modal.classList.remove('open')` with:
```js
modal.classList.remove('open'); document.getElementById('menuModalBackdrop').classList.remove('open');
```
Also change the stray backdrop-click-to-close listener:
```js
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
```
to listen on the new backdrop element instead:
```js
document.getElementById('menuModalBackdrop').addEventListener('click', () => {
  modal.classList.remove('open');
  document.getElementById('menuModalBackdrop').classList.remove('open');
});
```

- [ ] **Step 4: Verify in browser**

`preview_start`, navigate to `http://localhost:8123/index.html`, `preview_click` "+ Add Menu", confirm via `preview_snapshot`/`preview_inspect` that the panel slides in from the right (check `#menuModal`'s computed `right`/`position`), fill in a menu name and prices, confirm the live preview updates, click Save, confirm the panel closes and the new menu card appears. Then click Edit on that card and confirm the panel reopens pre-filled.

- [ ] **Step 5: Commit**

```bash
git add style.css index.html src/render/menuModal.js src/pages/dashboard.js
git commit -m "feat: convert Add/Edit Menu modal to right slide-in panel"
```

---

### Task 7: Ingredients page restyle + "Used In" column

**Files:**
- Modify: `index.html` — N/A (this task is `ingredients.html` only)
- Modify: `ingredients.html` (wrap section in `.page-header`/`.card`, restyle add-row form)
- Modify: `src/render/ingredients.js` (add `usedInCounts` parameter, new "Used In" column, restyled classes)
- Modify: `src/pages/ingredients.js` (compute usage counts before rendering)

**Interfaces:**
- Consumes: `.data-table`, `.card`, `.add-row-card`, `.page-header` from Tasks 1/4.
- Produces: `renderIngredientTable(list, usedInCounts)` — second parameter, a `Map` from ingredient id to menu-count (or `undefined`/missing entries treated as 0). `renderIngredientRow(ing, usedInCount)` — second parameter, a plain number.

- [ ] **Step 1: Rewrite `src/render/ingredients.js`**

```js
import { esc } from '../domain/escape.js';
import { fmt } from '../domain/format.js';
import { costPerUnit } from '../domain/calc.js';

export function renderIngredientRow(ing, usedInCount = 0) {
  const cpu = costPerUnit(ing);
  const usedInLabel = usedInCount === 0 ? '—' : `used in ${usedInCount} ${usedInCount === 1 ? 'menu' : 'menus'}`;
  return `<tr data-id="${esc(ing.id)}">
    <td style="font-weight:600">${esc(ing.name)}</td>
    <td class="text-right">${ing.bulkQty}</td>
    <td style="color:rgba(42,31,22,.55)">${esc(ing.bulkUnit)}</td>
    <td class="text-right">฿${fmt(ing.bulkPrice)}</td>
    <td class="text-right" style="font-weight:700">฿${fmt(cpu)}</td>
    <td style="color:rgba(42,31,22,.45);font-size:12px">${usedInLabel}</td>
    <td class="text-right">
      <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(ing.id)}">Edit</button>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(ing.id)}">Delete</button>
    </td>
  </tr>`;
}

export function renderIngredientTable(list, usedInCounts = new Map()) {
  return list.length === 0
    ? '<tr><td colspan="7" style="color:rgba(42,31,22,.4);padding:16px">No ingredients yet.</td></tr>'
    : list.map(ing => renderIngredientRow(ing, usedInCounts.get(ing.id) || 0)).join('');
}

export function renderIngredientEditCells(ing) {
  return `
    <td colspan="7">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input name="name" value="${esc(ing.name)}" placeholder="Name" style="flex:1;min-width:120px">
        <input name="bulkQty" type="number" value="${ing.bulkQty}" min="0.001" step="any" placeholder="Qty" style="width:80px">
        <input name="bulkUnit" value="${esc(ing.bulkUnit)}" placeholder="Unit" style="width:70px">
        <input name="bulkPrice" type="number" value="${ing.bulkPrice}" min="0" step="any" placeholder="Price" style="width:90px">
        <button class="btn btn-primary btn-sm" data-action="save-edit" data-id="${esc(ing.id)}">Save</button>
        <button class="btn btn-ghost btn-sm" data-action="cancel-edit">Cancel</button>
      </div>
    </td>`;
}
```
(Same `colspan` inline-edit-band pattern as Task 4's fixed-cost rewrite, for visual consistency.)

- [ ] **Step 2: Update `src/pages/ingredients.js`'s `renderIngredients` and `startEdit` to compute usage counts and add the `editing-row` class**

Replace `renderIngredients`:
```js
function renderIngredients() {
  const ingredients = repo.getIngredients();
  const usedInCounts = new Map(ingredients.map(ing => [ing.id, repo.ingredientUsedBy(ing.id).length]));
  tbody.innerHTML = renderIngredientTable(ingredients, usedInCounts);
}
```

Replace `startEdit`:
```js
function startEdit(id) {
  const ing = repo.getIngredients().find(x => x.id === id);
  if (!ing) return;
  const row = tbody.querySelector(`tr[data-id="${id}"]`);
  row.classList.add('editing-row');
  row.innerHTML = renderIngredientEditCells(ing);
}
```

- [ ] **Step 3: Wrap the section markup in `ingredients.html`**

Replace:
```html
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
```
with:
```html
    <section>
      <div class="page-header">
        <h2>Ingredients</h2>
        <button class="btn btn-primary" id="showAddBtn">+ Add Ingredient</button>
      </div>
      <div class="card">
        <div style="overflow-x:auto">
          <table class="data-table" id="ingTable" style="min-width:860px">
            <thead>
              <tr>
                <th>Name</th><th class="text-right">Bulk Qty</th><th>Unit</th><th class="text-right">Bulk ฿</th><th class="text-right">Cost/Unit</th><th>Used In</th><th></th>
              </tr>
            </thead>
            <tbody id="ingBody"></tbody>
          </table>
        </div>
      </div>
      <form id="addForm" class="add-row-card" style="display:none">
        <input name="name" placeholder="Name" required>
        <input name="bulkQty" type="number" min="0.001" step="any" placeholder="Qty" required>
        <input name="bulkUnit" placeholder="Unit (g/ml/pcs)" required>
        <input name="bulkPrice" type="number" min="0" step="any" placeholder="Price (฿)" required>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
        <button type="button" class="btn btn-ghost btn-sm" id="cancelAddBtn">Cancel</button>
      </form>
      <div class="error-msg" id="addError"></div>
    </section>
```
(`#showAddBtn` moves to the header, same id, so the existing `document.getElementById('showAddBtn').onclick` wiring is untouched.)

- [ ] **Step 4: Verify in browser**

`preview_start`, navigate to `http://localhost:8123/ingredients.html`, `preview_snapshot` to confirm the "Used In" column shows "—" for unused ingredients. Then navigate to `http://localhost:8123/index.html`, add a menu that references one of those ingredients, navigate back to `http://localhost:8123/ingredients.html` and reload, confirm that ingredient's row now shows "used in 1 menu".

- [ ] **Step 5: Commit**

```bash
git add ingredients.html src/render/ingredients.js src/pages/ingredients.js
git commit -m "feat: restyle Ingredients table and add Used In column"
```

---

### Task 8: Restyle Conflict modal and bulk-action dialogs

**Files:**
- Modify: `style.css` (restyle `.modal-backdrop`/`.modal`/`.conflict-*`/`.error-msg`/`.quick-add-form`/`.row-item` to the new palette — these stay centered dialogs, not slide-out panels)

**Interfaces:**
- Consumes: nothing new — this task only changes colors/typography of existing classes (`.modal-backdrop`, `.modal`, `.modal h2`, `.modal label`, `.modal-actions`, `.conflict-modal`, `.conflict-subtitle`, `.conflict-counter`, `.conflict-sides`, `.conflict-side-label`, `.conflict-data`, `.quick-add-form`, `.row-item`, `.preview-box`, `.error-msg`). No markup or JS changes anywhere — `src/ui/conflictModal.js`, `dashboard.js`'s bulk-confirm/overlay code are untouched.

- [ ] **Step 1: Replace the `/* MODAL */` block in `style.css`**

```css
/* MODAL (Conflict, Bulk Confirm/Overlay) */
.modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(42,31,22,.45); z-index: 200; align-items: center; justify-content: center; }
.modal-backdrop.open { display: flex; }
.modal { background: var(--bg); border-radius: 14px; padding: 24px; width: 540px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 16px 40px rgba(42,31,22,.3); }
.modal h2 { font-size: 16px; font-weight: 800; margin-bottom: 16px; }
.modal label { display: block; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(42,31,22,.5); margin-bottom: 6px; margin-top: 16px; }
.modal input[type="text"], .modal input[type="number"], .modal select {
  width: 100%; padding: 8px 10px; border: 1px solid rgba(42,31,22,.2); border-radius: 8px; font-size: 13.5px;
}
.row-list { margin-top: 8px; }
.row-item { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; font-size: 13px; }
.row-item select { flex: 1; }
.row-item input[type="number"] { width: 80px; }
.row-item .unit-label { color: rgba(42,31,22,.5); min-width: 28px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.preview-box { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 10px; padding: 10px 14px; margin-top: 14px; font-size: 13px; }
.preview-box h4 { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(42,31,22,.45); margin-bottom: 6px; }
```

- [ ] **Step 2: Replace the `/* QUICK-ADD INLINE */` block**

```css
/* QUICK-ADD INLINE */
.quick-add-form { background: #fbf1e6; border-radius: 8px; padding: 10px; margin-top: 8px; font-size: 13px; }
.quick-add-form .form-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.quick-add-form input { padding: 6px 8px; border: 1px solid rgba(42,31,22,.2); border-radius: 6px; font-size: 12.5px; }
.quick-add-form input[name="name"] { width: 140px; }
.quick-add-form input[name="bulkQty"], .quick-add-form input[name="bulkPrice"] { width: 80px; }
.quick-add-form input[name="bulkUnit"] { width: 60px; }
```

- [ ] **Step 3: Replace the `/* CONFLICT MODAL */` block**

```css
/* CONFLICT MODAL */
.conflict-modal { width: 680px; }
.conflict-subtitle { color: rgba(42,31,22,.65); font-size: 13.5px; line-height: 1.5; margin-bottom: 8px; }
.conflict-counter { font-size: 12px; color: rgba(42,31,22,.5); margin-bottom: 14px; }
.conflict-sides { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.conflict-side-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: rgba(42,31,22,.5); margin-bottom: 6px; letter-spacing: .4px; }
.conflict-data { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; padding: 10px 12px; font-size: 12px; font-family: monospace; white-space: pre-wrap; word-break: break-word; min-height: 80px; color: var(--text); }
```

- [ ] **Step 4: Update `.error-msg` and remaining utility colors**

Replace:
```css
.error-msg { color: #dc2626; font-size: 12px; margin-top: 4px; }
```
with:
```css
.error-msg { color: var(--danger); font-size: 12px; margin-top: 4px; }
```
and update `.text-sm` from `color:#888` to `color:rgba(42,31,22,.4)`.

- [ ] **Step 5: Verify in browser**

`preview_start`, on `http://localhost:8123/index.html` open the Add Menu panel, use "+ New ingredient (quick add)" to confirm the quick-add form now uses the tan `#fbf1e6` background. Trigger a bulk action ("Apply all" with qty > 0) to confirm `bulkConfirmModal` renders with the new centered-dialog styling (rounded `--bg` background, shadow). Confirm no console errors via `preview_console_logs`.

- [ ] **Step 6: Commit**

```bash
git add style.css
git commit -m "style: restyle conflict/bulk-confirm modals and shared dialog chrome to new palette"
```

---

### Task 9: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite**

Run: `npm test`
Expected: all tests in `test/domain`, `test/records`, `test/importExport`, `test/sync` pass (this redesign touches none of that code — a failure here means a stray edit leaked outside the UI layer, and must be tracked down and fixed before proceeding).

- [ ] **Step 2: Full manual walkthrough on Dashboard**

`preview_start`, navigate to `http://localhost:8123/index.html`:
- Add a fixed cost item, edit it inline, delete it.
- Set an Auto-Add Qty > 0 on a fixed cost item, click "Apply all", confirm the bulk dialog, confirm it's added to all menus.
- Add a menu via the slide-in panel (ingredient + fixed cost rows, quick-add ingredient, front/delivery prices), confirm live preview, save.
- Expand/collapse a menu card's Details.
- Open Settings, change MDR, confirm menu card profit numbers update after closing the panel.
- Check `preview_console_logs` for errors across all of the above.

- [ ] **Step 3: Full manual walkthrough on Ingredients**

Navigate to `http://localhost:8123/ingredients.html`:
- Confirm sidebar shows "Ingredients" as active.
- Add an ingredient, edit it inline, confirm "Used In" reflects menus that reference it, attempt to delete one that's in use (confirm the existing `alert` guard still fires).
- Open Settings, confirm Export downloads a file and Import round-trips (paste back the exported file).
- Check `preview_console_logs` for errors.

- [ ] **Step 4: Responsive check**

`preview_resize` to `mobile` (375x812) on both pages, `preview_screenshot` each, confirm the sidebar and cards remain usable (collapse sidebar if cramped is acceptable — no mockup breakpoint was specified, so the bar is "no horizontal overflow of the page body," matching the existing `overflow-x:auto` table wrappers).

- [ ] **Step 5: Final commit (only if Step 2-4 surfaced fixes)**

If any fixes were needed, stage exactly the files touched and commit with a message describing the regression fixed. If no fixes were needed, skip this step — there is nothing to commit.

---

## Self-review notes

- **Spec coverage:** Visual system (Task 1), sidebar (Task 2), Settings panel (Task 3), Fixed Costs restyle (Task 4), Menu cards + Details collapse (Task 5), Menu panel conversion (Task 6), Ingredients + Used In (Task 7), Conflict/bulk modal restyle (Task 8) — every section of the spec maps to a task. Two-page architecture and untouched-domain-logic constraints are enforced by the Global Constraints section and the `npm test` checks in Tasks 3 and 9.
- **Type/id consistency check:** `renderFixedCostTable`/`renderFixedCostEditCells`, `renderMenuCard`/`renderMenuGrid`, `renderIngredientTable`/`renderIngredientRow` signatures are used consistently between the task that defines them and the task that calls them (Task 4→dashboard.js, Task 5→dashboard.js, Task 7→ingredients.js). Element IDs consumed by `navControls.js` (`mdrInput`, `syncUrlInput`, `syncIntervalInput`, `syncNowBtn`, `syncStatus`, `exportBtn`, `importBtn`) are preserved verbatim across Tasks 2–3.
- **No placeholders:** every step includes literal CSS/HTML/JS to write, not descriptions of what to write.
