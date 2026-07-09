export function getItem(key) {
  return localStorage.getItem(key);
}

export function setItem(key, value) {
  localStorage.setItem(key, value);
}

export function getList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

export function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}
