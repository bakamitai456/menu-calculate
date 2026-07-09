export function applyFixedCostToAllMenus(menus, fixedCostItemId, qty, now) {
  return menus.map(menu => {
    const hasItem = menu.fixedCostItems.some(row => row.fixedCostItemId === fixedCostItemId);
    if (hasItem) return menu;
    return {
      ...menu,
      fixedCostItems: [...menu.fixedCostItems, { fixedCostItemId, qty }],
      updatedAt: now,
    };
  });
}

export function removeFixedCostFromAllMenus(menus, fixedCostItemId, now) {
  return menus.map(menu => {
    const hasItem = menu.fixedCostItems.some(row => row.fixedCostItemId === fixedCostItemId);
    if (!hasItem) return menu;
    return {
      ...menu,
      fixedCostItems: menu.fixedCostItems.filter(row => row.fixedCostItemId !== fixedCostItemId),
      updatedAt: now,
    };
  });
}
