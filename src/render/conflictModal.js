const EPOCH = '1970-01-01T00:00:00.000Z';

export function renderConflictCounter(current, total) {
  return `Conflict ${current} of ${total}`;
}

export function renderConflictSide(item, type) {
  const { id, updatedAt, ...rest } = item;
  const lines = [`Changed: ${new Date(updatedAt || EPOCH).toLocaleString()}`];
  for (const [k, v] of Object.entries(rest)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.length} items]`);
    else lines.push(`${k}: ${v}`);
  }
  return lines.join('\n');
}
