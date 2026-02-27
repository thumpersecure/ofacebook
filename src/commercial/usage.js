import { getPlan } from './entitlements.js';

const STORAGE_KEY = 'osint.usage.v1';

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function save(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function getUsage() {
  const key = todayKey();
  const all = load();
  const day = all[key] || { searches: 0, assistantMessages: 0 };
  return { key, ...day };
}

export function increment(kind, amount = 1) {
  const key = todayKey();
  const all = load();
  const day = all[key] || { searches: 0, assistantMessages: 0 };
  if (kind === 'searches') day.searches += amount;
  if (kind === 'assistantMessages') day.assistantMessages += amount;
  all[key] = day;
  save(all);
  return { key, ...day };
}

export function canConsume(kind, amount = 1) {
  const plan = getPlan();
  const usage = getUsage();
  const limits = plan.limits || {};

  const limit =
    kind === 'searches' ? limits.searchesPerDay :
    kind === 'assistantMessages' ? limits.assistantMessagesPerDay :
    -1;

  if (limit === -1) return { ok: true, remaining: Infinity, limit };
  const used = kind === 'searches' ? usage.searches : usage.assistantMessages;
  const remaining = Math.max(0, limit - used);
  return { ok: remaining >= amount, remaining, limit };
}

