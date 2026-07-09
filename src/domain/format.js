export function fmt(n) {
  return isNaN(n) ? '—' : n.toFixed(2);
}

export function fmtPct(n) {
  return n.toFixed(1) + '%';
}
