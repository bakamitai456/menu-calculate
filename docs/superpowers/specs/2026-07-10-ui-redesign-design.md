# UI Redesign (Claude Design mockup) — Design

## Context

The app's current UI is a plain top-nav + white-card look (`style.css`), styled across two static pages: `index.html` (Dashboard: Fixed Costs + Menus) and `ingredients.html` (Ingredients). The user produced a full visual/interaction mockup in a Claude Design project ("Cost and profit calculator", file `Menu Calculator.dc.html`) specifying a warm cream/amber theme with a collapsible sidebar, slide-out panels, and inline-editable rows. This spec adopts that visual system and layout while preserving the existing two-page architecture and all existing functionality (sync, conflict resolution, bulk fixed-cost actions, import/export).

No data model, sync, or domain-logic changes. This is UI-layer only: `style.css`, `index.html`, `ingredients.html`, and the `src/render/*.js` + `src/pages/*.js` + `src/pages/shared/navControls.js` files that produce markup and wire DOM events.

## Decisions locked with the user

1. **Two pages, not a SPA.** `index.html` and `ingredients.html` remain separate documents; the sidebar's "Ingredients"/"Dashboard" links are normal `<a href>` navigations (full page load), not client-side view switching. No router, no merging of `dashboard.js`/`ingredients.js`.
2. **Settings consolidated into a slide-out panel.** MDR, Sync URL, sync interval, "Sync Now" + status, and Export/Import move off the always-visible nav bar into a Settings panel opened from the sidebar. Only a small "Synced" status dot stays always-visible (in the sidebar footer).
3. **Tables stay `<table>` markup, restyled to look like the mockup's CSS-grid rows.** The mockup renders rows as `display:grid` divs, but `render/fixedCosts.js`, `render/ingredients.js`, and `render/menus.js` already do inline-edit by swapping a `<tr>`'s `innerHTML`. A `<table>` with explicit column widths (`<col>` or per-`<td>` width) reproduces the grid's alignment pixel-for-pixel. Rewriting to grid-divs would touch render logic for zero visual gain — restyle only.
4. **Two small functional additions**, both approved:
   - Menu cards gain a collapsible "▸ Details" section (ingredient/fixed-cost line breakdown), collapsed by default. Today the full breakdown is always rendered inline.
   - Ingredients table gains a "Used In" column (count of menus referencing the ingredient), using the existing `repo.ingredientUsedBy(id)`.

## Visual system (`style.css`)

- Font: Manrope (Google Fonts import), weights 400/500/600/700/800.
- Colors:
  - Background: `#fbf6ef`
  - Sidebar / ink: `#3d2b1c`
  - Primary accent (buttons, active states): `#b5732c`
  - Card background: `#fffdf9`
  - Card border: `rgba(42,31,22,.1)`
  - Body text: `#2a1f14`; muted text via `rgba(42,31,22, .4–.75)` opacity steps
  - Success/profit: `#2f7d43`; danger/loss/delete: `#b23b3b`
  - Sync dot idle: `#7fbf6a`
- Radii: 8–12px on cards/panels, 6–9px on buttons/inputs.
- This replaces the existing dark-navy (`#1a1a2e`) nav + gray (`#f5f5f5`) body palette entirely.

## Sidebar (replaces `<nav>` in both pages)

Fixed-width (212px) left column, `#3d2b1c` background, `#f3e9dc` text:
- Header: small accent logo mark + "Menu Calculator" wordmark + collapse toggle (‹).
- Nav links: "Dashboard" and "Ingredients", each a `<a>`. The current page's link gets the active treatment (amber left border + subtle white-tint background, bold) — same "active class on the current page's link" pattern already used today, just restyled.
- Footer (pushed down via `margin-top:auto`): pulsing green dot + "Synced" label (status text/color driven by the same `data-status` attribute `wireSyncControls` already sets — see below), and a "⚙ Settings" row that opens the Settings panel.
- Collapse toggle shrinks the sidebar to a 60px icon-only rail (icons + tooltip via `title` attr, no text labels); state is transient (in-memory JS, not persisted) — simplest option, matches "redesign the look" scope without adding a new persisted preference.

## Settings panel (new — slide-out from the right)

Markup duplicated in both `index.html` and `ingredients.html` (same duplication pattern already used for the conflict modal), id `settingsPanel`. Contains, in order:
1. MDR (%) input
2. "Google Sheets Sync" section: Sync URL input, sync-interval input ("Sync every ⟨n⟩ seconds"), a status row (dot + label) + "Sync Now" button
3. "Data" section: Export / Import buttons (side by side)

Opened via the sidebar's Settings row, closed via an "✕" in the panel header or by clicking the backdrop — same interaction pattern as the menu panel (see below).

