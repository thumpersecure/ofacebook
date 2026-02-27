/**
 * Facebook OSINT Data Library
 * Comprehensive subdomain definitions, method combinations, and workflows.
 * Based on thumpersecure-style prefix patterns and Facebook infrastructure.
 * @module data
 */

// =============================================================================
// SUBDOMAIN DEFINITIONS
// Each entry: subdomain, category, purpose, OSINT use case, recommended methods
// =============================================================================

/**
 * @typedef {Object} SubdomainEntry
 * @property {string} subdomain - Full subdomain (e.g. mbasic.facebook.com)
 * @property {string} category - Category (mobile, developer, business, etc.)
 * @property {string} purpose - Purpose description
 * @property {string} osintUseCase - OSINT use case
 * @property {string[]} recommendedMethods - Recommended methods
 */

/** @type {Record<string, SubdomainEntry>} */
const SUBDOMAINS = {
  // --- SINGLE-CHAR PREFIXES (a-z) ---
  a: {
    subdomain: 'a.facebook.com',
    category: 'infrastructure',
    purpose: 'Alpha/CDN edge node',
    osintUseCase: 'Infrastructure mapping, CDN fingerprinting',
    recommendedMethods: ['dns', 'cert-transparency'],
  },
  b: {
    subdomain: 'b.facebook.com',
    category: 'infrastructure',
    purpose: 'Beta/CDN edge node',
    osintUseCase: 'Infrastructure mapping',
    recommendedMethods: ['dns', 'http-probe'],
  },
  c: {
    subdomain: 'c.facebook.com',
    category: 'infrastructure',
    purpose: 'CDN/static asset node',
    osintUseCase: 'Asset discovery, CDN mapping',
    recommendedMethods: ['dns', 'cert-transparency'],
  },
  d: {
    subdomain: 'd.facebook.com',
    category: 'infrastructure',
    purpose: 'Data/delivery node',
    osintUseCase: 'Infrastructure enumeration',
    recommendedMethods: ['dns'],
  },
  e: {
    subdomain: 'e.facebook.com',
    category: 'infrastructure',
    purpose: 'Edge node',
    osintUseCase: 'Edge server discovery',
    recommendedMethods: ['dns'],
  },
  f: {
    subdomain: 'f.facebook.com',
    category: 'infrastructure',
    purpose: 'Facebook core node',
    osintUseCase: 'Core infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  g: {
    subdomain: 'g.facebook.com',
    category: 'infrastructure',
    purpose: 'Graph/API edge',
    osintUseCase: 'API endpoint discovery',
    recommendedMethods: ['dns', 'graph-api'],
  },
  h: {
    subdomain: 'h.facebook.com',
    category: 'infrastructure',
    purpose: 'Hosting node',
    osintUseCase: 'Infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  i: {
    subdomain: 'i.facebook.com',
    category: 'infrastructure',
    purpose: 'Internal/imaging node',
    osintUseCase: 'Image CDN discovery',
    recommendedMethods: ['dns'],
  },
  j: {
    subdomain: 'j.facebook.com',
    category: 'infrastructure',
    purpose: 'Job/queue node',
    osintUseCase: 'Infrastructure enumeration',
    recommendedMethods: ['dns'],
  },
  k: {
    subdomain: 'k.facebook.com',
    category: 'infrastructure',
    purpose: 'Key/value node',
    osintUseCase: 'Infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  l: {
    subdomain: 'l.facebook.com',
    category: 'link-tracking',
    purpose: 'Link Shim redirect / referral tracer',
    osintUseCase: 'Link analysis, referral tracing, click tracking',
    recommendedMethods: ['url-decode', 'referrer-analysis', 'redirect-chain'],
  },
  m: {
    subdomain: 'm.facebook.com',
    category: 'mobile',
    purpose: 'Mobile full site',
    osintUseCase: 'Profile discovery, mobile-optimized viewing',
    recommendedMethods: ['profile-lookup', 'graph-search-workaround'],
  },
  n: {
    subdomain: 'n.facebook.com',
    category: 'infrastructure',
    purpose: 'Notification node',
    osintUseCase: 'Infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  o: {
    subdomain: 'o.facebook.com',
    category: 'infrastructure',
    purpose: 'Origin node',
    osintUseCase: 'Origin server discovery',
    recommendedMethods: ['dns'],
  },
  p: {
    subdomain: 'p.facebook.com',
    category: 'product',
    purpose: 'Pages/product node',
    osintUseCase: 'Page discovery, product mapping',
    recommendedMethods: ['pages-api', 'profile-lookup'],
  },
  q: {
    subdomain: 'q.facebook.com',
    category: 'infrastructure',
    purpose: 'Query node',
    osintUseCase: 'Query endpoint discovery',
    recommendedMethods: ['dns'],
  },
  r: {
    subdomain: 'r.facebook.com',
    category: 'infrastructure',
    purpose: 'Relay/real-time node',
    osintUseCase: 'Real-time API discovery',
    recommendedMethods: ['dns'],
  },
  s: {
    subdomain: 's.facebook.com',
    category: 'infrastructure',
    purpose: 'Static asset server',
    osintUseCase: 'Static asset discovery, CDN mapping',
    recommendedMethods: ['dns', 'http-probe'],
  },
  t: {
    subdomain: 't.facebook.com',
    category: 'link-tracking',
    purpose: 'Link tracking / click tracker',
    osintUseCase: 'Link analysis, click tracking, redirect chains',
    recommendedMethods: ['url-decode', 'redirect-chain', 'referrer-analysis'],
  },
  u: {
    subdomain: 'u.facebook.com',
    category: 'infrastructure',
    purpose: 'Upload node',
    osintUseCase: 'Upload endpoint discovery',
    recommendedMethods: ['dns'],
  },
  v: {
    subdomain: 'v.facebook.com',
    category: 'infrastructure',
    purpose: 'Video node',
    osintUseCase: 'Video CDN discovery',
    recommendedMethods: ['dns'],
  },
  w: {
    subdomain: 'w.facebook.com',
    category: 'infrastructure',
    purpose: 'Web node',
    osintUseCase: 'Web infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  x: {
    subdomain: 'x.facebook.com',
    category: 'infrastructure',
    purpose: 'Experimental node',
    osintUseCase: 'Experimental feature discovery',
    recommendedMethods: ['dns'],
  },
  y: {
    subdomain: 'y.facebook.com',
    category: 'infrastructure',
    purpose: 'Yield/analytics node',
    osintUseCase: 'Analytics endpoint discovery',
    recommendedMethods: ['dns'],
  },
  z: {
    subdomain: 'z.facebook.com',
    category: 'infrastructure',
    purpose: 'Zone node',
    osintUseCase: 'Zone/CDN mapping',
    recommendedMethods: ['dns'],
  },

  // --- TWO-LETTER PREFIXES ---
  aa: {
    subdomain: 'aa.facebook.com',
    category: 'infrastructure',
    purpose: 'Akamai alpha-alpha edge',
    osintUseCase: 'CDN edge enumeration',
    recommendedMethods: ['dns', 'cert-transparency'],
  },
  ab: {
    subdomain: 'ab.facebook.com',
    category: 'infrastructure',
    purpose: 'Akamai alpha-beta edge',
    osintUseCase: 'CDN mapping',
    recommendedMethods: ['dns'],
  },
  ac: {
    subdomain: 'ac.facebook.com',
    category: 'infrastructure',
    purpose: 'Akamai edge node',
    osintUseCase: 'Infrastructure enumeration',
    recommendedMethods: ['dns'],
  },
  ad: {
    subdomain: 'ad.facebook.com',
    category: 'business',
    purpose: 'Ads delivery/tracking',
    osintUseCase: 'Ad tracking, advertiser discovery',
    recommendedMethods: ['ads-library', 'transparency'],
  },
  api: {
    subdomain: 'api.facebook.com',
    category: 'developer',
    purpose: 'Legacy API endpoint',
    osintUseCase: 'API discovery, endpoint enumeration',
    recommendedMethods: ['graph-api', 'api-explorer'],
  },
  apps: {
    subdomain: 'apps.facebook.com',
    category: 'product',
    purpose: 'Facebook apps platform',
    osintUseCase: 'App discovery, canvas app enumeration',
    recommendedMethods: ['profile-lookup', 'graph-api'],
  },
  ar: {
    subdomain: 'ar.facebook.com',
    category: 'locale',
    purpose: 'Arabic locale',
    osintUseCase: 'Locale-specific content, regional search',
    recommendedMethods: ['locale-search', 'profile-lookup'],
  },
  auth: {
    subdomain: 'auth.facebook.com',
    category: 'auth',
    purpose: 'Authentication service',
    osintUseCase: 'Auth flow analysis, OAuth discovery',
    recommendedMethods: ['oauth-flow', 'cert-transparency'],
  },
  beta: {
    subdomain: 'beta.facebook.com',
    category: 'product',
    purpose: 'Beta features/testing',
    osintUseCase: 'Beta feature discovery, pre-release enumeration',
    recommendedMethods: ['http-probe', 'feature-discovery'],
  },
  biz: {
    subdomain: 'biz.facebook.com',
    category: 'business',
    purpose: 'Business tools (legacy)',
    osintUseCase: 'Business page discovery',
    recommendedMethods: ['business-intel', 'pages-api'],
  },
  business: {
    subdomain: 'business.facebook.com',
    category: 'business',
    purpose: 'Meta for Business / Ads Manager',
    osintUseCase: 'Business intel, ads library, page transparency',
    recommendedMethods: ['ads-library', 'transparency', 'pages-api'],
  },
  connect: {
    subdomain: 'connect.facebook.com',
    category: 'developer',
    purpose: 'Facebook Connect / OAuth',
    osintUseCase: 'OAuth flow, third-party integration discovery',
    recommendedMethods: ['oauth-flow', 'graph-api'],
  },
  developers: {
    subdomain: 'developers.facebook.com',
    category: 'developer',
    purpose: 'Developer platform & Graph API Explorer',
    osintUseCase: 'API intel, Graph API testing, ThreatExchange',
    recommendedMethods: ['graph-api', 'api-explorer', 'threat-exchange'],
  },
  graph: {
    subdomain: 'graph.facebook.com',
    category: 'developer',
    purpose: 'Graph API endpoint',
    osintUseCase: 'Structured data queries, API discovery',
    recommendedMethods: ['graph-api', 'api-explorer'],
  },
  lm: {
    subdomain: 'lm.facebook.com',
    category: 'link-tracking',
    purpose: 'Link Shim (mobile)',
    osintUseCase: 'Mobile link referral tracing',
    recommendedMethods: ['url-decode', 'referrer-analysis', 'redirect-chain'],
  },
  login: {
    subdomain: 'login.facebook.com',
    category: 'auth',
    purpose: 'Login service',
    osintUseCase: 'Auth endpoint discovery, login flow analysis',
    recommendedMethods: ['oauth-flow', 'cert-transparency'],
  },
  mbasic: {
    subdomain: 'mbasic.facebook.com',
    category: 'mobile',
    purpose: 'Mobile basic (lightweight) version',
    osintUseCase: 'Profile discovery, unauthenticated viewing, graph search workaround',
    recommendedMethods: ['profile-lookup', 'graph-search-workaround', 'page-source-extraction'],
  },
  mobile: {
    subdomain: 'mobile.facebook.com',
    category: 'mobile',
    purpose: 'Mobile interface (legacy)',
    osintUseCase: 'Mobile profile discovery',
    recommendedMethods: ['profile-lookup'],
  },
  mtouch: {
    subdomain: 'mtouch.facebook.com',
    category: 'mobile',
    purpose: 'Mobile touch interface',
    osintUseCase: 'Profile discovery, graph search workaround (photos-tagged, people)',
    recommendedMethods: ['graph-search-workaround', 'profile-lookup'],
  },
  pages: {
    subdomain: 'pages.facebook.com',
    category: 'product',
    purpose: 'Facebook Pages',
    osintUseCase: 'Page discovery, page transparency',
    recommendedMethods: ['pages-api', 'transparency', 'profile-lookup'],
  },
  touch: {
    subdomain: 'touch.facebook.com',
    category: 'mobile',
    purpose: 'Touch-optimized interface',
    osintUseCase: 'Profile discovery, older mobile devices',
    recommendedMethods: ['profile-lookup'],
  },
  transparency: {
    subdomain: 'transparency.fb.com',
    category: 'business',
    purpose: 'Transparency Center / Ad Library',
    osintUseCase: 'Ad transparency, political ads, content library',
    recommendedMethods: ['ads-library', 'transparency', 'ad-library-api'],
  },
  www: {
    subdomain: 'www.facebook.com',
    category: 'product',
    purpose: 'Standard desktop site',
    osintUseCase: 'Profile discovery, business intel, general research',
    recommendedMethods: ['profile-lookup', 'pages-api', 'business-intel'],
  },
  web: {
    subdomain: 'web.facebook.com',
    category: 'product',
    purpose: 'Web interface variant',
    osintUseCase: 'Alternative web access',
    recommendedMethods: ['profile-lookup'],
  },
  ads: {
    subdomain: 'ads.facebook.com',
    category: 'business',
    purpose: 'Ads Manager / Ad creation',
    osintUseCase: 'Advertiser research, ad campaign discovery',
    recommendedMethods: ['ads-library', 'transparency'],
  },
  about: {
    subdomain: 'about.facebook.com',
    category: 'corporate',
    purpose: 'Meta corporate/about',
    osintUseCase: 'Corporate info, press, policies',
    recommendedMethods: ['http-probe'],
  },
  corporate: {
    subdomain: 'corporate.fb.com',
    category: 'corporate',
    purpose: 'Corporate site',
    osintUseCase: 'Corporate structure, investor info',
    recommendedMethods: ['http-probe'],
  },
  groups: {
    subdomain: 'groups.facebook.com',
    category: 'product',
    purpose: 'Facebook Groups',
    osintUseCase: 'Group discovery, membership research',
    recommendedMethods: ['profile-lookup', 'graph-api'],
  },
  events: {
    subdomain: 'events.facebook.com',
    category: 'product',
    purpose: 'Facebook Events',
    osintUseCase: 'Event discovery, attendee research',
    recommendedMethods: ['profile-lookup', 'graph-api'],
  },
  marketplace: {
    subdomain: 'www.facebook.com/marketplace',
    category: 'product',
    purpose: 'Facebook Marketplace',
    osintUseCase: 'Listing discovery, seller research',
    recommendedMethods: ['profile-lookup'],
  },
  secure: {
    subdomain: 'secure.facebook.com',
    category: 'auth',
    purpose: 'Secure login/session',
    osintUseCase: 'Auth flow analysis',
    recommendedMethods: ['oauth-flow'],
  },
  static: {
    subdomain: 'static.ak.facebook.com',
    category: 'infrastructure',
    purpose: 'Static assets (Akamai)',
    osintUseCase: 'Asset discovery, CDN mapping',
    recommendedMethods: ['dns', 'http-probe'],
  },
  '0-edge-chat': {
    subdomain: '0-edge-chat.facebook.com',
    category: 'infrastructure',
    purpose: 'Chat edge server 0',
    osintUseCase: 'Chat infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  '1-edge-chat': {
    subdomain: '1-edge-chat.facebook.com',
    category: 'infrastructure',
    purpose: 'Chat edge server 1',
    osintUseCase: 'Chat infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  '2-edge-chat': {
    subdomain: '2-edge-chat.facebook.com',
    category: 'infrastructure',
    purpose: 'Chat edge server 2',
    osintUseCase: 'Chat infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  '3-edge-chat': {
    subdomain: '3-edge-chat.facebook.com',
    category: 'infrastructure',
    purpose: 'Chat edge server 3',
    osintUseCase: 'Chat infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  '4-edge-chat': {
    subdomain: '4-edge-chat.facebook.com',
    category: 'infrastructure',
    purpose: 'Chat edge server 4',
    osintUseCase: 'Chat infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  '5-edge-chat': {
    subdomain: '5-edge-chat.facebook.com',
    category: 'infrastructure',
    purpose: 'Chat edge server 5',
    osintUseCase: 'Chat infrastructure mapping',
    recommendedMethods: ['dns'],
  },
  '6-edge-chat': {
    subdomain: '6-edge-chat.facebook.com',
    category: 'infrastructure',
    purpose: 'Chat edge server 6',
    osintUseCase: 'Chat infrastructure mapping',
    recommendedMethods: ['dns'],
  },

  // --- FB.COM VARIANTS ---
  fb: {
    subdomain: 'fb.com',
    category: 'short-domain',
    purpose: 'Short domain redirect',
    osintUseCase: 'Link analysis, redirect chain tracing',
    recommendedMethods: ['redirect-chain', 'url-decode'],
  },
  fbme: {
    subdomain: 'fb.me',
    category: 'short-domain',
    purpose: 'Short link domain',
    osintUseCase: 'Short link resolution, destination URL discovery',
    recommendedMethods: ['redirect-chain', 'url-decode'],
  },
  'www-fb': {
    subdomain: 'www.fb.com',
    category: 'short-domain',
    purpose: 'fb.com www variant',
    osintUseCase: 'Redirect chain analysis',
    recommendedMethods: ['redirect-chain'],
  },

  // --- ADDITIONAL TWO-LETTER / COMMON ---
  zh: {
    subdomain: 'zh-cn.facebook.com',
    category: 'locale',
    purpose: 'Chinese (Simplified) locale',
    osintUseCase: 'Chinese content, regional search',
    recommendedMethods: ['locale-search', 'profile-lookup'],
  },
  'zh-tw': {
    subdomain: 'zh-tw.facebook.com',
    category: 'locale',
    purpose: 'Chinese (Traditional) locale',
    osintUseCase: 'Traditional Chinese content',
    recommendedMethods: ['locale-search'],
  },
  'ar-ar': {
    subdomain: 'ar-ar.facebook.com',
    category: 'locale',
    purpose: 'Arabic locale',
    osintUseCase: 'Arabic content, MENA region search',
    recommendedMethods: ['locale-search'],
  },
  'es-la': {
    subdomain: 'es-la.facebook.com',
    category: 'locale',
    purpose: 'Spanish (Latin America) locale',
    osintUseCase: 'Latin American content',
    recommendedMethods: ['locale-search'],
  },
  'pt-br': {
    subdomain: 'pt-br.facebook.com',
    category: 'locale',
    purpose: 'Portuguese (Brazil) locale',
    osintUseCase: 'Brazilian content',
    recommendedMethods: ['locale-search'],
  },
  'fr-fr': {
    subdomain: 'fr-fr.facebook.com',
    category: 'locale',
    purpose: 'French locale',
    osintUseCase: 'French content',
    recommendedMethods: ['locale-search'],
  },
  'de-de': {
    subdomain: 'de-de.facebook.com',
    category: 'locale',
    purpose: 'German locale',
    osintUseCase: 'German content',
    recommendedMethods: ['locale-search'],
  },
  'ja-jp': {
    subdomain: 'ja-jp.facebook.com',
    category: 'locale',
    purpose: 'Japanese locale',
    osintUseCase: 'Japanese content',
    recommendedMethods: ['locale-search'],
  },
  'ko-kr': {
    subdomain: 'ko-kr.facebook.com',
    category: 'locale',
    purpose: 'Korean locale',
    osintUseCase: 'Korean content',
    recommendedMethods: ['locale-search'],
  },
  'ru-ru': {
    subdomain: 'ru-ru.facebook.com',
    category: 'locale',
    purpose: 'Russian locale',
    osintUseCase: 'Russian content',
    recommendedMethods: ['locale-search'],
  },
  'hi-in': {
    subdomain: 'hi-in.facebook.com',
    category: 'locale',
    purpose: 'Hindi locale',
    osintUseCase: 'Indian content',
    recommendedMethods: ['locale-search'],
  },
  'en-gb': {
    subdomain: 'en-gb.facebook.com',
    category: 'locale',
    purpose: 'English (UK) locale',
    osintUseCase: 'UK content',
    recommendedMethods: ['locale-search'],
  },
  'en-us': {
    subdomain: 'en-us.facebook.com',
    category: 'locale',
    purpose: 'English (US) locale',
    osintUseCase: 'US content',
    recommendedMethods: ['locale-search'],
  },
  'it-it': {
    subdomain: 'it-it.facebook.com',
    category: 'locale',
    purpose: 'Italian locale',
    osintUseCase: 'Italian content',
    recommendedMethods: ['locale-search'],
  },
  'tr-tr': {
    subdomain: 'tr-tr.facebook.com',
    category: 'locale',
    purpose: 'Turkish locale',
    osintUseCase: 'Turkish content',
    recommendedMethods: ['locale-search'],
  },
  'id-id': {
    subdomain: 'id-id.facebook.com',
    category: 'locale',
    purpose: 'Indonesian locale',
    osintUseCase: 'Indonesian content',
    recommendedMethods: ['locale-search'],
  },
  'th-th': {
    subdomain: 'th-th.facebook.com',
    category: 'locale',
    purpose: 'Thai locale',
    osintUseCase: 'Thai content',
    recommendedMethods: ['locale-search'],
  },
  'vi-vn': {
    subdomain: 'vi-vn.facebook.com',
    category: 'locale',
    purpose: 'Vietnamese locale',
    osintUseCase: 'Vietnamese content',
    recommendedMethods: ['locale-search'],
  },
};

