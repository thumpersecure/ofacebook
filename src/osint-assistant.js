/**
 * Facebook OSINT Assistant Logic
 * Maps user queries to recommended methods, prefix combinations, and workflows.
 * @module osint-assistant
 */

// --- PREFIX DEFINITIONS ---

const PREFIXES = {
  mbasic: {
    id: 'mbasic',
    domain: 'mbasic.facebook.com',
    description: 'Mobile basic (lightweight) version',
    useCases: ['profile_discovery', 'unauthenticated_viewing', 'graph_search_workaround'],
    tips: ['Try mbasic for unauthenticated profile viewing', 'Often shows more content without login'],
  },
  mtouch: {
    id: 'mtouch',
    domain: 'mtouch.facebook.com',
    description: 'Mobile touch interface',
    useCases: ['profile_discovery', 'graph_search_workaround'],
    tips: ['Use mtouch with /graphsearch/ for photo-tagged and people search workarounds'],
  },
  l: {
    id: 'l',
    domain: 'l.facebook.com',
    description: 'Link Shim redirect / referral tracer',
    useCases: ['link_analysis', 'referral_tracing'],
    tips: ['Use l.facebook.com to trace link referrals', 'Shows traffic passed through Facebook Link Shim'],
  },
  lm: {
    id: 'lm',
    domain: 'lm.facebook.com',
    description: 'Link Shim (mobile)',
    useCases: ['link_analysis', 'referral_tracing'],
    tips: ['lm.facebook.com = Link Shim traffic from mobile devices'],
  },
  www: {
    id: 'www',
    domain: 'www.facebook.com',
    description: 'Standard desktop site',
    useCases: ['profile_discovery', 'business_intel', 'general'],
    tips: ['Standard interface; may require login for full access'],
  },
  m: {
    id: 'm',
    domain: 'm.facebook.com',
    description: 'Mobile full site',
    useCases: ['profile_discovery', 'general'],
    tips: ['Mobile-optimized; sometimes different content visibility'],
  },
  touch: {
    id: 'touch',
    domain: 'touch.facebook.com',
    description: 'Touch-optimized interface',
    useCases: ['profile_discovery'],
    tips: ['Alternative mobile interface for older devices'],
  },
  graph: {
    id: 'graph',
    domain: 'graph.facebook.com',
    description: 'Graph API endpoint',
    useCases: ['api_intel', 'developer_intel'],
    tips: ['Requires access tokens; useful for structured data queries'],
  },
  business: {
    id: 'business',
    domain: 'business.facebook.com',
    description: 'Meta for Business / Ads Manager',
    useCases: ['business_intel', 'ad_research'],
    tips: ['Business pages, ads library, page transparency'],
  },
  developers: {
    id: 'developers',
    domain: 'developers.facebook.com',
    description: 'Developer platform & Graph API Explorer',
    useCases: ['api_intel', 'developer_intel'],
    tips: ['Graph API Explorer for testing queries', 'ThreatExchange for threat intel'],
  },
  fb: {
    id: 'fb',
    domain: 'fb.com',
    description: 'Short domain redirect',
    useCases: ['link_analysis', 'general'],
    tips: ['Short links resolve to www; useful for tracking redirect chains'],
  },
  fbme: {
    id: 'fbme',
    domain: 'fb.me',
    description: 'Short link domain',
    useCases: ['link_analysis'],
    tips: ['Trace fb.me short links to resolve destination URLs'],
  },
};

// --- INTENT MAPPING (query keywords → intent) ---

const INTENT_KEYWORDS = {
  profile_discovery: [
    'find profile', 'find person', 'lookup profile', 'search profile',
    'profile search', 'find user', 'locate profile', 'discover profile',
    'who is', 'identify', 'person search', 'profile lookup',
  ],
  link_analysis: [
    'track links', 'trace links', 'link analysis', 'follow links',
    'link redirect', 'referral', 'where did link go', 'trace url',
    'link shim', 'l.facebook', 'short link', 'fb.me',
  ],
  business_intel: [
    'business research', 'business intel', 'company research',
    'ad research', 'ads library', 'page transparency', 'business page',
    'advertiser', 'brand research', 'competitor',
  ],
  api_intel: [
    'api', 'developer', 'graph api', 'api explorer', 'graph search',
    'structured data', 'developer intel', 'api query',
  ],
  locale_search: [
    'locale', 'language', 'region', 'country', 'zh-cn', 'ar',
    'localized', 'regional search', 'language-specific',
  ],
};

// --- CONTEXTUAL TIPS BY CATEGORY ---

