import { getMethodCombinations } from '../domain/methods.js';
import { getPrefixIndex, resolvePrefixHost } from '../domain/prefixes.js';
import { safeStr } from '../utils/lang.js';
import { sanitizeForUrl } from '../utils/security.js';
import { getPlan, hasFeature, getProvider, getOpenAIKey, getAnthropicKey } from '../commercial/entitlements.js';

function buildHostUrl(host, path) {
  const base = host.startsWith('http') ? host : `https://${host}`;
  const p = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const url = base + p;
  return url.length > 2048 ? base : url;
}

function extractFirstUrl(text) {
  if (!text) return null;
  const m = String(text).match(/https?:\/\/[^\s)]+/i);
  return m ? m[0] : null;
}

function analyzeFacebookUrl(url) {
  try {
    const u = new URL(url);
    const host = u.host.toLowerCase();
    const path = u.pathname || '/';
    const isLinkShim = host.endsWith('facebook.com') && (path === '/l.php' || path.endsWith('/l.php'));
    const linkShimDest = isLinkShim ? u.searchParams.get('u') : null;
    return { host, path, isLinkShim, linkShimDest };
  } catch {
    return null;
  }
}

function scoreIntent(text) {
  const q = (text || '').toLowerCase();
  const rules = [
    { id: 'profile-discovery', w: ['profile', 'user', 'username', 'id', 'who is', 'lookup', 'find'] },
    { id: 'link-tracking', w: ['link', 'redirect', 'referral', 'utm', 'l.php', 'link shim', 'trace'] },
    { id: 'business-intel', w: ['ads', 'advertiser', 'business', 'page transparency', 'political', 'brand'] },
    { id: 'api-discovery', w: ['api', 'graph', 'developer', 'token', 'endpoint', 'explorer'] },
    { id: 'locale-search', w: ['locale', 'language', 'region', 'country', 'zh-cn', 'ar-ar', 'en-gb'] },
    { id: 'short-link-resolution', w: ['fb.com', 'fb.me', 'short link', 'resolve'] },
    { id: 'infrastructure-enum', w: ['infrastructure', 'cdn', 'dns', 'cert', 'ct logs', 'probe'] },
  ];

  let best = { id: 'profile-discovery', score: 0 };
  for (const r of rules) {
    let s = 0;
    for (const kw of r.w) if (q.includes(kw)) s += kw.length >= 6 ? 2 : 1;
    if (s > best.score) best = { id: r.id, score: s };
  }
  return best.id;
}

function localRespond(text, ctx) {
  const idx = ctx.prefixIndex;
  const methods = ctx.methods;
  const q = safeStr(text, 800);

  const trimmed = q.trim();
  if (trimmed.startsWith('/')) {
    const [cmdRaw, ...rest] = trimmed.slice(1).split(/\s+/);
    const cmd = (cmdRaw || '').toLowerCase();
    const arg = rest.join(' ').trim();

    if (cmd === 'help') {
      return {
        text:
          `Commands:\n` +
          `- \`/goal <id>\` (example: \`/goal link-tracking\`)\n` +
          `- \`/export\` (Pro)\n` +
          `- \`/bulkopen\` (Pro)\n` +
          `- \`/plans\`\n`,
        actions: [
          { type: 'openModal', label: 'View plans', payload: { modal: 'pricing' } },
          { type: 'openModal', label: 'View methods', payload: { modal: 'methods' } },
        ],
      };
    }

    if (cmd === 'plans') {
      return { text: 'Opening plans & settings.', actions: [{ type: 'openModal', label: 'Plans & Settings', payload: { modal: 'pricing' } }] };
    }

    if (cmd === 'goal') {
      const id = arg || 'profile-discovery';
      const exists = methods.some((m) => m.id === id);
      if (!exists) {
        return {
          text: `Unknown goal id: \`${id}\`. Try: ${methods.slice(0, 8).map((m) => `\`${m.id}\``).join(', ')}.`,
          actions: [{ type: 'openModal', label: 'View methods', payload: { modal: 'methods' } }],
        };
      }
      return {
        text: `Goal set to \`${id}\`. Now run a search target (username/id/path).`,
        actions: [{ type: 'setGoal', label: `Set goal: ${id}`, payload: { goalId: id } }],
      };
    }

    if (cmd === 'export') {
      return {
        text: `Exporting last results (CSV).`,
        actions: [{ type: 'exportCsv', label: 'Export CSV', payload: {} }],
      };
    }

    if (cmd === 'bulkopen') {
      return {
        text: `Bulk-opening last results.`,
        actions: [{ type: 'bulkOpen', label: 'Bulk open', payload: {} }],
      };
    }
  }

  const url = extractFirstUrl(q);
  const urlAnalysis = url ? analyzeFacebookUrl(url) : null;

  if (urlAnalysis?.isLinkShim && urlAnalysis.linkShimDest) {
    return {
      text:
        `That looks like a Facebook Link Shim URL.\n\n` +
        `- Destination (decoded from \`u=\`): ${urlAnalysis.linkShimDest}\n` +
        `- Next: open \`l.facebook.com/l.php\` in a new tab and inspect any referrer / tracking params.\n`,
      actions: [
        { type: 'open', label: 'Open Link Shim', payload: buildHostUrl('l.facebook.com', '/l.php') },
        { type: 'copy', label: 'Copy destination', payload: urlAnalysis.linkShimDest },
      ],
    };
  }

  const intent = scoreIntent(q);
  const method = methods.find((m) => m.id === intent) || methods[0];

  const prefixes = (method?.prefixes || [])
    .map((p) => resolvePrefixHost(idx, p))
    .filter(Boolean);

  const target = ctx.lastTarget ? sanitizeForUrl(ctx.lastTarget, 500) : '';
  const examplePath = target ? `/${target}` : '/{username-or-id}';

  const steps = (method?.steps || []).slice(0, 5).map((s) => `- ${s}`).join('\n');
  const prefixLines = prefixes.slice(0, 10).map((h) => `- ${h}${examplePath}`).join('\n');

  const plan = getPlan();
  const upsell = plan.id === 'free'
    ? `\n\nTip: Pro unlocks export + bulk-open + more results per search.`
    : '';

  return {
    text:
      `Goal: **${method?.name || 'OSINT'}**\n\n` +
      `Recommended prefixes:\n${prefixLines || '- (none)'}\n\n` +
      `Workflow:\n${steps || '- Start with mbasic, then escalate to www.'}\n` +
      upsell,
    actions: [
      ...(target ? [{ type: 'runSearch', label: `Search “${target}”`, payload: target }] : []),
      { type: 'setGoal', label: `Set goal: ${method?.id}`, payload: { goalId: method?.id } },
      { type: 'openModal', label: 'View methods', payload: { modal: 'methods', methodId: method?.id } },
      ...(hasFeature('export') && ctx.lastResults?.length ? [{ type: 'exportCsv', label: 'Export last results', payload: {} }] : []),
    ],
  };
}