// =============================================================================
// METHOD COMBINATIONS
// Named combinations of subdomains/methods for specific OSINT goals
// =============================================================================

/**
 * @typedef {Object} MethodCombination
 * @property {string} name - Display name
 * @property {string[]} subdomains - Subdomain IDs in combination
 * @property {string[]} methods - Method names
 * @property {string} description - Description
 * @property {string} useCase - Use case
 * @property {string[]} steps - Step-by-step instructions
 */

/** @type {Record<string, MethodCombination>} */
const METHOD_COMBINATIONS = {
  'profile-discovery': {
    name: 'Profile Discovery',
    subdomains: ['mbasic', 'graph', 'pages'],
    methods: ['mbasic', 'graph-api', 'pages-api'],
    description: 'Enumerate profiles via mobile basic, Graph API, and Pages lookup',
    useCase: 'Finding person profiles, usernames, userIDs',
    steps: [
      'Start with mbasic.facebook.com for unauthenticated viewing',
      'Use graph.facebook.com for structured data (requires token)',
      'Check pages.facebook.com for page vs profile distinction',
    ],
  },
  'link-tracking': {
    name: 'Link Tracking',
    subdomains: ['l', 'lm', 't'],
    methods: ['l', 'lm', 't'],
    description: 'Trace link referrals through Link Shim and click tracking',
    useCase: 'Analyzing referral traffic, redirect chains, click attribution',
    steps: [
      'Identify l.facebook.com or lm.facebook.com in referral data',
      'Decode l.php?u= parameter for destination URL',
      'Trace t.facebook.com for click tracking endpoints',
    ],
  },
  'business-intel': {
    name: 'Business Intel',
    subdomains: ['ads', 'business', 'transparency'],
    methods: ['ads', 'business', 'transparency'],
    description: 'Research advertisers, pages, and ad transparency',
    useCase: 'Advertiser research, page transparency, ad library search',
    steps: [
      'Search business.facebook.com/ads/library',
      'Check Page transparency for admin locations',
      'Use transparency.fb.com for political/social issue ads',
    ],
  },
  'api-discovery': {
    name: 'API Discovery',
    subdomains: ['developers', 'graph', 'api'],
    methods: ['developers', 'graph', 'api'],
    description: 'Discover and test Graph API endpoints',
    useCase: 'API schema exploration, endpoint enumeration',
    steps: [
      'Use developers.facebook.com/tools/explorer',
      'Query graph.facebook.com with access token',
      'Check api.facebook.com for legacy endpoints',
    ],
  },
  'locale-search': {
    name: 'Locale-Based Search',
    subdomains: ['zh-cn', 'ar-ar', 'en-gb'],
    methods: ['locale-search'],
    description: 'Search by language/region via locale subdomains',
    useCase: 'Regional content, language-specific profiles',
    steps: [
      'Use {locale}.facebook.com (e.g., zh-cn.facebook.com)',
      'Combine with mbasic: zh-cn.mbasic.facebook.com',
      'Try m.{locale}.facebook.com for mobile locale',
    ],
  },
  'unauthenticated-profile': {
    name: 'Unauthenticated Profile View',
    subdomains: ['mbasic', 'mtouch', 'm'],
    methods: ['mbasic', 'mtouch', 'm'],
    description: 'View profiles without login via mobile interfaces',
    useCase: 'Bypassing login walls for public content',
    steps: [
      'Try mbasic.facebook.com/username first',
      'Fallback to mtouch.facebook.com',
      'Use m.facebook.com for full mobile view',
    ],
  },
  'graph-search-workaround': {
    name: 'Graph Search Workaround',
    subdomains: ['mtouch', 'mbasic'],
    methods: ['mtouch', 'mbasic'],
    description: 'Access graph search via mtouch paths',
    useCase: 'Photos-tagged, people search, graph search alternatives',
    steps: [
      'Use mtouch.facebook.com/graphsearch/USERID/photos-tagged',
      'Try mbasic for people search workarounds',
      'Extract userID from page source if needed',
    ],
  },
  'short-link-resolution': {
    name: 'Short Link Resolution',
    subdomains: ['fb', 'fbme', 'l', 'lm'],
    methods: ['fb', 'fbme', 'l', 'lm'],
    description: 'Resolve fb.me and fb.com short links',
    useCase: 'Tracing short links to destination URLs',
    steps: [
      'Follow fb.me redirect chain',
      'Check l.facebook.com/l.php?u= for Link Shim',
      'Trace lm.facebook.com for mobile referrals',
    ],
  },
  'infrastructure-enumeration': {
    name: 'Infrastructure Enumeration',
    subdomains: ['a', 'b', 'c', 's', 'static', '0-edge-chat'],
    methods: ['dns', 'cert-transparency', 'http-probe'],
    description: 'Map Facebook CDN and edge infrastructure',
    useCase: 'Bug bounty, infrastructure recon',
    steps: [
      'Use subdomain enumeration (single-char, two-letter)',
      'Check Certificate Transparency logs',
      'Probe with HTTP/HTTPS for response fingerprinting',
    ],
  },
};

