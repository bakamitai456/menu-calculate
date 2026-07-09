export async function fetchRemote(url) {
  const resp = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();
  if (!text || text === '{}') return null;
  return JSON.parse(text);
}

export async function pushRemote(url, payload) {
  // Apps Script runs doPost server-side before the 302 redirect to echo fires.
  // mode:'no-cors' sends the body as a simple request; the response is opaque
  // (Chrome shows a CORS warning in devtools for the echo redirect, but the
  // fetch resolves fine and the write has already completed on the server).
  await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    mode: 'no-cors',
  });
}
