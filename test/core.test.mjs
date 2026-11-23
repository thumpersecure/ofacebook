import test from 'node:test';
import assert from 'node:assert/strict';

import {
  escapeHtml,
  isSafeHttpUrl,
  sanitizeForUrl,
  sanitizePath,
  extractTargetPath,
  buildSafeHostUrl,
  escapeCsvCell,
} from '../src/utils/security.js';
import { safeStr, debounce } from '../src/utils/lang.js';
import { getPrefixIndex, resolvePrefixHost } from '../src/domain/prefixes.js';
import { getMethodCombinations, getMethodById } from '../src/domain/methods.js';
import {
  getProvider,
  setProvider,
  getOpenAIKey,
  setOpenAIKey,
  hasOpenAIKey,
  getAnthropicKey,
  setAnthropicKey,
  hasAnthropicKey,
  clearLocalSettings,
} from '../src/app/settings.js';
import { getPresets, addPreset, removePreset } from '../src/app/presets.js';
import { createAssistant } from '../src/assistant/assistant.js';
import { detectIntent, buildUrl as osintBuildUrl } from '../src/osint-assistant.js';
import { THUMPERSECURE_PREFIXES, buildUrl as libraryBuildUrl } from '../src/prefix-library.js';
import { SUBDOMAINS, METHOD_COMBINATIONS as DATA_METHODS } from '../src/data.js';

