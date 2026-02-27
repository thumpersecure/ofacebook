/**
 * Facebook OSINT Prefix Library
 * Based on thumpersecure/thumpersecure facebook-prefix-list.md
 * https://github.com/thumpersecure/thumpersecure/blob/main/facebook-prefix-list.md
 *
 * Comprehensive library of Facebook subdomain prefixes with OSINT use cases,
 * method combinations, and workflow recommendations.
 */

// =============================================================================
// THUMPERSECURE PREFIX DATA - Exact subdomains from source
// =============================================================================

/** @type {Array<{subdomain: string, status: string, purpose: string, category: string}>} */
const THUMPERSECURE_PREFIXES = [
  // Single-Character (Active)
  { subdomain: '0.facebook.com', status: 'active', purpose: 'Zero-data / free basics mobile access', category: 'mobile' },
  { subdomain: 'c.facebook.com', status: 'active', purpose: 'Content/CDN', category: 'infrastructure' },
  { subdomain: 'd.facebook.com', status: 'active', purpose: 'Desktop-optimized mobile version', category: 'mobile' },
  { subdomain: 'h.facebook.com', status: 'active', purpose: 'Touch/HTML5 mobile (Android browsers)', category: 'mobile' },
  { subdomain: 'l.facebook.com', status: 'active', purpose: 'Link shim (outbound link safety checker)', category: 'link-tracking' },
  { subdomain: 'm.facebook.com', status: 'active', purpose: 'Mobile site (primary mobile subdomain)', category: 'mobile' },
  { subdomain: 'n.facebook.com', status: 'active', purpose: 'Notifications / internal', category: 'infrastructure' },
  { subdomain: 'o.facebook.com', status: 'active', purpose: 'Optimized / alternative mobile', category: 'mobile' },
  { subdomain: 'p.facebook.com', status: 'active', purpose: 'Internal / platform', category: 'infrastructure' },
  { subdomain: 't.facebook.com', status: 'active', purpose: 'Tracking / shortened URLs', category: 'link-tracking' },
  { subdomain: 'w.facebook.com', status: 'active', purpose: 'Web / alternative access', category: 'web' },
  { subdomain: 'x.facebook.com', status: 'active', purpose: 'Experimental / internal', category: 'infrastructure' },
  { subdomain: 'z.facebook.com', status: 'active', purpose: 'Internal / zero-rated', category: 'infrastructure' },
  // Two-Letter
  { subdomain: 'lm.facebook.com', status: 'active', purpose: 'Link shim on mobile browser', category: 'link-tracking' },
  { subdomain: 'tm.facebook.com', status: 'active', purpose: 'Internal / tracking mobile', category: 'link-tracking' },
  { subdomain: 'hs.facebook.com', status: 'active', purpose: 'Help / support system', category: 'support' },
  { subdomain: 'ww.facebook.com', status: 'active', purpose: 'Alternate www (common typo catch)', category: 'web' },
  { subdomain: 'ai.facebook.com', status: 'active', purpose: 'AI / research portal', category: 'corporate' },
  // Mobile & Alternative Access
  { subdomain: 'mbasic.facebook.com', status: 'active', purpose: 'Ultra-lightweight text-only mobile', category: 'mobile' },
  { subdomain: 'mobile.facebook.com', status: 'active', purpose: 'Mobile redirect', category: 'mobile' },
  { subdomain: 'touch.facebook.com', status: 'active', purpose: 'Touch-optimized mobile', category: 'mobile' },
  { subdomain: 'iphone.facebook.com', status: 'active', purpose: 'iPhone-specific mobile', category: 'mobile' },
  { subdomain: 'lite.facebook.com', status: 'active', purpose: 'Facebook Lite web version', category: 'mobile' },
  { subdomain: 'free.facebook.com', status: 'active', purpose: 'Free basics / zero-rated access', category: 'mobile' },
  { subdomain: 'zero.facebook.com', status: 'active', purpose: 'Zero-data mobile access', category: 'mobile' },
  { subdomain: 'web.facebook.com', status: 'active', purpose: 'Alternative web access', category: 'web' },
  // Developer & API
  { subdomain: 'api.facebook.com', status: 'active', purpose: 'API endpoint', category: 'developer' },
  { subdomain: 'graph.facebook.com', status: 'active', purpose: 'Graph API', category: 'developer' },
  { subdomain: 'developers.facebook.com', status: 'active', purpose: 'Developer portal', category: 'developer' },
  { subdomain: 'apps.facebook.com', status: 'active', purpose: 'App platform', category: 'developer' },
  { subdomain: 'code.facebook.com', status: 'active', purpose: 'Engineering / code resources', category: 'developer' },
  { subdomain: 'connect.facebook.com', status: 'active', purpose: 'Facebook Connect / OAuth', category: 'developer' },
  { subdomain: 'pixel.facebook.com', status: 'active', purpose: 'Tracking pixel', category: 'developer' },
  { subdomain: 'static.facebook.com', status: 'active', purpose: 'Static assets', category: 'infrastructure' },
  { subdomain: 'upload.facebook.com', status: 'active', purpose: 'File upload endpoint', category: 'infrastructure' },
  // Auth & Account
  { subdomain: 'login.facebook.com', status: 'active', purpose: 'Login portal', category: 'auth' },
  { subdomain: 'secure.facebook.com', status: 'active', purpose: 'Secure/HTTPS login', category: 'auth' },
  { subdomain: 'register.facebook.com', status: 'active', purpose: 'Registration', category: 'auth' },
  // Business & Advertising
  { subdomain: 'ads.facebook.com', status: 'active', purpose: 'Advertising platform', category: 'business' },
  { subdomain: 'business.facebook.com', status: 'active', purpose: 'Business suite', category: 'business' },
  { subdomain: 'pay.facebook.com', status: 'active', purpose: 'Facebook Pay', category: 'business' },
  { subdomain: 'shop.facebook.com', status: 'active', purpose: 'Facebook Shops', category: 'business' },
  // Product & Feature
  { subdomain: 'gaming.facebook.com', status: 'active', purpose: 'Facebook Gaming', category: 'product' },
  { subdomain: 'watch.facebook.com', status: 'active', purpose: 'Facebook Watch video', category: 'product' },
  { subdomain: 'pages.facebook.com', status: 'active', purpose: 'Facebook Pages', category: 'product' },
  { subdomain: 'work.facebook.com', status: 'active', purpose: 'Workplace by Facebook', category: 'product' },
  { subdomain: 'workplace.facebook.com', status: 'active', purpose: 'Workplace platform', category: 'product' },
  { subdomain: 'portal.facebook.com', status: 'active', purpose: 'Portal device support', category: 'product' },
  // Corporate & Info
  { subdomain: 'about.facebook.com', status: 'active', purpose: 'About Facebook / company info', category: 'corporate' },
  { subdomain: 'blog.facebook.com', status: 'active', purpose: 'Official blog', category: 'corporate' },
  { subdomain: 'research.facebook.com', status: 'active', purpose: 'Research publications', category: 'corporate' },
  { subdomain: 'transparency.facebook.com', status: 'active', purpose: 'Transparency reports', category: 'corporate' },
  { subdomain: 'postmaster.facebook.com', status: 'active', purpose: 'Email deliverability tools', category: 'corporate' },
  // Infrastructure & DNS
  { subdomain: 'dns.facebook.com', status: 'active', purpose: 'DNS infrastructure', category: 'infrastructure' },
  { subdomain: 'intern.facebook.com', status: 'active', purpose: 'Internal tools', category: 'infrastructure' },
  { subdomain: 'v4help.facebook.com', status: 'active', purpose: 'IPv4 help/support', category: 'infrastructure' },
  // WWW Variants
  { subdomain: 'www.facebook.com', status: 'active', purpose: 'Primary website', category: 'web' },
  { subdomain: 'www2.facebook.com', status: 'active', purpose: 'Secondary/load-balanced', category: 'web' },
  { subdomain: 'wwww.facebook.com', status: 'active', purpose: 'Typo catch', category: 'web' },
  // Beta & Testing
  { subdomain: 'beta.facebook.com', status: 'active', purpose: 'Beta testing', category: 'product' },
  { subdomain: 'new.facebook.com', status: 'active', purpose: 'New features / redesign', category: 'product' },
  { subdomain: 'error.facebook.com', status: 'active', purpose: 'Error pages', category: 'product' },
  { subdomain: 'badge.facebook.com', status: 'active', purpose: 'Badge/verification system', category: 'product' },
  // fb.com
  { subdomain: 'www.fb.com', status: 'active', purpose: 'Short domain redirect', category: 'short-domain' },
  { subdomain: 's.fb.com', status: 'active', purpose: 'Short URLs', category: 'short-domain' },
  { subdomain: 'investor.fb.com', status: 'active', purpose: 'Investor relations', category: 'corporate' },
  { subdomain: 'newsroom.fb.com', status: 'active', purpose: 'Press / newsroom', category: 'corporate' },
  { subdomain: 'search.fb.com', status: 'active', purpose: 'Search', category: 'short-domain' },
  { subdomain: 'vsp.fb.com', status: 'active', purpose: 'Internal service', category: 'infrastructure' },
  // Language/Locale
  { subdomain: 'ar-ar.facebook.com', status: 'active', purpose: 'Arabic', category: 'locale' },
  { subdomain: 'bg-bg.facebook.com', status: 'active', purpose: 'Bulgarian', category: 'locale' },
  { subdomain: 'bs-ba.facebook.com', status: 'active', purpose: 'Bosnian', category: 'locale' },
  { subdomain: 'cs-cz.facebook.com', status: 'active', purpose: 'Czech', category: 'locale' },
  { subdomain: 'da-dk.facebook.com', status: 'active', purpose: 'Danish', category: 'locale' },
  { subdomain: 'de-de.facebook.com', status: 'active', purpose: 'German', category: 'locale' },
  { subdomain: 'el-gr.facebook.com', status: 'active', purpose: 'Greek', category: 'locale' },
  { subdomain: 'en-gb.facebook.com', status: 'active', purpose: 'English (UK)', category: 'locale' },
  { subdomain: 'es-es.facebook.com', status: 'active', purpose: 'Spanish (Spain)', category: 'locale' },
  { subdomain: 'es-la.facebook.com', status: 'active', purpose: 'Spanish (Latin America)', category: 'locale' },
  { subdomain: 'et-ee.facebook.com', status: 'active', purpose: 'Estonian', category: 'locale' },
  { subdomain: 'fa-ir.facebook.com', status: 'active', purpose: 'Persian', category: 'locale' },
  { subdomain: 'fi-fi.facebook.com', status: 'active', purpose: 'Finnish', category: 'locale' },
  { subdomain: 'fr-ca.facebook.com', status: 'active', purpose: 'French (Canada)', category: 'locale' },
  { subdomain: 'fr-fr.facebook.com', status: 'active', purpose: 'French (France)', category: 'locale' },
  { subdomain: 'he-il.facebook.com', status: 'active', purpose: 'Hebrew', category: 'locale' },
  { subdomain: 'hr-hr.facebook.com', status: 'active', purpose: 'Croatian', category: 'locale' },
  { subdomain: 'hu-hu.facebook.com', status: 'active', purpose: 'Hungarian', category: 'locale' },
  { subdomain: 'id-id.facebook.com', status: 'active', purpose: 'Indonesian', category: 'locale' },
  { subdomain: 'it-it.facebook.com', status: 'active', purpose: 'Italian', category: 'locale' },
  { subdomain: 'ja-jp.facebook.com', status: 'active', purpose: 'Japanese', category: 'locale' },
  { subdomain: 'ko-kr.facebook.com', status: 'active', purpose: 'Korean', category: 'locale' },
  { subdomain: 'mk-mk.facebook.com', status: 'active', purpose: 'Macedonian', category: 'locale' },
  { subdomain: 'ms-my.facebook.com', status: 'active', purpose: 'Malay', category: 'locale' },
  { subdomain: 'nb-no.facebook.com', status: 'active', purpose: 'Norwegian', category: 'locale' },
  { subdomain: 'nl-nl.facebook.com', status: 'active', purpose: 'Dutch', category: 'locale' },
  { subdomain: 'pl-pl.facebook.com', status: 'active', purpose: 'Polish', category: 'locale' },
  { subdomain: 'pt-br.facebook.com', status: 'active', purpose: 'Portuguese (Brazil)', category: 'locale' },
  { subdomain: 'pt-pt.facebook.com', status: 'active', purpose: 'Portuguese (Portugal)', category: 'locale' },
  { subdomain: 'ro-ro.facebook.com', status: 'active', purpose: 'Romanian', category: 'locale' },
  { subdomain: 'ru-ru.facebook.com', status: 'active', purpose: 'Russian', category: 'locale' },
  { subdomain: 'sk-sk.facebook.com', status: 'active', purpose: 'Slovak', category: 'locale' },
  { subdomain: 'sr-rs.facebook.com', status: 'active', purpose: 'Serbian', category: 'locale' },
  { subdomain: 'sv-se.facebook.com', status: 'active', purpose: 'Swedish', category: 'locale' },
  { subdomain: 'th-th.facebook.com', status: 'active', purpose: 'Thai', category: 'locale' },
  { subdomain: 'tl-ph.facebook.com', status: 'active', purpose: 'Filipino', category: 'locale' },
  { subdomain: 'tr-tr.facebook.com', status: 'active', purpose: 'Turkish', category: 'locale' },
  { subdomain: 'vi-vn.facebook.com', status: 'active', purpose: 'Vietnamese', category: 'locale' },
  { subdomain: 'zh-cn.facebook.com', status: 'active', purpose: 'Chinese (Simplified)', category: 'locale' },
  { subdomain: 'zh-hk.facebook.com', status: 'active', purpose: 'Chinese (Hong Kong)', category: 'locale' },
  { subdomain: 'zh-tw.facebook.com', status: 'active', purpose: 'Chinese (Taiwan)', category: 'locale' },
];

