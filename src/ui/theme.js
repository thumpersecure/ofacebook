const STORAGE_KEY = 'osint.theme';

export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

export function setTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(STORAGE_KEY, t);
  return t;
}

export function toggleTheme() {
  const next = (document.documentElement.getAttribute('data-theme') || getTheme()) === 'dark' ? 'light' : 'dark';
  return setTheme(next);
}

export function initTheme() {
  setTheme(getTheme());
}

