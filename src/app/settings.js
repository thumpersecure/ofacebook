const PROVIDER_KEY = 'osint.assistant.provider';
const OPENAI_KEY = 'osint.openai.key';
const ANTHROPIC_KEY = 'osint.anthropic.key';

export function getProvider() {
  return localStorage.getItem(PROVIDER_KEY) || 'local';
}

export function setProvider(providerId) {
  const p = providerId === 'openai' || providerId === 'anthropic' ? providerId : 'local';
  localStorage.setItem(PROVIDER_KEY, p);
  return p;
}

export function getOpenAIKey() {
  return localStorage.getItem(OPENAI_KEY) || '';
}

export function setOpenAIKey(key) {
  localStorage.setItem(OPENAI_KEY, String(key || '').trim());
}

export function getAnthropicKey() {
  return localStorage.getItem(ANTHROPIC_KEY) || '';
}

export function setAnthropicKey(key) {
  localStorage.setItem(ANTHROPIC_KEY, String(key || '').trim());
}

export function clearLocalSettings() {
  localStorage.removeItem(PROVIDER_KEY);
  localStorage.removeItem(OPENAI_KEY);
  localStorage.removeItem(ANTHROPIC_KEY);
}

