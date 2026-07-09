export function validateItem(data) {
  if (!data.name || !data.name.trim()) return 'Name is required.';
  if (isNaN(data.bulkQty) || data.bulkQty <= 0) return 'Qty must be a positive number.';
  if (isNaN(data.bulkPrice) || data.bulkPrice < 0) return 'Price must be a non-negative number.';
  return null;
}
