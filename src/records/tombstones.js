export function addTombstone(tombstones, id, type, now) {
  const stone = { id, type, deletedAt: now };
  const idx = tombstones.findIndex(s => s.id === id);
  if (idx < 0) return [...tombstones, stone];
  return tombstones.map((s, i) => (i === idx ? stone : s));
}
