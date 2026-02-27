import { THUMPERSECURE_PREFIXES } from '../prefix-library.js';

function hostToToken(host) {
  if (!host || typeof host !== 'string') return '';
  if (host.endsWith('.facebook.com')) return host.slice(0, -'.facebook.com'.length);
  if (host.endsWith('.fb.com')) return host.slice(0, -'.fb.com'.length);
  return host;
}

export function getPrefixIndex() {
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

  for (const e of all) {
    byHost.set(e.host, e);
    const list = byToken.get(e.token) || [];
    list.push(e);
    byToken.set(e.token, list);
  }

  return { all, byHost, byToken };
}

export function matchPrefixHost(host, idOrHost) {
  if (!host || !idOrHost) return false;
  if (host === idOrHost) return true;
  if (host === `${idOrHost}.facebook.com`) return true;
  if (host === `${idOrHost}.fb.com`) return true;
  return host.startsWith(`${idOrHost}.`);
}

export function resolvePrefixHost(index, idOrHost) {
  if (!idOrHost) return null;
  if (idOrHost.includes('.')) return idOrHost;
  const byToken = index.byToken.get(idOrHost);
  const primary = byToken?.find((x) => x.host.endsWith('.facebook.com')) || byToken?.[0];
  return primary?.host || null;
}

