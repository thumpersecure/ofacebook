# Assistant usage

There are **two assistant layers** in this repo:

1. **Rule-based assistant API** (`src/osint-assistant.js`, re-exported by `src/index.js`) — stable, deterministic recommendation functions.
2. **In-app assistant engine** (`src/assistant/assistant.js`) — powers the chat UI, supports multi-turn context and optional provider adapters.

## In-app assistant engine (recommended)

```javascript
import { createAssistant } from '../src/assistant/assistant.js';

const assistant = createAssistant();

const res = await assistant.respond('track link referrals', {
  lastTarget: 'someuser',
  lastResults: [{ host: 'mbasic.facebook.com', url: 'https://mbasic.facebook.com/someuser', category: 'mobile' }],
});

console.log(res.text);      // human-readable workflow
console.log(res.actions);   // [{ type, label, payload }, ...]
```

### Action objects

The UI renders `actions` as buttons. Action types currently used:

- `copy` (payload: string)
- `open` (payload: url string)
- `runSearch` (payload: target path string)
- `exportCsv` (payload: object, unused)
- `openModal` (payload: `{ modal: 'settings' | 'methods', ... }`)

## Rule-based assistant API (legacy / library)

See `src/osint-assistant.js` and `src/index.js` for:

- `getRecommendation(query)`
- `getMethodsByGoal(goal)`
- `getWorkflow(query)`
- `buildUrl(prefixId, path)`

These functions are useful if you want to build alternate UIs or integrations without the chat layer.