// =============================================================================
// OSINT WORKFLOWS
// Step-by-step workflows for common OSINT tasks
// =============================================================================

/**
 * @typedef {Object} WorkflowStep
 * @property {number} step - Step number
 * @property {string} action - Action description
 * @property {string|null} subdomain - Subdomain ID or null
 */

/**
 * @typedef {Object} OSINTWorkflow
 * @property {string} id - Workflow ID
 * @property {string} name - Display name
 * @property {string} description - Description
 * @property {string[]} subdomains - Subdomain IDs used
 * @property {WorkflowStep[]} steps - Workflow steps
 * @property {string} methodCombination - Related method combination ID
 */

/** @type {Record<string, OSINTWorkflow>} */
const OSINT_WORKFLOWS = {
  profile_enumeration: {
    id: 'profile_enumeration',
    name: 'Profile Enumeration',
    description: 'Discover and enumerate Facebook profiles from minimal identifiers',
    subdomains: ['mbasic', 'mtouch', 'm', 'www', 'pages', 'graph'],
    steps: [
      {
        step: 1,
        action: 'Start with mbasic.facebook.com for unauthenticated viewing',
        subdomain: 'mbasic',
      },
      {
        step: 2,
        action: 'If blocked, try mtouch.facebook.com with /graphsearch/ paths',
        subdomain: 'mtouch',
      },
      {
        step: 3,
        action: 'Extract numeric userID from page source (search for "userID" or "pageID")',
        subdomain: null,
      },
      {
        step: 4,
        action: 'Use mtouch.facebook.com/graphsearch/USERID/photos-tagged for tagged photos',
        subdomain: 'mtouch',
      },
      {
        step: 5,
        action: 'Cross-reference with pages.facebook.com to distinguish page vs profile',
        subdomain: 'pages',
      },
      {
        step: 6,
        action: 'Query graph.facebook.com for structured data (requires access token)',
        subdomain: 'graph',
      },
    ],
    methodCombination: 'profile-discovery',
  },

  link_analysis: {
    id: 'link_analysis',
    name: 'Link Analysis',
    description: 'Trace links, referrals, and redirect chains through Facebook',
    subdomains: ['l', 'lm', 't', 'fb', 'fbme'],
    steps: [
      {
        step: 1,
        action: 'Identify l.facebook.com or lm.facebook.com in referral/analytics data',
        subdomain: 'l',
      },
      {
        step: 2,
        action: 'Decode l.php?u= parameter to extract destination URL',
        subdomain: 'l',
      },
      {
        step: 3,
        action: 'Trace t.facebook.com for click tracking endpoints',
        subdomain: 't',
      },
      {
        step: 4,
        action: 'Follow fb.me and fb.com short link redirect chains',
        subdomain: 'fb',
      },
      {
        step: 5,
        action: 'Document full redirect chain for attribution analysis',
        subdomain: null,
      },
    ],
    methodCombination: 'link-tracking',
  },

  business_research: {
    id: 'business_research',
    name: 'Business Research',
    description: 'Research businesses, advertisers, and page transparency',
    subdomains: ['business', 'ads', 'transparency', 'www', 'pages'],
    steps: [
      {
        step: 1,
        action: 'Go to business.facebook.com/ads/library',
        subdomain: 'business',
      },
      {
        step: 2,
        action: 'Search by advertiser name, keyword, or page',
        subdomain: 'business',
      },
      {
        step: 3,
        action: 'Check Page transparency for admin locations and history',
        subdomain: 'business',
      },
      {
        step: 4,
        action: 'Use transparency.fb.com for political/social issue ads',
        subdomain: 'transparency',
      },
      {
        step: 5,
        action: 'Cross-reference with www for public page content',
        subdomain: 'www',
      },
    ],
    methodCombination: 'business-intel',
  },

  api_discovery: {
    id: 'api_discovery',
    name: 'API Discovery',
    description: 'Discover and explore Facebook Graph API endpoints',
    subdomains: ['developers', 'graph', 'api'],
    steps: [
      {
        step: 1,
        action: 'Use developers.facebook.com/tools/explorer',
        subdomain: 'developers',
      },
      {
        step: 2,
        action: 'Obtain access token for your use case',
        subdomain: 'developers',
      },
      {
        step: 3,
        action: 'Query graph.facebook.com/v{version}/endpoint',
        subdomain: 'graph',
      },
      {
        step: 4,
        action: 'Explore schema via Graph API documentation',
        subdomain: 'developers',
      },
      {
        step: 5,
        action: 'Check ThreatExchange at developers.facebook.com for threat intel',
        subdomain: 'developers',
      },
    ],
    methodCombination: 'api-discovery',
  },

  locale_based_search: {
    id: 'locale_based_search',
    name: 'Locale-Based Search',
    description: 'Search Facebook content by language and region',
    subdomains: ['zh-cn', 'ar-ar', 'en-gb', 'mbasic', 'm'],
    steps: [
      {
        step: 1,
        action: 'Use {locale}.facebook.com (e.g., zh-cn.facebook.com)',
        subdomain: 'zh-cn',
      },
      {
        step: 2,
        action: 'Try mbasic for locale-specific unauthenticated view',
        subdomain: 'mbasic',
      },
      {
        step: 3,
        action: 'Combine: zh-cn.mbasic.facebook.com for Chinese mbasic',
        subdomain: null,
      },
      {
        step: 4,
        action: 'Use m.{locale}.facebook.com for mobile locale',
        subdomain: 'm',
      },
      {
        step: 5,
        action: 'Check locale-specific search results and content visibility',
        subdomain: null,
      },
    ],
    methodCombination: 'locale-search',
  },
};

