export function filterMenus(menus, { name = '', ingredientIds = [], fixedCostIds = [] } = {}) {
  const term = name.trim().toLowerCase();
  return menus.filter(menu => {
    if (term && !menu.name.toLowerCase().includes(term)) return false;
    if (ingredientIds.length > 0) {
      const menuIds = new Set(menu.ingredients.map(row => row.ingredientId));
      if (!ingredientIds.some(id => menuIds.has(id))) return false;
    }
    if (fixedCostIds.length > 0) {
      const menuIds = new Set(menu.fixedCostItems.map(row => row.fixedCostItemId));
      if (!fixedCostIds.some(id => menuIds.has(id))) return false;
    }
    return true;
  });
}