async function openAIRespond(text, ctx) {
  const key = getOpenAIKey();
  if (!key) return localRespond(text, ctx);

  const sys =
    `You are an OSINT workflow assistant for exploring Facebook subdomain prefixes and URL patterns. ` +
    `You must be precise, avoid hallucinating. When unsure, ask for a concrete target path or URL. ` +
    `Prefer actionable steps and short checklists.`;

  const user =
    `User message: ${safeStr(text, 1200)}\n\n` +
    `Known target path (if any): ${ctx.lastTarget || '(none)'}\n` +
    `Recent results count: ${ctx.lastResults?.length || 0}\n` +
    `Available method combos: ${ctx.methods.map((m) => `${m.id}:${m.name}`).slice(0, 30).join(', ')}\n` +
    `Plan: ${getPlan().id}\n`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
    }),
  });

  if (!resp.ok) return localRespond(text, ctx);
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return { text: content || localRespond(text, ctx).text, actions: [] };
}

async function anthropicRespond(text, ctx) {
  const key = getAnthropicKey();
  if (!key) return localRespond(text, ctx);

  const sys =
    `You are an OSINT workflow assistant for exploring Facebook subdomain prefixes and URL patterns. ` +
    `Be accurate, structured, and action-focused.`;

  const user =
    `User message: ${safeStr(text, 1200)}\n\n` +
    `Known target path (if any): ${ctx.lastTarget || '(none)'}\n` +
    `Recent results count: ${ctx.lastResults?.length || 0}\n` +
    `Available method combos: ${ctx.methods.map((m) => `${m.id}:${m.name}`).slice(0, 30).join(', ')}\n` +
    `Plan: ${getPlan().id}\n`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 600,
      system: sys,
      messages: [{ role: 'user', content: user }],
      temperature: 0.2,
    }),
  });

  if (!resp.ok) return localRespond(text, ctx);
  const data = await resp.json();
  const content = data?.content?.[0]?.text || '';
  return { text: content || localRespond(text, ctx).text, actions: [] };
}

export function createAssistant() {
  const prefixIndex = getPrefixIndex();
  const methods = getMethodCombinations();

  async function respond(text, { lastTarget = '', lastResults = [] } = {}) {
    const ctx = { prefixIndex, methods, lastTarget, lastResults };
    const provider = getProvider();
    const plan = getPlan();

    if (provider !== 'local' && !plan.features.llmProviders) {
      return {
        text: `LLM providers are a Pro feature. Switch provider to Local, or upgrade to Pro.`,
        actions: [{ type: 'openModal', label: 'View plans', payload: { modal: 'pricing' } }],
      };
    }

    try {
      if (provider === 'openai') return await openAIRespond(text, ctx);
      if (provider === 'anthropic') return await anthropicRespond(text, ctx);
      return localRespond(text, ctx);
    } catch {
      return localRespond(text, ctx);
    }
  }

  return { respond, prefixIndex, methods };
}

