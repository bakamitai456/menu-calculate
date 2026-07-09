export function upsertById(list, item) {
  const idx = list.findIndex(x => x.id === item.id);
  if (idx < 0) return [...list, item];
  return list.map((x, i) => (i === idx ? item : x));
}

export function removeById(list, id) {
  return list.filter(x => x.id !== id);
}