const CONTEXTUAL_TIPS = {
  profile_discovery: [
    'Try mbasic for unauthenticated profile viewing',
    'Use mtouch.facebook.com/graphsearch/USERID/photos-tagged for tagged photos',
    'Extract userID from page source (search for "userID" or "pageID")',
    'mbasic often bypasses some login walls',
  ],
  link_analysis: [
    'Use l.facebook.com to trace link referrals',
    'l.facebook.com/l.php?u= shows the Link Shim redirect format',
    'Check lm.facebook.com for mobile Link Shim traffic',
    'Trace fb.me and fb.com short links to resolve destinations',
  ],
  business_intel: [
    'business.facebook.com/ads/library for ad transparency',
    'Page transparency shows admin locations and history',
    'Ads Library supports keyword and advertiser search',
  ],
  api_intel: [
    'developers.facebook.com/tools/explorer for Graph API testing',
    'ThreatExchange at developers.facebook.com for threat intel sharing',
    'Access tokens required for most Graph API queries',
  ],
  locale_search: [
    'Use zh-cn.facebook.com for Chinese (Simplified)',
    'ar-ar.facebook.com for Arabic',
    'Subdomain format: {locale}.facebook.com',
  ],
};

// --- RECOMMENDATION RULES: intent → prefix combinations ---

const RECOMMENDATION_RULES = {
  profile_discovery: {
    primary: ['mbasic', 'mtouch', 'www'],
    alternatives: ['m', 'touch'],
    workflow: [
      'Start with mbasic.facebook.com for unauthenticated viewing',
      'If blocked, try mtouch with /graphsearch/ paths',
      'Extract numeric userID from page source if needed',
      'Use www for full features when authenticated',
    ],
  },
  link_analysis: {
    primary: ['l', 'lm'],
    alternatives: ['fb', 'fbme'],
    workflow: [
      'Identify l.facebook.com or lm.facebook.com in referral data',
      'Use l.facebook.com to trace where links originated',
      'Decode l.php?u= parameter to get destination URL',
      'Trace fb.me/fb.com short links through redirect chain',
    ],
  },
  business_intel: {
    primary: ['business', 'www'],
    alternatives: ['developers'],
    workflow: [
      'Go to business.facebook.com/ads/library',
      'Search by advertiser name or keyword',
      'Check Page transparency for admin info',
      'Cross-reference with www for public page content',
    ],
  },
  api_intel: {
    primary: ['developers', 'graph'],
    alternatives: ['business'],
    workflow: [
      'Use developers.facebook.com/tools/explorer',
      'Obtain access token for your use case',
      'Query graph.facebook.com endpoints',
      'Check ThreatExchange for threat intel',
    ],
  },
  locale_search: {
    primary: ['www'], // locale is subdomain prefix like zh-cn
    alternatives: ['mbasic', 'm'],
    workflow: [
      'Use {locale}.facebook.com (e.g., zh-cn.facebook.com)',
      'Try mbasic for locale-specific mobile view',
      'Combine: zh-cn.mbasic.facebook.com for Chinese mbasic',
    ],
  },
};

// --- ALTERNATIVE APPROACH MAPPING ---

const ALTERNATIVE_APPROACHES = {
  profile_discovery: [
    { method: 'mbasic', when: 'Standard www requires login' },
    { method: 'mtouch + graphsearch', when: 'Need tagged photos or people search' },
    { method: 'Page source extraction', when: 'Need userID for API or other tools' },
  ],
  link_analysis: [
    { method: 'l.facebook.com referral check', when: 'Analytics show l.facebook.com traffic' },
    { method: 'Decode l.php?u= parameter', when: 'Have Link Shim URL' },
    { method: 'Follow fb.me redirect chain', when: 'Tracing short links' },
  ],
  business_intel: [
    { method: 'Ads Library search', when: 'Researching advertisers or campaigns' },
    { method: 'Page transparency', when: 'Need admin/location history' },
    { method: 'business.facebook.com', when: 'General business page research' },
  ],
  api_intel: [
    { method: 'Graph API Explorer', when: 'Testing queries or exploring schema' },
    { method: 'Direct graph.facebook.com', when: 'Have token and know endpoint' },
    { method: 'ThreatExchange', when: 'Threat intel sharing' },
  ],
  locale_search: [
    { method: '{locale}.facebook.com', when: 'Need language-specific content' },
    { method: '{locale}.mbasic.facebook.com', when: 'Locale + unauthenticated' },
  ],
};

// --- LOCALE PREFIXES (for locale-specific search) ---

const LOCALE_PREFIXES = [
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'zh-tw', name: 'Chinese (Traditional)' },
  { code: 'ar-ar', name: 'Arabic' },
  { code: 'es-la', name: 'Spanish (Latin America)' },
  { code: 'pt-br', name: 'Portuguese (Brazil)' },
  { code: 'fr-fr', name: 'French' },
  { code: 'de-de', name: 'German' },
  { code: 'ja-jp', name: 'Japanese' },
  { code: 'ko-kr', name: 'Korean' },
  { code: 'ru-ru', name: 'Russian' },
  { code: 'hi-in', name: 'Hindi' },
  { code: 'en-gb', name: 'English (UK)' },
];

/**
 * Detect intent from user query (natural language or selected prefix).
 * @param {string} query - User query or prefix selection
 * @returns {string|null} - Detected intent key or null
 */