test('escapeHtml escapes all 5 HTML special characters including quotes (prevents attribute XSS)', () => {
  assert.equal(escapeHtml('<script>"alert(\'x\')" & </script>'), '&lt;script&gt;&quot;alert(&#39;x&#39;)&quot; &amp; &lt;/script&gt;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(123), '');
});

test('sanitizeForUrl / sanitizePath supports Unicode and strips path traversal', () => {
  assert.equal(sanitizeForUrl('@zuck'), 'zuck');
  assert.equal(sanitizePath('///groups//my-group/'), 'groups/my-group');
  assert.equal(sanitizeForUrl('../../etc/passwd'), 'etc/passwd');
  assert.equal(sanitizeForUrl('münchen.user'), 'münchen.user');
  assert.equal(sanitizeForUrl('   !!!   '), '');
});

test('extractTargetPath parses handles, full Facebook URLs, profile.php?id, and Link Shim URLs', () => {
  const plain = extractTargetPath('@zuck');
  assert.equal(plain.fullPath, 'zuck');
  assert.equal(plain.wasUrl, false);

  const fbUrl = extractTargetPath('https://www.facebook.com/zuck?fbclid=IwAR123&utm_source=test');
  assert.equal(fbUrl.wasUrl, true);
  assert.equal(fbUrl.fullPath, 'zuck');

  const profileId = extractTargetPath('https://m.facebook.com/profile.php?id=4&fbclid=xyz');
  assert.equal(profileId.wasUrl, true);
  assert.equal(profileId.fullPath, 'profile.php?id=4');

  const shim = extractTargetPath('https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2Fpath%3Fa%3D1&h=AT0');
  assert.equal(shim.linkShimDest, 'https://example.com/path?a=1');

  const evilShim = extractTargetPath('https://l.facebook.com/l.php?u=javascript%3Aalert(1)');
  assert.equal(evilShim.linkShimDest, null);
});

test('isSafeHttpUrl and buildSafeHostUrl reject unsafe schemes', () => {
  assert.equal(isSafeHttpUrl('https://www.facebook.com/zuck'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<script>'), false);

  assert.equal(buildSafeHostUrl('mbasic.facebook.com', 'zuck'), 'https://mbasic.facebook.com/zuck');
  assert.equal(buildSafeHostUrl('mbasic.facebook.com', '/profile.php?id=4'), 'https://mbasic.facebook.com/profile.php?id=4');
  assert.equal(buildSafeHostUrl('javascript:alert(1)', 'x'), '');
  assert.equal(libraryBuildUrl('javascript:alert(1)', 'x'), '');
  assert.equal(osintBuildUrl('javascript:alert(1)', 'x'), '');
});

test('escapeCsvCell mitigates Excel CSV formula injection', () => {
  assert.equal(escapeCsvCell('=CMD()'), `"'=CMD()"`);
  assert.equal(escapeCsvCell('+1+1'), `"'+1+1"`);
  assert.equal(escapeCsvCell('-2+3'), `"'-2+3"`);
  assert.equal(escapeCsvCell('@SUM(A1)'), `"'@SUM(A1)"`);
  assert.equal(escapeCsvCell('hello "world"'), `"hello ""world"""`);
});

test('safeStr handles null/undefined and debounce supports cancel/flush', async () => {
  assert.equal(safeStr(null), '');
  assert.equal(safeStr(undefined), '');
  assert.equal(safeStr('abcdef', 3), 'abc');

  let calls = 0;
  const fn = debounce(() => { calls += 1; }, 50);
  fn();
  fn.cancel();
  await new Promise((r) => setTimeout(r, 70));
  assert.equal(calls, 0);

  fn();
  fn.flush();
  assert.equal(calls, 1);
});

test('prefix index and methods have zero duplicates and resolve all method prefixes', () => {
  const seen = new Set();
  for (const p of THUMPERSECURE_PREFIXES) {
    assert.equal(seen.has(p.subdomain), false, `Duplicate prefix: ${p.subdomain}`);
    seen.add(p.subdomain);
  }

  const idx1 = getPrefixIndex();
  const idx2 = getPrefixIndex();
  assert.equal(idx1, idx2, 'getPrefixIndex should be memoized');
  assert.ok(idx1.all.length >= 110);
  assert.ok(Array.isArray(idx1.categories) && idx1.categories.length > 0);
  assert.equal(resolvePrefixHost(idx1, 'mtouch'), 'mtouch.facebook.com');
  assert.equal(resolvePrefixHost(idx1, 'fb.com'), 'fb.com');
  assert.equal(resolvePrefixHost(idx1, 'fb.me'), 'fb.me');

  const methods = getMethodCombinations();
  assert.ok(methods.length >= 10);
  for (const m of methods) {
    assert.equal(getMethodById(m.id)?.id, m.id);
    for (const p of m.prefixes) {
      assert.ok(resolvePrefixHost(idx1, p), `Unresolved prefix ${p} in method ${m.id}`);
    }
  }

  // Verify data.js zh-cn fix
  assert.ok(SUBDOMAINS['zh-cn']);
  assert.ok(DATA_METHODS['locale-search'] || DATA_METHODS.locale_based_search);
});

test('settings and presets work safely when localStorage is unavailable', () => {
  clearLocalSettings();
  assert.equal(getProvider(), 'local');
  setProvider('openai');
  assert.equal(getProvider(), 'openai');
  setOpenAIKey('sk-test-key');
  assert.equal(hasOpenAIKey(), true);
  assert.equal(getOpenAIKey(), 'sk-test-key');
  setAnthropicKey('sk-ant-test');
  assert.equal(hasAnthropicKey(), true);
  assert.equal(getAnthropicKey(), 'sk-ant-test');
  clearLocalSettings();
  assert.equal(getProvider(), 'local');
  assert.equal(hasOpenAIKey(), false);

  const bad = addPreset({ name: 'Empty', target: '   ', goalId: 'profile-discovery' });
  assert.equal(bad.ok, false);

  const added = addPreset({ name: 'Test Target', target: 'https://www.facebook.com/zuck', goalId: 'profile-discovery' });
  assert.equal(added.ok, true);
  assert.equal(added.preset.target, 'zuck');
  assert.ok(getPresets().some((p) => p.id === added.preset.id));

  const removed = removePreset(added.preset.id);
  assert.equal(removed.ok, true);
  assert.equal(removed.removed, true);
});

test('assistant word-boundary intent matching, slash commands, and Link Shim security', async () => {
  // Word-boundary check in osint-assistant.js
  assert.notEqual(detectIntent('mark zuckerberg'), 'locale_search');
  assert.notEqual(detectIntent('barcelona page'), 'locale_search');
  assert.notEqual(detectIntent('capital group'), 'api_intel');

  const assistant = createAssistant();
  // Word-boundary check in assistant.js: "capital" should NOT trigger api-discovery
  const capRes = await assistant.respond('capital');
  assert.ok(!capRes.text.includes('API & Developer Discovery'));

  // Slash command autoAction
  const goalRes = await assistant.respond('/goal link-tracking');
  assert.equal(goalRes.autoAction?.type, 'setGoal');
  assert.equal(goalRes.autoAction?.payload?.goalId, 'link-tracking');

  // Link Shim decoding
  const shimRes = await assistant.respond('https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.org%2Fdemo');
  assert.ok(shimRes.text.includes('https://example.org/demo'));
  assert.ok(shimRes.actions.some((a) => a.type === 'copy' && a.payload === 'https://example.org/demo'));

  // Unsafe Link Shim javascript: blocked
  const badShimRes = await assistant.respond('https://l.facebook.com/l.php?u=javascript%3Aalert(1)');
  assert.ok(!badShimRes.actions.some((a) => a.payload === 'javascript:alert(1)'));

  // Pasted Facebook profile URL offers runSearch
  const fbRes = await assistant.respond('https://www.facebook.com/zuck?fbclid=123');
  assert.ok(fbRes.actions.some((a) => a.type === 'runSearch' && a.payload === 'zuck'));
});
