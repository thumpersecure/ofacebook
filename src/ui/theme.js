const STORAGE_KEY = 'osint.theme';
const THEME_COLORS = {
  dark: '#060a10',
  light: '#f4f7fb',
};

function readStoredTheme() {
  try {
    const val = window.localStorage.getItem(STORAGE_KEY);
    if (val === 'light' || val === 'dark') return val;
  } catch {
    // Storage unavailable
  }
  return null;
}

function getSystemTheme() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // matchMedia unavailable
  }
  return 'dark';
}

function syncThemeToggle(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  const iconChar = isDark ? '☀' : '☾';

  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', `${label} (T)`);

  const iconEl = btn.querySelector('.theme-toggle__icon');
  if (iconEl) {
    iconEl.textContent = iconChar;
  } else {
    btn.textContent = iconChar;
  }
}

export function getTheme() {
  return readStoredTheme() || getSystemTheme();
}

export function setTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  const root = document.documentElement;
  if (root) {
    root.setAttribute('data-theme', t);
    root.style.colorScheme = t;
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', THEME_COLORS[t]);
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, t);
  } catch {
    // Ignore storage persistence failures
  }

  syncThemeToggle(t);
  return t;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  return setTheme(next);
}

export function initTheme() {
  return setTheme(getTheme());
}