function detectIntent(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.toLowerCase().trim();

  // Direct prefix selection
  const prefixIds = Object.keys(PREFIXES);
  if (prefixIds.includes(q) || prefixIds.some((p) => q === PREFIXES[p].domain)) {
    const prefix = prefixIds.find((p) => q === p || q === PREFIXES[p].domain);
    const prefixData = PREFIXES[prefix];
    return prefixData?.useCases?.[0] ?? 'profile_discovery';
  }

  // Keyword-based intent detection
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((kw) => q.includes(kw))) return intent;
  }

  return null;
}

/**
 * Get recommended methods, prefix combinations, and workflow for a query.
 * @param {string} query - User query or selected prefix
 * @returns {Object} - Full recommendation object
 */
function getRecommendation(query) {
  const intent = detectIntent(query) || 'profile_discovery';
  const rules = RECOMMENDATION_RULES[intent];
  const tips = CONTEXTUAL_TIPS[intent];
  const alternatives = ALTERNATIVE_APPROACHES[intent];

  const primaryPrefixes = (rules?.primary ?? []).map((id) => PREFIXES[id]).filter(Boolean);
  const altPrefixes = (rules?.alternatives ?? []).map((id) => PREFIXES[id]).filter(Boolean);

  return {
    intent,
    query,
    primaryPrefixes,
    alternativePrefixes: altPrefixes,
    workflow: rules?.workflow ?? [],
    contextualTips: tips ?? [],
    alternativeApproaches: alternatives ?? [],
    localePrefixes: intent === 'locale_search' ? LOCALE_PREFIXES : null,
  };
}

/**
 * Get method suggestions based on user goal.
 * @param {string} goal - One of: profile_discovery, link_analysis, business_intel, api_intel, locale_search
 * @returns {Object} - Methods and tips for the goal
 */
function getMethodsByGoal(goal) {
  const validGoals = Object.keys(RECOMMENDATION_RULES);
  const g = validGoals.includes(goal) ? goal : 'profile_discovery';
  const rules = RECOMMENDATION_RULES[g];

  return {
    goal: g,
    methods: [
      ...(rules.primary ?? []).map((id) => ({
        id,
        ...PREFIXES[id],
        role: 'primary',
      })),
      ...(rules.alternatives ?? []).map((id) => ({
        id,
        ...PREFIXES[id],
        role: 'alternative',
      })),
    ],
    workflow: rules?.workflow ?? [],
    tips: CONTEXTUAL_TIPS[g] ?? [],
    alternativeApproaches: ALTERNATIVE_APPROACHES[g] ?? [],
  };
}

/**
 * Get all prefixes (for UI dropdown or reference).
 * @returns {Object} - All prefix definitions
 */
function getAllPrefixes() {
  return { ...PREFIXES };
}

/**
 * Get contextual tips for a given intent or prefix.
 * @param {string} intentOrPrefix - Intent key or prefix id
 * @returns {string[]} - Array of tip strings
 */
function getContextualTips(intentOrPrefix) {
  if (CONTEXTUAL_TIPS[intentOrPrefix]) {
    return CONTEXTUAL_TIPS[intentOrPrefix];
  }
  const prefix = PREFIXES[intentOrPrefix];
  if (prefix?.tips) return prefix.tips;
  return [];
}

/**
 * Build full URL for a prefix + path.
 * @param {string} prefixId - Prefix id (e.g. 'mbasic', 'l')
 * @param {string} path - Path to append (e.g. '/username', '/l.php')
 * @returns {string} - Full URL
 */
function buildUrl(prefixId, path = '') {
  const prefix = PREFIXES[prefixId];
  if (!prefix) return '';
  const base = `https://${prefix.domain}`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return base + (path ? p : '');
}

/**
 * Get step-by-step workflow for a query.
 * @param {string} query - User query or selected prefix
 * @returns {Object} - Workflow steps and metadata
 */
function getWorkflow(query) {
  const rec = getRecommendation(query);
  return {
    intent: rec.intent,
    steps: rec.workflow.map((text, i) => ({ step: i + 1, action: text })),
    tips: rec.contextualTips,
  };
}

// --- EXPORTS ---

const api = {
  detectIntent,
  getRecommendation,
  getMethodsByGoal,
  getAllPrefixes,
  getContextualTips,
  buildUrl,
  getWorkflow,
  PREFIXES,
  INTENT_KEYWORDS,
  RECOMMENDATION_RULES,
  CONTEXTUAL_TIPS,
  LOCALE_PREFIXES,
};

export {
  detectIntent,
  getRecommendation,
  getMethodsByGoal,
  getAllPrefixes,
  getContextualTips,
  buildUrl,
  getWorkflow,
  PREFIXES,
  INTENT_KEYWORDS,
  RECOMMENDATION_RULES,
  CONTEXTUAL_TIPS,
  LOCALE_PREFIXES,
};

// CommonJS / Node compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...api, default: api };
}