// =============================================================================
// METHOD COMBINATIONS - Prefix combinations for specific OSINT goals
// =============================================================================

/** @type {Array<{id: string, name: string, prefixes: string[], description: string, osintUse: string, steps: string[]}>} */
const METHOD_COMBINATIONS = [
  {
    id: 'profile-discovery',
    name: 'Profile Discovery',
    prefixes: ['mbasic', 'm', 'touch', 'www'],
    description: 'Find profiles without login',
    osintUse: 'Person lookup, username resolution, unauthenticated viewing',
    steps: [
      'Start with mbasic.facebook.com/username for text-only view',
      'Try m.facebook.com for full mobile if mbasic blocks',
      'Use touch.facebook.com for older device compatibility',
      'Extract userID from page source for API use',
    ],
  },
  {
    id: 'link-tracking',
    name: 'Link Tracking & Referral Analysis',
    prefixes: ['l', 'lm', 't'],
    description: 'Trace link referrals and redirect chains',
    osintUse: 'Analytics attribution, click tracking, referral source analysis',
    steps: [
      'Identify l.facebook.com or lm.facebook.com in referral data',
      'Decode l.php?u= parameter for destination URL',
      'Trace t.facebook.com for click tracking endpoints',
      'Document full redirect chain for attribution',
    ],
  },
  {
    id: 'business-intel',
    name: 'Business Intelligence',
    prefixes: ['business', 'ads', 'transparency'],
    description: 'Advertiser and page research',
    osintUse: 'Ad library search, page transparency, political ads',
    steps: [
      'Search business.facebook.com/ads/library',
      'Check Page transparency for admin locations',
      'Use transparency.facebook.com for reports',
      'Cross-reference with ads.facebook.com',
    ],
  },
  {
    id: 'api-discovery',
    name: 'API & Developer Discovery',
    prefixes: ['developers', 'graph', 'api'],
    description: 'Graph API and endpoint exploration',
    osintUse: 'Structured data queries, ThreatExchange, API schema',
    steps: [
      'Use developers.facebook.com/tools/explorer',
      'Query graph.facebook.com with access token',
      'Check api.facebook.com for legacy endpoints',
      'Explore ThreatExchange for threat intel',
    ],
  },
  {
    id: 'locale-search',
    name: 'Locale-Based Search',
    prefixes: ['zh-cn', 'ar-ar', 'en-gb', 'pt-br'],
    description: 'Regional and language-specific content',
    osintUse: 'Regional profiles, localized content, language targeting',
    steps: [
      'Use {locale}.facebook.com (e.g., zh-cn.facebook.com)',
      'Combine with mbasic: mbasic.facebook.com with locale cookie',
      'Try zero.facebook.com for low-bandwidth regions',
      'Check free.facebook.com for Free Basics regions',
    ],
  },
  {
    id: 'short-link-resolution',
    name: 'Short Link Resolution',
    prefixes: ['www.fb.com', 's.fb.com', 'l', 'lm'],
    description: 'Resolve fb.com and Link Shim URLs',
    osintUse: 'Short link destination discovery, redirect chain tracing',
    steps: [
      'Follow fb.com redirect chain with curl -L',
      'Decode l.facebook.com/l.php?u= for Link Shim',
      'Check s.fb.com for short URL resolution',
      'Trace lm.facebook.com for mobile referrals',
    ],
  },
  {
    id: 'infrastructure-enum',
    name: 'Infrastructure Enumeration',
    prefixes: ['c', 'd', 'static', 'upload', 'dns'],
    description: 'CDN and infrastructure mapping',
    osintUse: 'Bug bounty, infrastructure recon, asset discovery',
    steps: [
      'Enumerate single-char subdomains (0,c,d,h,l,m,n,o,p,t,w,x,z)',
      'Check Certificate Transparency logs',
      'Probe static.facebook.com, upload.facebook.com',
      'Map dns.facebook.com and v4help.facebook.com',
    ],
  },
  {
    id: 'mobile-variants',
    name: 'Mobile Variant Testing',
    prefixes: ['mbasic', 'm', 'lite', 'zero', 'free', 'touch', 'iphone'],
    description: 'Test different mobile interfaces',
    osintUse: 'Content visibility differences, login bypass attempts',
    steps: [
      'mbasic = text-only, often shows more without login',
      'lite = Facebook Lite web',
      'zero/free = Free Basics regions',
      'touch/iphone = device-specific interfaces',
    ],
  },
  {
    id: 'corporate-intel',
    name: 'Corporate Intelligence',
    prefixes: ['about', 'blog', 'research', 'transparency', 'investor.fb.com'],
    description: 'Meta corporate and transparency data',
    osintUse: 'Company research, policy analysis, transparency reports',
    steps: [
      'about.facebook.com for company info',
      'blog.facebook.com for announcements',
      'research.facebook.com for publications',
      'investor.fb.com for financial data',
    ],
  },
  {
    id: 'auth-flow-analysis',
    name: 'Auth Flow Analysis',
    prefixes: ['login', 'secure', 'connect'],
    description: 'Authentication endpoint discovery',
    osintUse: 'OAuth flow analysis, login redirect chains',
    steps: [
      'login.facebook.com - main login',
      'secure.facebook.com - HTTPS login',
      'connect.facebook.com - OAuth/Connect',
    ],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getAllPrefixes() {
  return [...THUMPERSECURE_PREFIXES];
}

function getPrefixesByCategory(category) {
  return THUMPERSECURE_PREFIXES.filter((p) => p.category === category);
}

function getCategories() {
  return [...new Set(THUMPERSECURE_PREFIXES.map((p) => p.category))];
}

function buildUrl(subdomain, path = '') {
  const domain = subdomain.startsWith('http') ? subdomain : `https://${subdomain}`;
  const p = path && !path.startsWith('/') ? `/${path}` : path || '';
  return domain + p;
}

function getMethodCombination(id) {
  return METHOD_COMBINATIONS.find((m) => m.id === id);
}

function getAllMethodCombinations() {
  return [...METHOD_COMBINATIONS];
}

function searchPrefixes(query) {
  const q = (query || '').toLowerCase();
  return THUMPERSECURE_PREFIXES.filter(
    (p) =>
      p.subdomain.toLowerCase().includes(q) ||
      p.purpose.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );
}

export {
  THUMPERSECURE_PREFIXES,
  METHOD_COMBINATIONS,
  getAllPrefixes,
  getPrefixesByCategory,
  getCategories,
  buildUrl,
  getMethodCombination,
  getAllMethodCombinations,
  searchPrefixes,
};
