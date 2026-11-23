const PROVIDER_KEY = 'osint.assistant.provider';
const OPENAI_KEY = 'osint.openai.key';
const ANTHROPIC_KEY = 'osint.anthropic.key';
const STORAGE_PROBE_KEY = '__osint_storage_probe__';

/** @type {Map<string, string>} */
const memoryStore = new Map();

function readItem(key) {
  if (memoryStore.has(key)) return memoryStore.get(key) ?? null;
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Storage unavailable or blocked
  }
  return null;
}

function writeItem(key, value) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      memoryStore.delete(key);
      return true;
    }
  } catch {
    // Storage unavailable or quota exceeded; fall back to memory
  }
  memoryStore.set(key, value);
  return false;
}

function removeItem(key) {
  memoryStore.delete(key);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return true;
    }
  } catch {
    // Storage unavailable or blocked
  }
  return false;
}

export function isStorageAvailable() {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(STORAGE_PROBE_KEY, '1');
    const v = localStorage.getItem(STORAGE_PROBE_KEY);
    localStorage.removeItem(STORAGE_PROBE_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export function getProvider() {
  const val = readItem(PROVIDER_KEY);
  return val === 'openai' || val === 'anthropic' ? val : 'local';
}

export function setProvider(providerId) {
  const p = providerId === 'openai' || providerId === 'anthropic' ? providerId : 'local';
  writeItem(PROVIDER_KEY, p);
  return p;
}

export function getOpenAIKey() {
  return readItem(OPENAI_KEY) || '';
}

export function setOpenAIKey(key) {
  const clean = String(key ?? '').trim();
  if (!clean) {
    removeItem(OPENAI_KEY);
    return '';
  }
  writeItem(OPENAI_KEY, clean);
  return clean;
}

export function hasOpenAIKey() {
  return Boolean(getOpenAIKey());
}

export function getAnthropicKey() {
  return readItem(ANTHROPIC_KEY) || '';
}

export function setAnthropicKey(key) {
  const clean = String(key ?? '').trim();
  if (!clean) {
    removeItem(ANTHROPIC_KEY);
    return '';
  }
  writeItem(ANTHROPIC_KEY, clean);
  return clean;
}

export function hasAnthropicKey() {
  return Boolean(getAnthropicKey());
}

export function clearLocalSettings() {
  removeItem(PROVIDER_KEY);
  removeItem(OPENAI_KEY);
  removeItem(ANTHROPIC_KEY);
}
