import { getMethodCombinations } from '../domain/methods.js';
import { getPrefixIndex, resolvePrefixHost } from '../domain/prefixes.js';
import { safeStr } from '../utils/lang.js';
import {
  buildSafeHostUrl,
  extractTargetPath,
  isSafeHttpUrl,
  sanitizeForUrl,
} from '../utils/security.js';
import { getProvider, getOpenAIKey, getAnthropicKey } from '../app/settings.js';

const LLM_TIMEOUT_MS = 25000;
const MAX_HISTORY_MESSAGES = 6;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compileRule(id, keywords) {
  return {
    id,
    matchers: keywords.map((kw) => ({
      kw,
      weight: kw.length >= 6 ? 2 : 1,
      re: new RegExp(`(?<![a-z0-9])${escapeRegex(kw)}(?![a-z0-9])`, 'i'),
    })),
  };
}

const INTENT_RULES = [
  compileRule('profile-discovery', [
    'profile',
    'profiles',
    'user',
    'users',
    'username',
    'id',
    'userid',
    'who is',
    'lookup',
    'find',
    'person',
  ]),
  compileRule('link-tracking', [
    'link',
    'links',
    'redirect',
    'redirects',
    'referral',
    'referrals',
    'utm',
    'l.php',
    'link shim',
    'trace',
  ]),
  compileRule('business-intel', [
    'ads',
    'ad library',
    'advertiser',
    'advertisers',
    'business',
    'page transparency',
    'political',
    'brand',
  ]),
  compileRule('api-discovery', [
    'api',
    'graph',
    'developer',
    'developers',
    'token',
    'tokens',
    'endpoint',
    'endpoints',
    'explorer',
    'threatexchange',
  ]),
  compileRule('locale-search', [
    'locale',
    'locales',
    'language',
    'languages',
    'region',
    'regional',
    'country',
    'zh-cn',
    'ar-ar',
    'ar',
    'en-gb',
    'pt-br',
  ]),
  compileRule('short-link-resolution', [
    'fb.com',
    'fb.me',
    'short link',
    'short links',
    'shortened',
    'resolve',
  ]),
  compileRule('infrastructure-enum', [
    'infrastructure',
    'cdn',
    'dns',
    'cert',
    'ct logs',
    'probe',
    'subdomain',
    'subdomains',
  ]),
  compileRule('mobile-variants', [
    'mobile',
    'mbasic',
    'mtouch',
    'lite',
    'free basics',
    'zero-rated',
  ]),
  compileRule('corporate-intel', [
    'corporate',
    'investor',
    'newsroom',
    'transparency report',
  ]),
  compileRule('auth-flow-analysis', [
    'oauth',
    'login flow',
    'auth flow',
    'connect.facebook.com',
  ]),
];

export function scoreIntent(text) {
  const q = safeStr(text, 1000).toLowerCase();
  if (!q.trim()) return 'profile-discovery';

  let best = { id: 'profile-discovery', score: 0 };
  for (const rule of INTENT_RULES) {
    let score = 0;
    for (const m of rule.matchers) {
      if (m.re.test(q)) score += m.weight;
    }
    if (score > best.score) best = { id: rule.id, score };
  }
  return best.id;
}