**Wiring stays untouched.** `wireMdrControl`, `wireExportImport`, and `wireSyncControls` in `src/pages/shared/navControls.js` look up the same element IDs (`mdrInput`, `syncUrlInput`, `syncIntervalInput`, `syncNowBtn`, `syncStatus`, `exportBtn`, `importBtn`) — those IDs simply move from the old nav bar markup into the new panel markup. No changes to `navControls.js` logic. The sidebar's footer sync dot needs its own small element reading the same `data-status`; `wireSyncControls`'s `setSyncStatus` will additionally update that sidebar dot (a two-line addition — same status fan-out to a second element).

## Dashboard page (`index.html` / `src/pages/dashboard.js`, `src/render/fixedCosts.js`, `src/render/menus.js`)

### Fixed Costs table
- Restyled `<table>`: uppercase 11px muted column headers, 13.5px row text, row hover/divider via `border-bottom`, card wrapper (`#fffdf9` bg, rounded, subtle border) instead of a plain white section.
- Inline edit (click "Edit" → row becomes input fields) is unchanged behavior, restyled to the mockup's inline-edit row treatment (tan `#fbf1e6` background band).
- Auto-Add Qty input, Apply-all/Remove-all buttons: unchanged behavior. The "qty must be > 0" tooltip (currently positioned under the qty input) repositions to a small popover anchored to the "Apply all" button itself, per the mockup, with copy "Set an Auto-Add Qty above 0 first."
- Apply-all / Remove-all confirmation still uses the existing generic `bulkConfirmModal` flow (`confirmBulkAction` in `dashboard.js`) — only its visual chrome is restyled to the mockup's centered-dialog look (title + body copy + Cancel/confirm buttons), no change to when/how it's invoked.
- "+ Add Fixed Cost Item" inline form: restyled to a dashed-border card matching the mockup's "add" affordance, same fields/validation.

### Menus section
Each menu card (`renderMenuCard` in `src/render/menus.js`) is restructured to:
1. Header row: menu name (left), "▸ Details" / "▾ Details" toggle + Edit + Delete buttons (right).
2. A "Total Cost" pill/badge (amber-tinted background, large bold `฿` figure).
3. A two-column Front Store / Delivery summary: each shows the price, and a bold profit figure with margin %, colored green (`#2f7d43`) when profit ≥ 0 or red (`#b23b3b`) when negative — same sign logic as today's `profit-pos`/`profit-neg`, just restyled and reduced from a full table to this compact summary.
4. **New**: a collapsible Details section (hidden by default) that, when expanded, shows the ingredient lines, fixed-cost lines, and total — this is today's always-visible breakdown, now gated behind the toggle. Toggle state lives in JS (a `Set` of expanded menu ids, or a per-card class toggle) inside `dashboard.js`; re-render preserves nothing extra since it's a session-only UI affordance (collapsing/expanding doesn't need to survive a data reload).

### Add/Edit Menu panel
`#menuModal` converts from a centered `.modal-backdrop`/`.modal` to a 440px-wide right-side slide-in panel (fixed position, full height, box-shadow on its left edge). The existing open/close JS (`modal.classList.add('open')` / `remove('open')`) is unchanged — only the CSS for `.modal-backdrop`/`.modal` gains a "panel" variant (or a new `.panel-backdrop`/`.panel` class pair used just for this modal, while the conflict modal and bulk-confirm modal keep the centered `.modal` treatment). Internals (ingredient/fixed-cost row pickers, quick-add, live preview footer) keep their existing structure and field IDs, restyled to match the mockup's spacing/typography.

## Ingredients page (`ingredients.html` / `src/pages/ingredients.js`, `src/render/ingredients.js`)

- Same table restyle as Fixed Costs.
- **New "Used In" column**: `renderIngredientRow` (in `src/render/ingredients.js`) gains a cell computed from `repo.ingredientUsedBy(ing.id)` — rendered as `"used in N menus"` (or "used in 1 menu") when `N > 0`, else an em-dash `—`. This requires passing the ingredient-usage lookup into the render function (or precomputing usage counts in `ingredients.js` before calling `renderIngredientTable`), since `render/*.js` modules are currently pure functions of the item list with no repo access — the render call site in `ingredients.js` will pass a `usedInCount` map alongside the ingredients list.

## Conflict modal & bulk-update overlay

Not shown in the mockup at all. Restyled only (colors/typography/radii to match the new palette) — no change to `src/ui/conflictModal.js`, `src/render/conflictModal.js`, or the bulk-overlay show/hide logic in `dashboard.js`. Kept as centered `.modal`-style dialogs (not slide-out panels), consistent with them being interrupt-style prompts rather than editing surfaces.

## Out of scope

- No changes to `src/domain/*.js`, `src/sync/*.js`, `src/io/*.js`, `src/records/*.js`, or any test files — this is presentation-layer only.
- No new persisted preferences (sidebar collapsed state, expanded menu-card ids are transient/session-only).
- No SPA conversion, no router, no merging of `dashboard.js`/`ingredients.js`.
- No visual work on `support.js` or anything specific to the Claude Design authoring tool itself — only the rendered look/interactions are being ported.
