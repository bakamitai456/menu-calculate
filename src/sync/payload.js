export function buildLocalPayload({ ingredients, fixedCostItems, menus, tombstones }) {
  return { version: 1, ingredients, fixedCostItems, menus, tombstones };
}
