const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const SAFE_QUERY_PARAMS = new Set([
  'id',
  'v',
  'sk',
  'q',
  'view_all_page_id',
  'active_status',
  'country',
  'ad_type',
  'media_type',
  'search_type',
]);

const VALID_HOSTNAME_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const FB_DOMAIN_URL_RE = /^(?:[a-z0-9-]+\.)*(?:facebook\.com|fb\.com|fb\.me)(?:[/?#]|$)/i;
const MAX_SAFE_URL_LEN = 2048;

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

export function isSafeHttpUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function sanitizeForUrl(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  const limit = typeof maxLen === 'number' && maxLen >= 0 ? maxLen : 500;
  if (limit === 0) return '';

  const preSlice = str.slice(0, Math.max(limit * 4, 4096)).trim().replace(/^[@/]+/, '');
  const cleaned = preSlice.replace(/[^\p{L}\p{N}._\-/]/gu, '');
  const segments = cleaned
    .split('/')
    .filter((seg) => seg && seg !== '.' && seg !== '..' && !/^\.+$/.test(seg));

  const joined = segments.join('/');
  return joined.slice(0, limit).replace(/\/+$/, '');
}

export const sanitizePath = sanitizeForUrl;

function decodeLinkShimDestination(rawDest) {
  if (typeof rawDest !== 'string' || !rawDest.trim()) return null;
  let candidate = rawDest.trim();

  if (isSafeHttpUrl(candidate)) return candidate;

  for (let pass = 0; pass < 2; pass += 1) {
    if (!candidate.includes('%')) break;
    try {
      const decoded = decodeURIComponent(candidate).trim();
      if (decoded === candidate) break;
      candidate = decoded;
      if (isSafeHttpUrl(candidate)) return candidate;
    } catch {
      return null;
    }
  }

  return isSafeHttpUrl(candidate) ? candidate : null;
}

function filterSafeQueryParams(searchParams) {
  const kept = new URLSearchParams();
  for (const [k, v] of searchParams.entries()) {
    if (!SAFE_QUERY_PARAMS.has(k)) continue;
    const cleanVal = String(v ?? '')
      .replace(/[\x00-\x1f\x7f]/g, '')
      .trim()
      .slice(0, 300);
    if (cleanVal !== '') kept.append(k, cleanVal);
  }
  return kept.toString();
}

function capPathAndQuery(rawPath, rawQuery, limit) {
  const fullUnbounded = rawQuery ? `${rawPath}?${rawQuery}` : rawPath;
  if (fullUnbounded.length <= limit) {
    return {
      path: rawPath,
      query: rawQuery,
      fullPath: fullUnbounded,
      truncated: false,
    };
  }

  if (rawPath.length >= limit) {
    const cappedPath = rawPath.slice(0, limit).replace(/\/+$/, '');
    return {
      path: cappedPath,
      query: '',
      fullPath: cappedPath,
      truncated: true,
    };
  }

  const remaining = limit - rawPath.length - 1;
  if (remaining <= 0 || !rawQuery) {
    return {
      path: rawPath,
      query: '',
      fullPath: rawPath,
      truncated: true,
    };
  }

  const parts = rawQuery.split('&');
  const keptParts = [];
  let len = 0;
  for (const part of parts) {
    const addLen = keptParts.length > 0 ? part.length + 1 : part.length;
    if (len + addLen <= remaining) {
      keptParts.push(part);
      len += addLen;
    } else {
      break;
    }
  }

  let cappedQuery = keptParts.join('&');
  if (!cappedQuery && remaining > 0) {
    cappedQuery = rawQuery.slice(0, remaining).replace(/[&=]+$/, '');
  }

  return {
    path: rawPath,
    query: cappedQuery,
    fullPath: cappedQuery ? `${rawPath}?${cappedQuery}` : rawPath,
    truncated: true,
  };
}

export function extractTargetPath(input, maxLen = 500) {
  const empty = {
    path: '',
    query: '',
    fullPath: '',
    sourceHost: null,
    wasUrl: false,
    linkShimDest: null,
    truncated: false,
  };

  if (typeof input !== 'string') return empty;
  const trimmed = input.trim();
  if (!trimmed) return empty;

  const limit = typeof maxLen === 'number' && maxLen >= 0 ? maxLen : 500;
  if (limit === 0) return empty;

  const hasHttpScheme = /^https?:\/\//i.test(trimmed);
  const looksLikeFbUrl = FB_DOMAIN_URL_RE.test(trimmed);

  if (hasHttpScheme || looksLikeFbUrl) {
    try {
      const parsed = new URL(hasHttpScheme ? trimmed : `https://${trimmed}`);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        const host = parsed.hostname.toLowerCase();
        const pathname = parsed.pathname || '/';
        const isFbHost = host === 'facebook.com' || host.endsWith('.facebook.com');
        const isLinkShim = isFbHost && (pathname === '/l.php' || pathname.endsWith('/l.php'));
        const linkShimDest =
          isLinkShim && parsed.searchParams.has('u')
            ? decodeLinkShimDestination(parsed.searchParams.get('u'))
            : null;

        let decodedPathname = pathname;
        try {
          decodedPathname = decodeURIComponent(pathname);
        } catch {
          decodedPathname = pathname;
        }

        const unboundedPath = sanitizeForUrl(decodedPathname, Math.max(limit * 4, 4096));
        const unboundedQuery = filterSafeQueryParams(parsed.searchParams);
        const capped = capPathAndQuery(unboundedPath, unboundedQuery, limit);

        return {
          path: capped.path,
          query: capped.query,
          fullPath: capped.fullPath,
          sourceHost: host || null,
          wasUrl: true,
          linkShimDest,
          truncated: capped.truncated,
        };
      }
    } catch {
      // Fall through to plain target path parsing
    }
  }

  const withoutHash = trimmed.split('#')[0];
  const qIdx = withoutHash.indexOf('?');
  const rawPathPart = qIdx === -1 ? withoutHash : withoutHash.slice(0, qIdx);
  const rawQueryPart = qIdx === -1 ? '' : withoutHash.slice(qIdx + 1);

  const unboundedPath = sanitizeForUrl(rawPathPart, Math.max(limit * 4, 4096));
  const unboundedQuery = rawQueryPart ? filterSafeQueryParams(new URLSearchParams(rawQueryPart)) : '';
  const capped = capPathAndQuery(unboundedPath, unboundedQuery, limit);

  return {
    path: capped.path,
    query: capped.query,
    fullPath: capped.fullPath,
    sourceHost: null,
    wasUrl: false,
    linkShimDest: null,
    truncated: capped.truncated,
  };
}

export function buildSafeHostUrl(host, path = '') {
  if (typeof host !== 'string') return '';
  let cleanHost = host.trim();
  if (!cleanHost) return '';

  if (/^https:\/\//i.test(cleanHost)) {
    cleanHost = cleanHost.slice(8).replace(/\/$/, '');
  }

  if (!VALID_HOSTNAME_RE.test(cleanHost)) return '';
  cleanHost = cleanHost.toLowerCase();

  const base = `https://${cleanHost}`;
  if (!path || typeof path !== 'string') return base;

  const trimmedPath = path.trim().replace(/[\x00-\x1f\x7f"'<>\\`\s]/g, '');
  if (!trimmedPath) return base;

  let normalizedPath;
  if (trimmedPath.startsWith('?')) {
    normalizedPath = `/${trimmedPath}`;
  } else if (trimmedPath.startsWith('/')) {
    normalizedPath = `/${trimmedPath.replace(/^\/+/, '')}`;
    if (normalizedPath === '/') normalizedPath = '';
  } else {
    normalizedPath = `/${trimmedPath}`;
  }

  const candidate = base + normalizedPath;
  const finalUrl = candidate.length > MAX_SAFE_URL_LEN ? candidate.slice(0, MAX_SAFE_URL_LEN) : candidate;

  try {
    const parsed = new URL(finalUrl);
    if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== cleanHost) {
      return '';
    }
  } catch {
    return '';
  }

  return finalUrl;
}

export function escapeCsvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  const trimmed = str.trimStart();
  const needsPrefix =
    str.startsWith('\t') ||
    str.startsWith('\r') ||
    /^[=+\-@\t\r]/.test(trimmed);
  const safe = needsPrefix ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}