// =============================================================================
// LOCALE PREFIXES (for locale-specific subdomain generation)
// =============================================================================

/** @type {Array<{code: string, name: string}>} */
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
  { code: 'en-us', name: 'English (US)' },
  { code: 'it-it', name: 'Italian' },
  { code: 'tr-tr', name: 'Turkish' },
  { code: 'id-id', name: 'Indonesian' },
  { code: 'th-th', name: 'Thai' },
  { code: 'vi-vn', name: 'Vietnamese' },
];

// =============================================================================
// CATEGORY INDEX (subdomains grouped by category)
// =============================================================================

/** @type {Record<string, string[]>} */
const SUBDOMAINS_BY_CATEGORY = (() => {
  const byCat = {};
  for (const [id, entry] of Object.entries(SUBDOMAINS)) {
    const cat = entry.category;
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(id);
  }
  return byCat;
})();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all subdomains.
 * @returns {Record<string, SubdomainEntry>}
 */
function getAllSubdomains() {
  return { ...SUBDOMAINS };
}

/**
 * Get subdomains by category.
 * @param {string} category
 * @returns {string[]}
 */
function getSubdomainsByCategory(category) {
  return SUBDOMAINS_BY_CATEGORY[category] ?? [];
}

/**
 * Get subdomain entry by ID.
 * @param {string} id
 * @returns {SubdomainEntry | undefined}
 */
