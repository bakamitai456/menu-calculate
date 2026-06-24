# Export / Import Feature — Design Spec
**Date:** 2026-06-24

## Context

All app data lives in localStorage, which is browser-local and lost if the browser is cleared. Users need to back up data and transfer it to other machines (e.g., from PC to another device). The feature adds JSON file export and import without any server or external service.

---

## Architecture

No new files. Export and import functions are added to `app.js` (shared helpers). Both `index.html` and `ingredients.html` get two nav bar buttons ("Export" and "Import") that call these shared functions.

---

## Export File Format

```json
{
  "version": 1,
  "ingredients": [...],
  "fixedCostItems": [...],
  "menus": [...],
  "mdr": 0.321
}
```

- `version: 1` — reserved for future format migrations
- All four data stores captured in one file
- Filename: `menu-calculator-backup-YYYY-MM-DD.json` (date from `new Date()`)

---

## Shared Functions in `app.js`

### `exportData()`
1. Reads all four localStorage keys via existing `Storage` methods
2. Builds the export object with `version: 1`
3. Serializes to JSON and triggers a browser file download via a temporary `<a>` element with `href = URL.createObjectURL(blob)` and `download = filename`
4. Revokes the object URL immediately after click

### `importData()`
1. Creates a hidden `<input type="file" accept=".json">` and triggers a click
2. On file selection, reads the file with `FileReader`
3. Parses JSON — on parse error shows `alert('Invalid file — could not read JSON.')`
4. Validates shape: must have `ingredients` (array), `fixedCostItems` (array), `menus` (array), and `mdr` (number) — on failure shows `alert('Invalid backup file — missing required fields.')`
5. Asks `confirm('This will replace all current data. Continue?')` — if cancelled, does nothing
6. Writes all four keys atomically (all or nothing) via `localStorage.setItem`
7. Calls `location.reload()` to refresh the page with new data

---

## UI Changes

### Nav bar (both `index.html` and `ingredients.html`)

Add before the MDR control:
```html
<button class="btn btn-ghost btn-sm" onclick="exportData()">Export</button>
<button class="btn btn-ghost btn-sm" onclick="importData()">Import</button>
```

No new CSS needed — `btn btn-ghost btn-sm` already exists in `style.css`.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| File is not valid JSON | `alert('Invalid file — could not read JSON.')` |
| File missing required keys | `alert('Invalid backup file — missing required fields.')` |
| User cancels confirm dialog | No-op, data unchanged |
| User cancels file picker | No-op |

---

## Verification

1. Open `index.html`, add some ingredients, fixed costs, and menus
2. Click "Export" — verify a `.json` file downloads with today's date in the name
3. Open the file — verify it contains `version`, `ingredients`, `fixedCostItems`, `menus`, `mdr`
4. Clear localStorage manually (DevTools → Application → Clear Storage)
5. Click "Import", select the downloaded file, confirm — verify page reloads with all data restored
6. Try importing a non-JSON file — verify error alert appears
7. Try importing a JSON file with missing fields — verify error alert appears
8. Click "Import", select a valid file, then cancel the confirm dialog — verify data is unchanged
9. Verify both pages (`index.html` and `ingredients.html`) have working Export/Import buttons
