# Menu Profit Calculator — Design Spec
**Date:** 2026-06-23

## Context

A small food business needs to calculate the profitability of each menu item across two sales channels: front-store and a delivery platform. Ingredient and fixed cost data is entered manually based on bulk purchases. The delivery channel charges an MDR (Merchant Discount Rate) that reduces net revenue. The app must persist data locally so nothing is lost between sessions.

---

## Architecture

- **Stack:** Plain HTML / CSS / JavaScript — no framework, no build step
- **Files:**
  - `index.html` — main dashboard (fixed costs + menus)
  - `ingredients.html` — ingredient management page
  - `app.js` — shared data layer and utilities
  - `style.css` — shared styles
- **Persistence:** `localStorage` with three keys:
  - `mc_ingredients` — array of ingredient objects
  - `mc_fixed_cost_items` — array of fixed cost item objects
  - `mc_menus` — array of menu objects
  - `mc_mdr` — MDR rate as a decimal (default `0.321`)

---

## Data Models

### Ingredient
```json
{
  "id": "uuid",
  "name": "Flour",
  "bulkQty": 1000,
  "bulkUnit": "g",
  "bulkPrice": 45
}
```
- Computed: `costPerUnit = bulkPrice / bulkQty` (cost per g/ml/pcs)

### FixedCostItem
Same structure as Ingredient:
```json
{
  "id": "uuid",
  "name": "Packaging Box",
  "bulkQty": 100,
  "bulkUnit": "pcs",
  "bulkPrice": 150
}
```
- Computed: `costPerUnit = bulkPrice / bulkQty` (cost per unit)

### Menu
```json
{
  "id": "uuid",
  "name": "Pad Thai",
  "ingredients": [
    { "ingredientId": "uuid", "qty": 200 }
  ],
  "fixedCostItems": [
    { "fixedCostItemId": "uuid", "qty": 1 }
  ],
  "frontStorePrice": 80,
  "deliveryPrice": 95
}
```

---

## Calculations

```
ingredientCost  = Σ (qty × costPerUnit)  for each ingredient in menu
fixedCost       = Σ (qty × costPerUnit)  for each fixed cost item in menu
totalCost       = ingredientCost + fixedCost

frontStoreProfit  = frontStorePrice - totalCost
frontStoreMargin  = frontStoreProfit / frontStorePrice × 100%

deliveryNetRevenue = deliveryPrice × (1 - MDR)
deliveryProfit     = deliveryNetRevenue - totalCost
deliveryMargin     = deliveryProfit / deliveryPrice × 100%
```

MDR default: **32.1%** — editable globally from the nav bar.

---

## Pages & Layout

### Nav Bar (shared)
- App title: "Menu Calculator"
- Links: "Dashboard" | "Ingredients"
- MDR rate field: editable inline (e.g., `32.1 %`)

### Page 1 — Main Dashboard (`index.html`)

**Section 1: Fixed Cost Items**
- Table with columns: Name | Bulk Qty | Unit | Bulk Price (฿) | Cost/Unit (฿) | Actions (edit/delete)
- "+ Add Fixed Cost Item" button opens an inline form row

**Section 2: Menu List**
- Each menu displayed as a card with:
  - Menu name
  - Ingredient cost breakdown (name, qty, unit, cost)
  - Fixed cost breakdown (name, qty, unit, cost)
  - Total cost
  - Profit table:

    | Channel | Selling Price | Net Revenue | Profit | Margin |
    |---|---|---|---|---|
    | Front Store | ฿80 | ฿80 | ฿XX | XX% |
    | Delivery | ฿95 | ฿64.45 | ฿XX | XX% |

- "+ Add Menu" button opens a modal
- Each card has edit / delete icons

### Page 2 — Ingredients (`ingredients.html`)

- Table with columns: Name | Bulk Qty | Unit | Bulk Price (฿) | Cost/Unit (฿) | Actions (edit/delete)
- "+ Add Ingredient" button opens an inline form row

### Menu Create/Edit Modal

Fields:
1. Menu name
2. Ingredient selector: searchable dropdown → pick ingredient → enter qty → "+ Add Row"
   - Quick-add link: "＋ New ingredient" opens a small inline form to create a new ingredient without leaving the modal; on save it is added to the ingredient list and auto-selected
3. Fixed cost item selector: same pattern as ingredients
4. Front-store selling price (฿)
5. Delivery selling price (฿)
6. Live preview of profit calculations at the bottom of the modal

---

## Error Handling

- Prevent deleting an ingredient or fixed cost item that is currently used by a menu — show a warning listing which menus reference it
- Validate all numeric inputs (positive numbers only)
- If MDR is edited to an invalid value, revert to previous valid value

---

## Verification

1. Open `index.html` in a browser — dashboard loads with empty sections
2. Add 2 fixed cost items and verify cost/unit is computed correctly
3. Go to `ingredients.html`, add 3 ingredients, verify cost/unit
4. Return to dashboard, add a menu — use the quick-add ingredient flow inside the modal
5. Check that profit and margin calculations match manual calculation for both channels
6. Change MDR rate — verify delivery profit updates across all menu cards
7. Reload the page — verify all data persists from localStorage
8. Try to delete an ingredient used by a menu — verify warning appears