function getSubdomain(id) {
  return SUBDOMAINS[id];
}

/**
 * Get method combination by ID.
 * @param {string} id
 * @returns {MethodCombination | undefined}
 */
function getMethodCombination(id) {
  return METHOD_COMBINATIONS[id];
}

/**
 * Get OSINT workflow by ID.
 * @param {string} id
 * @returns {OSINTWorkflow | undefined}
 */
function getWorkflow(id) {
  return OSINT_WORKFLOWS[id];
}

/**
 * Get all method combinations.
 * @returns {Record<string, MethodCombination>}
 */
function getAllMethodCombinations() {
  return { ...METHOD_COMBINATIONS };
}

/**
 * Get all OSINT workflows.
 * @returns {Record<string, OSINTWorkflow>}
 */
function getAllWorkflows() {
  return { ...OSINT_WORKFLOWS };
}

/**
 * Build full URL for a subdomain + path.
 * @param {string} subdomainId - Subdomain id (e.g. 'mbasic', 'l')
 * @param {string} path - Path to append
 * @returns {string}
 */
function buildSubdomainUrl(subdomainId, path = '') {
  const entry = SUBDOMAINS[subdomainId];
  if (!entry) return '';
  const domain = entry.subdomain;
  const base = domain.startsWith('http') ? domain : `https://${domain}`;
  const p = path && !path.startsWith('/') ? `/${path}` : path || '';
  return base + p;
}

