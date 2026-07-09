export function costPerUnit(item) {
  return item.bulkQty > 0 ? item.bulkPrice / item.bulkQty : 0;
}

export function calcMenu(menu, { ingredients, fixedCosts, mdr }) {
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
