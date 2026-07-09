# Fixed Cost Item Auto-Add / Apply-All / Remove-All — Design

## Context

Fixed cost items (e.g. packaging, delivery box) currently have to be added to every menu one at a time via the menu modal's "+ Add Fixed Cost Item" row. For fixed costs that belong on nearly every menu, this is repetitive both when creating new menus and when retrofitting existing ones. This feature adds a per-fixed-cost-item "auto-add quantity" that (a) automatically pre-fills new menus, and (b) can be applied to or removed from all existing menus in one action.

## Data model

Each fixed cost item object gains one new field:

```
autoAddQty: number   // default 0 (missing/undefined treated as 0)
```

`0` means auto-add is disabled for this item. Any value `> 0` means auto-add is enabled, using that value as the quantity.

No migration is needed — existing fixed cost items simply don't have the field yet, and every read path treats a missing/undefined `autoAddQty` as `0`.

This field rides on the same object that already flows through the sync engine's generic `merge()` (which compares whole fixed-cost objects by `updatedAt`, agnostic to which fields exist). **No changes to `src/sync/merge.js` or the sync engine are needed** — `autoAddQty` is persisted and merged exactly like `name` or `bulkPrice` already are, since toggling it goes through the existing `repo.saveFixedCost(...)` path, which stamps `updatedAt`.

## UI changes (dashboard page only — `index.html` / `src/pages/dashboard.js`)

Ingredients page and its data are untouched; fixed cost items and menus only exist on the dashboard.

1. **Auto-Add Qty input** — each fixed-cost-item row gets a small `<input type="number" min="0" step="any">` in the actions cell, next to Edit/Delete, initialized to `fc.autoAddQty || 0`. On `change`, it immediately calls `repo.saveFixedCost({ ...fc, autoAddQty })` (same live-persist pattern the MDR input already uses — no separate "Edit" click required).

2. **Apply all** button (per row) — adds `{ fixedCostItemId: fc.id, qty: fc.autoAddQty }` to every menu that doesn't already have a row referencing this fixed cost item. Menus that already reference it are left untouched (no overwrite of a user's custom qty). Rendered with the HTML `disabled` attribute whenever `autoAddQty` is `0` (nothing meaningful to apply) — re-rendered enabled/disabled on every table refresh, same as the row itself.

3. **Remove all** button (per row) — strips any row referencing this fixed cost item from every menu. Always enabled regardless of the current `autoAddQty` value, so users can clean up after disabling auto-add.

4. **New menu creation** (`openAddMenu` in `src/pages/dashboard.js`) — pre-populates the fixed-cost rows in the "Add Menu" modal with every fixed cost item whose `autoAddQty > 0`, using that quantity. Editing an existing menu (`openEditMenu`) is unaffected — it continues to show only the rows already saved on that menu.

## Bulk-update concurrency safety

"Apply all" and "Remove all" both touch every menu's `fixedCostItems` in one pass. To avoid the sync engine reading/pushing menus mid-batch-write (which happens on its own timer independent of user clicks):

1. Show a full-page blocking overlay (disables pointer events / inputs across the page).
2. Call `syncEngine.stop()` to pause the polling timer.
3. Perform the synchronous local read → pure-function compute → `repo` write → re-render menu grid.
4. Restart the engine only if a sync URL is configured (`if (repo.getSyncUrl()) syncEngine.start();`), mirroring the existing startup condition.
5. Hide the overlay.

No forced sync push happens afterward — the change is picked up by the next scheduled poll, consistent with how every other local edit already behaves.

Since these are synchronous `localStorage` operations, the overlay will typically be visible only briefly — it exists primarily to guarantee no sync tick fires mid-batch, not because the operation is expected to be slow.

## New pure logic (unit-tested)

New module `src/domain/bulkFixedCost.js`:

- `applyFixedCostToAllMenus(menus, fixedCostItemId, qty)` → returns a new menus array. For each menu that has no existing row with this `fixedCostItemId`, appends `{ fixedCostItemId, qty }` and bumps that menu's `updatedAt`. Menus that already reference the item are returned unchanged (same object reference, so no needless `updatedAt` bump / spurious sync conflict).
- `removeFixedCostFromAllMenus(menus, fixedCostItemId)` → returns a new menus array. For each menu that has a row referencing this `fixedCostItemId`, removes it and bumps `updatedAt`. Menus without a matching row are returned unchanged.

Both take an explicit `now` timestamp parameter (matching the existing pattern in `src/io/repository.js`) so they stay pure and testable — the caller (repository/page controller) supplies the actual clock value.

Tests go in `test/domain/bulkFixedCost.test.js`, covering: adding to a mixed set of menus (some already have the item, some don't), no-op when all menus already have it, removing from a mixed set, no-op when no menus reference the item, and confirming untouched menus keep their original `updatedAt`.

## Error handling

- "Apply all" with `autoAddQty === 0`: button is rendered `disabled`, so it cannot be clicked — no alert needed, this is an expected steady state, not an error.
- "Apply all"/"Remove all" with zero menus: pure functions naturally no-op on an empty list; no special-casing needed.
- Auto-Add Qty input: reuse the existing numeric-input tolerance pattern (`parseFloat(...) || 0`, clamped to `>= 0`) already used for MDR — invalid input falls back to the last persisted value, consistent with how the MDR input already behaves on bad input.

## Out of scope

- No change to `ingredients.html`, `src/pages/ingredients.js`, or any sync/merge code.
- No new "Auto Add" field on ingredients — this feature is fixed-cost-items-only, per the request.