/**
 * Generate single-char subdomain list (a-z).
 * @returns {string[]}
 */
function getSingleCharSubdomains() {
  return 'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => `${c}.facebook.com`);
}

/**
 * Generate two-letter subdomain list (aa, ab, ... zz).
 * @returns {string[]}
 */
function getTwoLetterSubdomains() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const result = [];
  for (const a of chars) {
    for (const b of chars) {
      result.push(`${a}${b}.facebook.com`);
    }
  }
  return result;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  SUBDOMAINS,
  METHOD_COMBINATIONS,
  OSINT_WORKFLOWS,
  LOCALE_PREFIXES,
  SUBDOMAINS_BY_CATEGORY,
  getAllSubdomains,
  getSubdomainsByCategory,
  getSubdomain,
  getMethodCombination,
  getWorkflow,
  getAllMethodCombinations,
  getAllWorkflows,
  buildSubdomainUrl,
  getSingleCharSubdomains,
  getTwoLetterSubdomains,
};

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUBDOMAINS,
    METHOD_COMBINATIONS,
    OSINT_WORKFLOWS,
    LOCALE_PREFIXES,
    SUBDOMAINS_BY_CATEGORY,
    getAllSubdomains,
    getSubdomainsByCategory,
    getSubdomain,
    getMethodCombination,
    getWorkflow,
    getAllMethodCombinations,
    getAllWorkflows,
    buildSubdomainUrl,
    getSingleCharSubdomains,
    getTwoLetterSubdomains,
  };
}