function extractFirstUrl(text) {
  if (!text) return null;
  const s = String(text);
  const fullMatch = s.match(/https?:\/\/[^\s)<>"]+/i);
  if (fullMatch) return fullMatch[0].replace(/[.,;!]+$/, '');

  const bareFbMatch = s.match(
    /(?:^|[\s(])((?:[a-z0-9-]+\.)*(?:facebook\.com|fb\.com|fb\.me)(?:\/[^\s)<>"]*)?)/i
  );
  if (bareFbMatch?.[1]) {
    return bareFbMatch[1].replace(/[.,;!]+$/, '');
  }
  return null;
}

function isFacebookHost(host) {
  if (!host || typeof host !== 'string') return false;
  const h = host.toLowerCase();
  return (
    h === 'facebook.com' ||
    h.endsWith('.facebook.com') ||
    h === 'fb.com' ||
    h.endsWith('.fb.com') ||
    h === 'fb.me' ||
    h.endsWith('.fb.me')
  );
}

function inspectUrl(rawUrl) {
  if (!rawUrl) return null;
  const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  if (!isSafeHttpUrl(normalized)) return null;

  try {
    const parsedUrl = new URL(normalized);
    const host = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname || '/';
    const isFb = isFacebookHost(host);
    const isLinkShim =
      (host === 'facebook.com' || host.endsWith('.facebook.com')) &&
      (pathname === '/l.php' || pathname.endsWith('/l.php'));
    const hasUParam = isLinkShim && parsedUrl.searchParams.has('u');
    const extracted = extractTargetPath(normalized, 500);

    return {
      fullUrl: normalized,
      host,
      pathname,
      isFacebook: isFb,
      isLinkShim,
      hasUParam,
      linkShimDest: extracted.linkShimDest,
      extracted,
    };
  } catch {
    return null;
  }
}

function handleSlashCommand(trimmed, methods) {
  if (!trimmed.startsWith('/')) return null;

  const [cmdRaw, ...rest] = trimmed.slice(1).split(/\s+/);
  const cmd = (cmdRaw || '').toLowerCase();
  const arg = rest.join(' ').trim();

  if (cmd === 'help') {
    return {
      text:
        `Commands:\n` +
        `- \`/goal <id>\` (example: \`/goal link-tracking\`)\n` +
        `- \`/export\`\n` +
        `- \`/bulkopen\`\n` +
        `- \`/settings\`\n` +
        `- \`/help\`\n`,
      actions: [
        { type: 'openModal', label: 'Settings', payload: { modal: 'settings' } },
        { type: 'openModal', label: 'View methods', payload: { modal: 'methods' } },
      ],
    };
  }

  if (cmd === 'settings') {
    const action = { type: 'openModal', label: 'Settings', payload: { modal: 'settings' } };
    return {
      text: 'Opening settings.',
      actions: [action],
      autoAction: action,
    };
  }

  if (cmd === 'goal') {
    const id = arg || 'profile-discovery';
    const exists = methods.some((m) => m.id === id);
    if (!exists) {
      return {
        text: `Unknown goal id: \`${id}\`. Try: ${methods
          .slice(0, 10)
          .map((m) => `\`${m.id}\``)
          .join(', ')}.`,
        actions: [{ type: 'openModal', label: 'View methods', payload: { modal: 'methods' } }],
      };
    }
    const action = { type: 'setGoal', label: `Set goal: ${id}`, payload: { goalId: id } };
    return {
      text: `Goal set to \`${id}\`. Now run a search target (username/id/path).`,
      actions: [action],
      autoAction: action,
    };
  }

  if (cmd === 'export') {
    const action = { type: 'exportCsv', label: 'Export CSV', payload: {} };
    return {
      text: 'Exporting last results (CSV).',
      actions: [action],
      autoAction: action,
    };
  }

  if (cmd === 'bulkopen') {
    const action = { type: 'bulkOpen', label: 'Bulk open', payload: {} };
    return {
      text: 'Bulk-opening last results.',
      actions: [action],
      autoAction: action,
    };
  }

  return null;
}

function localRespond(text, ctx) {
  const idx = ctx.prefixIndex;
  const methods = ctx.methods;
  const q = safeStr(text, 800);
  const trimmed = q.trim();

  const slashRes = handleSlashCommand(trimmed, methods);
  if (slashRes) return slashRes;

  const rawUrl = extractFirstUrl(q);
  const urlInfo = rawUrl ? inspectUrl(rawUrl) : null;

  if (urlInfo?.isLinkShim) {
    if (urlInfo.linkShimDest) {
      return {
        text:
          `Facebook Link Shim URL detected (\`${urlInfo.host}\`).\n\n` +
          `- Destination (decoded from \`u=\`): ${urlInfo.linkShimDest}\n` +
          `- Next: inspect the destination or open the full Link Shim URL to check redirect/referral headers.\n`,
        actions: [
          { type: 'open', label: 'Open destination', payload: urlInfo.linkShimDest },
          { type: 'copy', label: 'Copy destination', payload: urlInfo.linkShimDest },
          { type: 'open', label: 'Open Link Shim', payload: urlInfo.fullUrl },
        ],
      };
    }

    if (urlInfo.hasUParam) {
      return {
        text:
          `Facebook Link Shim URL detected (\`${urlInfo.host}\`), but the \`u=\` destination uses an unsafe or invalid URL scheme and was blocked.\n\n` +
          `- Only \`http://\` and \`https://\` destinations are allowed.\n`,
        actions: [
          { type: 'setGoal', label: 'Set goal: link-tracking', payload: { goalId: 'link-tracking' } },
        ],
      };
    }
  }

  if (urlInfo?.isFacebook) {
    const targetPath = urlInfo.extracted.fullPath;
    const isShortDomain =
      urlInfo.host === 'fb.com' ||
      urlInfo.host.endsWith('.fb.com') ||
      urlInfo.host === 'fb.me' ||
      urlInfo.host.endsWith('.fb.me');
    const goalId = isShortDomain ? 'short-link-resolution' : 'profile-discovery';
    const pivotHosts = isShortDomain
      ? ['fb.com', 'fb.me', 'mbasic.facebook.com', 'm.facebook.com', 'www.facebook.com']
      : ['mbasic.facebook.com', 'mtouch.facebook.com', 'm.facebook.com', 'touch.facebook.com', 'www.facebook.com'];

    const pivotLines = pivotHosts
      .map((h) => buildSafeHostUrl(h, targetPath))
      .filter(Boolean)
      .map((u) => `- ${u}`)
      .join('\n');

    const mbasicUrl = buildSafeHostUrl('mbasic.facebook.com', targetPath);

    return {
      text:
        `Detected Facebook URL from \`${urlInfo.host}\`${targetPath ? ` — target path: \`${targetPath}\`` : ''}.\n\n` +
        `Prefix pivot URLs:\n${pivotLines}\n`,
      actions: [
        ...(targetPath
          ? [{ type: 'runSearch', label: `Search “${targetPath.slice(0, 32)}”`, payload: targetPath }]
          : []),
        ...(mbasicUrl ? [{ type: 'open', label: 'Open on mbasic', payload: mbasicUrl }] : []),
        ...(targetPath ? [{ type: 'copy', label: 'Copy target', payload: targetPath }] : []),
        { type: 'setGoal', label: `Set goal: ${goalId}`, payload: { goalId } },
      ],
    };
  }

  const intent = scoreIntent(q);
  const method = methods.find((m) => m.id === intent) || methods[0];

  const prefixes = (method?.prefixes || [])
    .map((p) => resolvePrefixHost(idx, p))
    .filter(Boolean);

  const parsedTarget = ctx.lastTarget ? extractTargetPath(ctx.lastTarget, 500) : null;
  const target = parsedTarget?.fullPath || (ctx.lastTarget ? sanitizeForUrl(ctx.lastTarget, 500) : '');
  const examplePath = target ? `/${target}` : '/{username-or-id}';

  const steps = (method?.steps || []).slice(0, 5).map((s) => `- ${s}`).join('\n');
  const prefixLines = prefixes.slice(0, 10).map((h) => `- ${h}${examplePath}`).join('\n');

  return {
    text:
      `Goal: **${method?.name || 'OSINT'}**\n\n` +
      `Recommended prefixes:\n${prefixLines || '- (none)'}\n\n` +
      `Workflow:\n${steps || '- Start with mbasic, then escalate to www.'}\n`,
    actions: [
      ...(target ? [{ type: 'runSearch', label: `Search “${target.slice(0, 32)}”`, payload: target }] : []),
      { type: 'setGoal', label: `Set goal: ${method?.id}`, payload: { goalId: method?.id } },
      { type: 'openModal', label: 'View methods', payload: { modal: 'methods', methodId: method?.id } },
      ...(ctx.lastResults?.length ? [{ type: 'exportCsv', label: 'Export last results', payload: {} }] : []),
    ],
  };
}

function normalizeHistory(history, forAnthropic = false) {
  if (!Array.isArray(history) || !history.length) return [];

  const cleaned = [];
  for (const item of history.slice(-MAX_HISTORY_MESSAGES)) {
    if (!item || typeof item !== 'object') continue;
    const role = item.role === 'user' || item.role === 'assistant' ? item.role : null;
    const content = safeStr(item.content ?? item.text ?? '', 1000).trim();
    if (!role || !content) continue;
    cleaned.push({ role, content });
  }

  if (!forAnthropic) return cleaned;

  const alternating = [];
  for (const msg of cleaned) {
    if (!alternating.length && msg.role !== 'user') continue;
    const prev = alternating[alternating.length - 1];
    if (prev && prev.role === msg.role) {
      prev.content = `${prev.content}\n${msg.content}`;
    } else {
      alternating.push({ ...msg });
    }
  }
  if (alternating.length && alternating[alternating.length - 1].role === 'user') {
    alternating.pop();
  }
  return alternating;
}

async function fetchWithTimeout(url, options, timeoutMs = LLM_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function openAIRespond(text, ctx) {
  const local = localRespond(text, ctx);
  const key = getOpenAIKey();
  if (!key) {
    return {
      ...local,
      warning: 'OpenAI API key not configured — using offline assistant',
    };
  }

  const sys =
    `You are an OSINT workflow assistant for exploring Facebook subdomain prefixes and URL patterns. ` +
    `You must be precise, avoid hallucinating. When unsure, ask for a concrete target path or URL. ` +
    `Prefer actionable steps and short checklists.`;

  const user =
    `User message: ${safeStr(text, 1200)}\n\n` +
    `Known target path (if any): ${ctx.lastTarget || '(none)'}\n` +
    `Recent results count: ${ctx.lastResults?.length || 0}\n` +
    `Available method combos: ${ctx.methods.map((m) => `${m.id}:${m.name}`).slice(0, 30).join(', ')}\n`;

  const recentHistory = normalizeHistory(ctx.history, false);

  try {
    const resp = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          ...recentHistory,
          { role: 'user', content: user },
        ],
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      return {
        ...local,
        warning: `OpenAI request failed (${resp.status}) — using offline assistant`,
      };
    }

    let data;
    try {
      data = await resp.json();
    } catch {
      return {
        ...local,
        warning: 'OpenAI returned invalid JSON — using offline assistant',
      };
    }

    const content = data?.choices?.[0]?.message?.content?.trim() || '';
    if (!content) {
      return {
        ...local,
        warning: 'OpenAI returned an empty response — using offline assistant',
      };
    }

    return { text: content, actions: local.actions || [] };
  } catch (err) {
    const reason = err?.name === 'AbortError' ? 'timed out' : 'network error';
    return {
      ...local,
      warning: `OpenAI request failed (${reason}) — using offline assistant`,
    };
  }
}

async function anthropicRespond(text, ctx) {
  const local = localRespond(text, ctx);
  const key = getAnthropicKey();
  if (!key) {
    return {
      ...local,
      warning: 'Anthropic API key not configured — using offline assistant',
    };
  }

  const sys =
    `You are an OSINT workflow assistant for exploring Facebook subdomain prefixes and URL patterns. ` +
    `Be accurate, structured, and action-focused.`;

  const user =
    `User message: ${safeStr(text, 1200)}\n\n` +
    `Known target path (if any): ${ctx.lastTarget || '(none)'}\n` +
    `Recent results count: ${ctx.lastResults?.length || 0}\n` +
    `Available method combos: ${ctx.methods.map((m) => `${m.id}:${m.name}`).slice(0, 30).join(', ')}\n`;

  const recentHistory = normalizeHistory(ctx.history, true);

  try {
    const resp = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 600,
        system: sys,
        messages: [...recentHistory, { role: 'user', content: user }],
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      return {
        ...local,
        warning: `Anthropic request failed (${resp.status}) — using offline assistant`,
      };
    }

    let data;
    try {
      data = await resp.json();
    } catch {
      return {
        ...local,
        warning: 'Anthropic returned invalid JSON — using offline assistant',
      };
    }

    const content = data?.content?.[0]?.text?.trim() || '';
    if (!content) {
      return {
        ...local,
        warning: 'Anthropic returned an empty response — using offline assistant',
      };
    }

    return { text: content, actions: local.actions || [] };
  } catch (err) {
    const reason = err?.name === 'AbortError' ? 'timed out' : 'network error';
    return {
      ...local,
      warning: `Anthropic request failed (${reason}) — using offline assistant`,
    };
  }
}

export function createAssistant() {
  const prefixIndex = getPrefixIndex();
  const methods = getMethodCombinations();

  async function respond(text, { lastTarget = '', lastResults = [], history = [] } = {}) {
    const ctx = { prefixIndex, methods, lastTarget, lastResults, history };
    const trimmed = safeStr(text, 800).trim();

    const slashRes = handleSlashCommand(trimmed, methods);
    if (slashRes) return slashRes;

    const provider = getProvider();

    try {
      if (provider === 'openai') return await openAIRespond(text, ctx);
      if (provider === 'anthropic') return await anthropicRespond(text, ctx);
      return localRespond(text, ctx);
    } catch (err) {
      return {
        ...localRespond(text, ctx),
        warning: `Assistant provider error (${err?.message || 'unknown'}) — using offline assistant`,
      };
    }
  }

  return { respond, prefixIndex, methods };
}
