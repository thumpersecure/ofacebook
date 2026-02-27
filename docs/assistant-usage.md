# OSINT Assistant API Usage

The assistant logic is exposed as JavaScript functions callable from the main app.

## Quick Start

```javascript
import {
  getRecommendation,
  getMethodsByGoal,
  getWorkflow,
  buildUrl,
} from './src/index.js';

// From user query
const rec = getRecommendation('find profile');
console.log(rec.primaryPrefixes);   // [{ id: 'mbasic', domain: '...', ... }]
console.log(rec.workflow);          // Step-by-step instructions
console.log(rec.contextualTips);    // ["Try mbasic for unauthenticated..."]

// From selected prefix
const rec2 = getRecommendation('l');  // Link analysis intent

// By explicit goal
const methods = getMethodsByGoal('link_analysis');

// Build URL
const url = buildUrl('mbasic', '/username');  // https://mbasic.facebook.com/username
```

## Functions

| Function | Input | Output |
|----------|-------|--------|
| `detectIntent(query)` | User query or prefix id | Intent key or null |
| `getRecommendation(query)` | User query or prefix | Full recommendation object |
| `getMethodsByGoal(goal)` | Goal key | Methods, workflow, tips |
| `getAllPrefixes()` | — | All prefix definitions |
| `getContextualTips(intentOrPrefix)` | Intent or prefix id | Array of tip strings |
| `buildUrl(prefixId, path)` | Prefix id, optional path | Full URL string |
| `getWorkflow(query)` | User query | Workflow steps + tips |

## Intent Keys

- `profile_discovery` — Find/lookup profiles
- `link_analysis` — Track links, trace referrals
- `business_intel` — Business/ad research
- `api_intel` — Graph API, developer tools
- `locale_search` — Language/region-specific

## Recommendation Object Shape

```javascript
{
  intent: 'profile_discovery',
  query: 'find profile',
  primaryPrefixes: [{ id, domain, description, useCases, tips }],
  alternativePrefixes: [...],
  workflow: ['Step 1...', 'Step 2...'],
  contextualTips: ['Tip 1', 'Tip 2'],
  alternativeApproaches: [{ method, when }],
  localePrefixes: null  // or array when intent is locale_search
}
```
