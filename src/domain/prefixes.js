import { THUMPERSECURE_PREFIXES } from '../prefix-library.js';
import { buildSafeHostUrl } from '../utils/security.js';

let cachedIndex = null;

function hostToToken(host) {
  if (!host || typeof host !== 'string') return '';
  if (host.endsWith('.facebook.com')) return host.slice(0, -'.facebook.com'.length);
  if (host.endsWith('.fb.com')) return host.slice(0, -'.fb.com'.length);
  return host;
}

export function getPrefixIndex() {
  if (cachedIndex) return cachedIndex;

  const all = THUMPERSECURE_PREFIXES.map((p) => ({
    host: p.subdomain,
    token: hostToToken(p.subdomain),
    category: p.category,
    status: p.status,
    purpose: p.purpose,
  }));

  /** @type {Map<string, typeof all[number]>} */
  const byHost = new Map();
  /** @type {Map<string, typeof all[number][]>} */
  const byToken = new Map();
  /** @type {Map<string, number>} */
  const catCounts = new Map();

  for (const e of all) {
    const key = e.host.toLowerCase();
    byHost.set(key, e);
    const tok = e.token.toLowerCase();
    const list = byToken.get(tok) || [];
    list.push(e);
    byToken.set(tok, list);
    catCounts.set(e.category, (catCounts.get(e.category) || 0) + 1);
  }

  const categories = [...catCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  cachedIndex = { all, byHost, byToken, categories };
  return cachedIndex;
}

export function matchPrefixHost(host, idOrHost) {
  if (typeof host !== 'string' || typeof idOrHost !== 'string') return false;
  const h = host.toLowerCase();
  const q = idOrHost.trim().toLowerCase();
  if (!h || !q) return false;
  if (h === q) return true;
  if (h === `${q}.facebook.com`) return true;
  if (h === `${q}.fb.com`) return true;
  return h.startsWith(`${q}.`);
}

export function resolvePrefixHost(index, idOrHost) {
  if (!index || typeof idOrHost !== 'string') return null;
  const raw = idOrHost.trim().toLowerCase();
  if (!raw) return null;

  const exact = index.byHost.get(raw);
  if (exact) return exact.host;

  const byToken = index.byToken.get(raw);
  if (byToken?.length) {
    const primary = byToken.find((x) => x.host.endsWith('.facebook.com')) || byToken[0];
    if (primary) return primary.host;
  }

  if (raw.includes('.')) {
    const safeUrl = buildSafeHostUrl(raw);
    if (!safeUrl) return null;
    return raw;
  }

  return null;
}
