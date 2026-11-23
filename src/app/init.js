import { createToasts } from '../ui/toast.js';
import { createModal } from '../ui/modal.js';
import { createCommandPalette } from '../ui/command-palette.js';
import { initTheme, toggleTheme, getTheme } from '../ui/theme.js';
import { $, $$, on } from '../utils/dom.js';
import { debounce, safeStr } from '../utils/lang.js';
import {
  escapeHtml,
  extractTargetPath,
  isSafeHttpUrl,
  buildSafeHostUrl,
  escapeCsvCell,
} from '../utils/security.js';
import { createAssistant } from '../assistant/assistant.js';
import {
  getProvider,
  setProvider,
  setOpenAIKey,
  setAnthropicKey,
  hasOpenAIKey,
  hasAnthropicKey,
  clearLocalSettings,
  isStorageAvailable,
} from './settings.js';
import { getPrefixIndex, resolvePrefixHost } from '../domain/prefixes.js';
import { getMethodCombinations, getMethodById } from '../domain/methods.js';
import { getPresets, addPreset, removePreset } from './presets.js';

const MAX_INPUT_LEN = 500;
const MAX_CHAT_MESSAGES = 80;
const MAX_CHAT_HISTORY_ENTRIES = 12; // 6 user/assistant turns
const MAX_RESULTS = 14;
const MAX_RECENT_TARGETS = 6;
const RECENT_STORAGE_KEY = 'osint.recent.v1';
const DEBOUNCE_MS = 150;

function isTypingContext(target) {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  const editable = target.closest('[contenteditable]');
  return Boolean(editable && editable.getAttribute('contenteditable') !== 'false');
}

function renderMarkdownLite(text) {
  // CSP-friendly, tiny: bold + inline code + newlines.
  const t = escapeHtml(String(text ?? ''));
  return t
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function toCsv(rows) {
  return '\uFEFF' + rows.map((r) => r.map((cell) => escapeCsvCell(cell)).join(',')).join('\r\n');
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatTargetPath(fullPath) {
  if (!fullPath) return '';
  return fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
}

function loadRecentTargets() {
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .slice(0, MAX_RECENT_TARGETS);
  } catch {
    return [];
  }
}

function saveRecentTarget(target) {
  const clean = String(target || '').trim().slice(0, MAX_INPUT_LEN);
  if (!clean) return loadRecentTargets();
  const prev = loadRecentTargets();
  const next = [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    MAX_RECENT_TARGETS
  );
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage persistence errors
  }
  return next;
}

function fallbackCopy(str) {
  const ta = document.createElement('textarea');
  ta.value = str;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

export function initApp() {
  try {
    initTheme();

    const toasts = createToasts();
    const modal = createModal();
    const assistant = createAssistant();

    const prefixIndex = getPrefixIndex();
    const methods = getMethodCombinations();

    const statPrefixes = $('#stat-prefixes');
    const statMethods = $('#stat-methods');
    const cmdPaletteBtn = $('#cmd-palette-btn');
    const themeToggle = $('#theme-toggle');
    const settingsBtn = $('#settings-btn');
    const navEl = $('.nav');
    const navBtns = $$('.nav__btn');
    const panels = $$('.main-panel');

    const searchInput = $('#search-input');
    const searchClearBtn = $('#search-clear-btn');
    const searchSubmit = $('.search-box__submit');
    const copyBtn = $('#url-copy-btn');
    const urlOutput = $('#url-output');
    const recentTargetsEl = $('#recent-targets');

    const resultsGrid = $('#results-grid');
    const resultsTitle = $('.results__title');
    const resultsCount = $('#results-count');
    const activeGoalLabel = $('#active-goal');
    const savePresetBtn = $('#save-preset-btn');
    const copyAllBtn = $('#copy-all-btn');
    const exportCsvBtn = $('#export-csv-btn');
    const bulkOpenBtn = $('#bulk-open-btn');

    const libraryCount = $('#library-count');
    const libraryFilter = $('#library-filter');
    const libraryCategories = $('#library-categories');
    const prefixList = $('#prefix-list');
    const comboList = $('#combo-list');

    const chatPanel = $('#chat-panel');
    const chatToggle = $('.chat-panel__toggle');
    const chatBody = $('#chat-body');
    const chatMessages = $('#chat-messages');
    const chatInput = $('#chat-input');
    const chatSend = $('.chat-panel__send');
    const modalBody = $('#modal-body');

    /**
     * @type {{
     *   goalId: string,
     *   lastTarget: string,
     *   lastResults: Array<{host: string, url: string, category: string, purpose: string}>,
     *   chatHistory: Array<{role: string, content: string}>,
     *   activePanel: number,
     * }}
     */
    const state = {
      goalId: 'profile-discovery',
      lastTarget: '',
      lastResults: [],
      chatHistory: [],
      activePanel: 0,
    };

    let libraryRendered = false;
    let methodsRendered = false;
    let activeCategory = 'all';
    let librarySearchQuery = '';
    let chatPending = false;
    /** @type {string[]} */
    let pendingBulkUrls = [];
    let pendingPresetTarget = '';

    /** @type {WeakMap<Element, any>} */
    const chatActionMap = new WeakMap();

    async function copyText(text, successMsg = 'Copied') {
      const str = String(text ?? '');
      if (!str) {
        toasts.show('Nothing to copy', 'warning');
        return false;
      }
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(str);
          toasts.show(successMsg, 'success');
          return true;
        }
      } catch {
        // Fall through to execCommand fallback
      }
      if (fallbackCopy(str)) {
        toasts.show(successMsg, 'success');
        return true;
      }
      toasts.show('Copy failed — please copy manually.', 'error');
      return false;
    }

    function getCurrentTargetPath() {
      const raw = searchInput?.value?.trim() || state.lastTarget || '';
      if (!raw) return '';
      const parsed = extractTargetPath(raw, MAX_INPUT_LEN);
      return parsed?.fullPath ? formatTargetPath(parsed.fullPath) : '';
    }

    function setGoal(goalId) {
      const m = getMethodById(goalId);
      state.goalId = m ? goalId : 'profile-discovery';
      $$('.method-chip').forEach((c) => {
        const isActive = c.getAttribute('data-goal') === state.goalId;
        c.classList.toggle('method-chip--active', isActive);
        c.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      if (activeGoalLabel) {
        const method = getMethodById(state.goalId) || methods[0];
        activeGoalLabel.textContent = method?.name || 'Profile Discovery';
      }
    }

    function updateUrlPreview() {
      if (!searchInput) return;
      const raw = searchInput.value || '';
      if (searchClearBtn) {
        searchClearBtn.hidden = raw.length === 0;
      }
      if (!urlOutput) return;

      const goal = getMethodById(state.goalId) || methods[0];
      const primaryHost =
        (goal?.prefixes?.[0] && resolvePrefixHost(prefixIndex, goal.prefixes[0])) ||
        'www.facebook.com';
      const parsed = extractTargetPath(raw, MAX_INPUT_LEN);
      const path = parsed?.fullPath ? formatTargetPath(parsed.fullPath) : '';
      urlOutput.textContent = buildSafeHostUrl(primaryHost, path);
    }

    function renderRecentTargets(list = loadRecentTargets()) {
      if (!recentTargetsEl) return;
      if (!list.length) {
        recentTargetsEl.innerHTML = '';
        recentTargetsEl.hidden = true;
        return;
      }
      recentTargetsEl.hidden = false;
      recentTargetsEl.innerHTML =
        `<span class="recent-targets__label">Recent</span>` +
        list
          .map(
            (t) =>
              `<button type="button" class="recent-chip" data-recent-target="${escapeHtml(t)}">${escapeHtml(safeStr(t, 42))}</button>`
          )
          .join('');
    }

    function switchPanel(idx) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= panels.length) return;
      state.activePanel = idx;

      navBtns.forEach((b, i) => {
        const panelIdx = Number(b.getAttribute('data-panel') ?? i);
        const isActive = panelIdx === idx;
        b.classList.toggle('nav__btn--active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        b.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      panels.forEach((p, i) => {
        const panelIdx = Number(p.getAttribute('data-panel') ?? i);
        const isActive = panelIdx === idx;
        p.classList.toggle('main-panel--active', isActive);
        p.hidden = !isActive;
      });

      if (idx === 1 && !libraryRendered) {
        renderPrefixLibrary();
      }
      if (idx === 2 && !methodsRendered) {
        renderComboLibrary();
      }
    }

    function addAssistantMessage(role, text, actions = []) {
      if (!chatMessages) return null;
      const div = document.createElement('div');
      div.className = `chat-message chat-message--${role === 'user' ? 'user' : 'assistant'}`;
      const label = role === 'user' ? 'You' : 'Assistant';
      const trimmedActions = Array.isArray(actions) ? actions.slice(0, 4) : [];
      const actionsHtml = trimmedActions.length
        ? `<div class="chat-message__actions">${trimmedActions
            .map(
              (a, i) =>
                `<button type="button" class="chat-message__action" data-action-idx="${i}">${escapeHtml(a.label || 'Action')}</button>`
            )
            .join('')}</div>`
        : '';
      div.innerHTML = `
        <span class="chat-message__role">${escapeHtml(label)}</span>
        <p class="chat-message__text">${renderMarkdownLite(safeStr(text, 6000))}</p>
        ${actionsHtml}
      `;

      if (trimmedActions.length) {
        div.querySelectorAll('.chat-message__action').forEach((btn, i) => {
          if (trimmedActions[i]) chatActionMap.set(btn, trimmedActions[i]);
        });
      }

      chatMessages.appendChild(div);
      while (chatMessages.children.length > MAX_CHAT_MESSAGES) {
        chatMessages.removeChild(chatMessages.children[0]);
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return div;
    }

    function renderPresetListHtml(presets) {
      if (!presets.length) {
        return '<p class="modal__subtitle">No presets saved yet.</p>';
      }
      return presets
        .map((p) => {
          const method = getMethodById(p.goalId);
          const goalLabel = method?.name || p.goalId;
          return `
            <div class="preset-row" data-preset-id="${escapeHtml(p.id)}">
              <div class="preset-row__info">
                <strong class="preset-row__name">${escapeHtml(p.name)}</strong>
                <span class="preset-row__meta"><code>${escapeHtml(p.target)}</code> · ${escapeHtml(goalLabel)}</span>
              </div>
              <div class="preset-row__actions">
                <button type="button" class="btn btn--primary" data-preset-apply="${escapeHtml(p.id)}">Apply</button>
                <button type="button" class="btn btn--danger" data-preset-remove="${escapeHtml(p.id)}">Delete</button>
              </div>
            </div>
          `;
        })
        .join('');
    }

    function openSettingsModal() {
      const presets = getPresets();
      const provider = getProvider();
      const openAiSaved = hasOpenAIKey();
      const anthropicSaved = hasAnthropicKey();
      const storageOk = typeof isStorageAvailable === 'function' ? isStorageAvailable() : true;

      const storageWarning = storageOk
        ? ''
        : '<p class="modal__warning" role="status">Browser storage is unavailable. Settings and presets will not persist after reload.</p>';

      modal.open(`
        <h2 class="modal__title">Settings</h2>
        <p class="modal__subtitle">Everything runs locally in your browser (static app). No accounts, no tracking.</p>
        ${storageWarning}

        <form id="settings-form" class="modal__section">
          <h3>Assistant provider</h3>
          <p class="modal__subtitle">Optional BYO API key. Keys are stored in <code>localStorage</code> in your browser.</p>
          <div class="modal__field">
            <label for="provider-select">Provider</label>
            <select id="provider-select">
              <option value="local" ${provider === 'local' ? 'selected' : ''}>Local (offline)</option>
              <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI (BYO key)</option>
              <option value="anthropic" ${provider === 'anthropic' ? 'selected' : ''}>Anthropic (BYO key)</option>
            </select>
          </div>
          <div class="modal__field">
            <label for="openai-key">OpenAI API key</label>
            <input id="openai-key" type="password" inputmode="text" autocomplete="off" placeholder="${openAiSaved ? '•••••••• (saved — leave blank to keep)' : 'sk-...'}">
          </div>
          <div class="modal__field">
            <label for="anthropic-key">Anthropic API key</label>
            <input id="anthropic-key" type="password" inputmode="text" autocomplete="off" placeholder="${anthropicSaved ? '•••••••• (saved — leave blank to keep)' : 'sk-ant-...'}">
          </div>
          <div class="modal__actions">
            <button type="submit" class="btn btn--primary" id="save-settings">Save</button>
            <button type="button" class="btn btn--danger" id="clear-settings">Clear local keys</button>
            <button type="button" class="btn" id="close-settings" data-modal-close="true">Close</button>
          </div>
        </form>

        <div class="modal__section">
          <h3>Presets</h3>
          <p class="modal__subtitle" id="preset-count">${presets.length ? `${presets.length} saved` : 'Save frequently-used targets + goals for one-click reuse.'}</p>
          <div class="preset-list" id="preset-list">
            ${renderPresetListHtml(presets)}
          </div>
        </div>
      `);
    }

    function openSavePresetModal() {
      const candidate = searchInput?.value?.trim() || state.lastTarget || '';
      const parsed = extractTargetPath(candidate, MAX_INPUT_LEN);
      const target = parsed?.fullPath || '';

      if (!target) {
        toasts.show('Nothing to save yet — enter a valid target or run a search first.', 'warning');
        return;
      }

      pendingPresetTarget = target;
      const method = getMethodById(state.goalId) || methods[0];

      modal.open(`
        <h2 class="modal__title">Save preset</h2>
        <p class="modal__subtitle">Store a target + goal for one-click reuse.</p>
        <form id="save-preset-form">
          <div class="modal__field">
            <label for="preset-name">Name</label>
            <input id="preset-name" type="text" maxlength="80" autocomplete="off" value="${escapeHtml(target)}">
          </div>
          <div class="modal__field">
            <label>Target</label>
            <div class="modal__subtitle"><code>${escapeHtml(target)}</code></div>
          </div>
          <div class="modal__field">
            <label>Goal</label>
            <div class="modal__subtitle"><code>${escapeHtml(method?.name || '')}</code></div>
          </div>
          <div class="modal__actions">
            <button type="submit" class="btn btn--primary" id="preset-save">Save</button>
            <button type="button" class="btn" data-modal-close="true">Cancel</button>
          </div>
        </form>
      `);
    }

    function getCategoriesList() {
      if (Array.isArray(prefixIndex.categories) && prefixIndex.categories.length) {
        return prefixIndex.categories;
      }
      const counts = new Map();
      for (const p of prefixIndex.all) {
        const name = p.category || 'general';
        counts.set(name, (counts.get(name) || 0) + 1);
      }
      return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }

    function renderLibraryCategories() {
      if (!libraryCategories) return;
      const cats = getCategoriesList();
      const allActive = activeCategory === 'all';

      const pillsHtml = [
        `<button type="button" class="category-pill${allActive ? ' category-pill--active' : ''}" data-category="all" aria-pressed="${allActive ? 'true' : 'false'}">All (${prefixIndex.all.length.toLocaleString()})</button>`,
        ...cats.map((c) => {
          const slug = String(c.name || '').toLowerCase();
          const isActive = activeCategory === slug;
          return `<button type="button" class="category-pill${isActive ? ' category-pill--active' : ''}" data-category="${escapeHtml(slug)}" aria-pressed="${isActive ? 'true' : 'false'}">${escapeHtml(c.name)} (${Number(c.count || 0).toLocaleString()})</button>`;
        }),
      ].join('');

      libraryCategories.innerHTML = pillsHtml;
    }

    function renderPrefixLibrary() {
      if (!prefixList || libraryRendered) return;
      libraryRendered = true;

      renderLibraryCategories();

      const frag = document.createDocumentFragment();
      for (const p of prefixIndex.all) {
        const host = p.host || p.subdomain || '';
        if (!host) continue;
        const category = p.category || 'general';
        const purpose = p.purpose || '';
        const baseUrl = buildSafeHostUrl(host);

        const card = document.createElement('div');
        card.className = 'prefix-card';
        card.setAttribute('data-host', host);
        card.setAttribute('data-category', category.toLowerCase());
        card.setAttribute('data-search', `${host} ${category} ${purpose}`.toLowerCase());
        card.innerHTML = `
          <span class="prefix-card__domain">${escapeHtml(host)}</span>
          <span class="prefix-card__cat">${escapeHtml(category)}</span>
          <span class="prefix-card__purpose">${escapeHtml(purpose)}</span>
          <div class="prefix-card__actions">
            <a href="${escapeHtml(baseUrl)}" target="_blank" rel="noopener noreferrer" class="prefix-card__link">Open</a>
            <button type="button" class="prefix-card__copy" data-host="${escapeHtml(host)}" aria-label="Copy URL for ${escapeHtml(host)}">Copy</button>
          </div>
        `;
        frag.appendChild(card);
      }

      const emptyEl = document.createElement('div');
      emptyEl.className = 'empty-state library-empty';
      emptyEl.setAttribute('role', 'status');
      emptyEl.innerHTML = '<p>No prefixes match your current filter.</p>';
      emptyEl.hidden = true;
      frag.appendChild(emptyEl);

      prefixList.innerHTML = '';
      prefixList.appendChild(frag);
      filterPrefixLibrary();
    }

    function filterPrefixLibrary() {
      if (!prefixList || !libraryRendered) return;
      const q = librarySearchQuery.toLowerCase().trim();
      const cards = prefixList.querySelectorAll('.prefix-card');
      const total = cards.length;
      let visible = 0;

      for (const card of cards) {
        const cardCat = card.getAttribute('data-category') || '';
        const haystack = card.getAttribute('data-search') || '';
        const catMatch = activeCategory === 'all' || cardCat === activeCategory;
        const textMatch = !q || haystack.includes(q);
        const match = catMatch && textMatch;

        const el = /** @type {HTMLElement} */ (card);
        el.hidden = !match;
        el.style.display = match ? '' : 'none';
        if (match) visible += 1;
      }

      const emptyEl = prefixList.querySelector('.library-empty');
      if (emptyEl instanceof HTMLElement) {
        emptyEl.hidden = visible > 0;
      }

      if (libraryCount) {
        libraryCount.textContent = `Showing ${visible.toLocaleString()} of ${total.toLocaleString()} prefixes`;
      }
    }

    function renderComboLibrary() {
      if (!comboList || methodsRendered) return;
      methodsRendered = true;

      const frag = document.createDocumentFragment();
      for (const c of methods) {
        const card = document.createElement('div');
        card.className = 'combo-card';
        const domains = (c.prefixes || [])
          .map((x) => resolvePrefixHost(prefixIndex, x) || x)
          .filter(Boolean)
          .join(', ');
        card.innerHTML = `
          <div class="combo-card__header">
            <h4 class="combo-card__name">${escapeHtml(c.name)}</h4>
          </div>
          <p class="combo-card__tip">${escapeHtml(c.description || c.osintUse || '')}</p>
          <code class="combo-card__prefixes">${escapeHtml(domains)}</code>
          <div class="combo-card__actions">
            <button type="button" class="combo-card__use" data-use-goal="${escapeHtml(c.id)}">Select Goal</button>
          </div>
        `;
        frag.appendChild(card);
      }

      comboList.innerHTML = '';
      comboList.appendChild(frag);
    }

    function executeSearch() {
      if (!resultsGrid) return;
      const raw = searchInput?.value?.trim() || '';
      if (!raw) {
        toasts.show('Enter a valid username, numeric ID, or Facebook URL.', 'warning');
        searchInput?.focus();
        return;
      }

      const parsed = extractTargetPath(raw, MAX_INPUT_LEN);

      if (parsed?.linkShimDest) {
        toasts.show(
          `Link Shim detected — destination: ${safeStr(parsed.linkShimDest, 120)}`,
          'info',
          { durationMs: 4500 }
        );
        sendChatMessage(raw);
      }

      if (!parsed?.fullPath) {
        if (!parsed?.linkShimDest) {
          toasts.show('Enter a valid username, numeric ID, or Facebook URL.', 'warning');
        }
        return;
      }

      if (parsed.truncated) {
        toasts.show(`Input truncated to ${MAX_INPUT_LEN} characters.`, 'warning');
      }

      if (parsed.wasUrl && parsed.fullPath !== raw) {
        toasts.show(`Extracted target: ${parsed.fullPath}`, 'info');
      }

      state.lastTarget = parsed.fullPath;
      const recents = saveRecentTarget(parsed.fullPath);
      renderRecentTargets(recents);

      const goal = getMethodById(state.goalId) || methods[0];
      const seenHosts = new Set();
      const picked = [];

      for (const p of goal?.prefixes || []) {
        const host = resolvePrefixHost(prefixIndex, p);
        if (host && !seenHosts.has(host)) {
          seenHosts.add(host);
          picked.push(host);
          if (picked.length >= MAX_RESULTS) break;
        }
      }

      const targetPath = formatTargetPath(parsed.fullPath);
      const frag = document.createDocumentFragment();
      const newResults = [];

      for (const host of picked) {
        const url = buildSafeHostUrl(host, targetPath);
        if (!url || !isSafeHttpUrl(url)) continue;

        const entry = prefixIndex.byHost.get(host.toLowerCase()) || prefixIndex.byHost.get(host);
        const category = entry?.category || 'web';
        const purpose = entry?.purpose || goal?.name || 'Facebook endpoint';
        newResults.push({ host, url, category, purpose });

        const card = document.createElement('article');
        card.className = 'result-card surface';
        card.innerHTML = `
          <div class="result-card__header">
            <span class="result-card__type">${escapeHtml(category)}</span>
            <span class="result-card__confidence">${escapeHtml(purpose)}</span>
          </div>
          <h3 class="result-card__title">${escapeHtml(host)}</h3>
          <pre class="result-card__data"><code>${escapeHtml(url)}</code></pre>
          <div class="result-card__meta">
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="result-card__link">Open</a>
            <button type="button" class="result-card__copy" aria-label="Copy URL for ${escapeHtml(host)}" data-url="${escapeHtml(url)}">Copy</button>
          </div>
        `;
        frag.appendChild(card);
      }

      resultsGrid.innerHTML = '';
      resultsGrid.appendChild(frag);
      state.lastResults = newResults;

      if (resultsCount) {
        resultsCount.textContent = `${newResults.length} URL${newResults.length === 1 ? '' : 's'}`;
      }
      if (resultsTitle) {
        resultsTitle.textContent = `Results for "${safeStr(parsed.fullPath, 80)}" — ${goal?.name || 'OSINT'}`;
      }
      toasts.show(`Generated ${newResults.length} URLs`, 'success');
    }

    function copyAllLastResults() {
      if (!state.lastResults.length) {
        toasts.show('No results to copy — run a search first.', 'info');
        return;
      }
      const urls = state.lastResults.map((r) => r.url).join('\n');
      copyText(urls, `Copied ${state.lastResults.length} URLs`);
    }

    function exportLastResultsCsv() {
      if (!state.lastResults.length) {
        toasts.show('No results to export — run a search first.', 'info');
        return;
      }

      const rows = [
        ['host', 'category', 'purpose', 'url'],
        ...state.lastResults.map((r) => [r.host, r.category, r.purpose || '', r.url]),
      ];
      downloadCsv('fb-osint-results.csv', toCsv(rows));
      toasts.show('Exported CSV', 'success');
    }

    function openUrlsNow(urls) {
      let opened = 0;
      let blocked = 0;
      for (const u of urls) {
        if (!isSafeHttpUrl(u)) continue;
        const win = window.open(u, '_blank', 'noopener,noreferrer');
        if (win) opened += 1;
        else blocked += 1;
      }

      if (blocked > 0) {
        toasts.show(
          `Opened ${opened} of ${urls.length} tabs (${blocked} blocked by popup blocker).`,
          'warning',
          { durationMs: 4500 }
        );
      } else {
        toasts.show(`Opened ${opened} tabs`, 'success');
      }
    }

    function bulkOpenLastResults() {
      if (!state.lastResults.length) {
        toasts.show('No results to open — run a search first.', 'info');
        return;
      }

      const urls = state.lastResults
        .slice(0, MAX_RESULTS)
        .map((r) => r.url)
        .filter((u) => isSafeHttpUrl(u));

      if (!urls.length) {
        toasts.show('No valid URLs to open.', 'warning');
        return;
      }

      if (urls.length > 3) {
        pendingBulkUrls = urls;
        modal.open(`
          <h2 class="modal__title">Open ${urls.length} tabs?</h2>
          <p class="modal__subtitle">Opening ${urls.length} tabs at once may trigger your browser's popup blocker.</p>
          <div class="modal__actions">
            <button type="button" class="btn btn--primary" data-bulk-confirm="true">Open ${urls.length} tabs</button>
            <button type="button" class="btn" data-bulk-copy="true">Copy all URLs instead</button>
            <button type="button" class="btn" data-modal-close="true">Cancel</button>
          </div>
        `);
        return;
      }

      openUrlsNow(urls);
    }

    function runAssistantAction(action) {
      if (!action) return;
      if (action.type === 'copy') {
        copyText(String(action.payload || ''), 'Copied');
        return;
      }
      if (action.type === 'open') {
        const url = String(action.payload || '');
        if (!isSafeHttpUrl(url)) {
          toasts.show('Blocked unsafe URL', 'warning');
          return;
        }
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (!win) {
          toasts.show('Popup blocked by browser — try copying the URL instead.', 'warning');
        }
        return;
      }
      if (action.type === 'setGoal') {
        const goalId = action.payload?.goalId || action.payload || 'profile-discovery';
        setGoal(String(goalId));
        updateUrlPreview();
        const method = getMethodById(state.goalId);
        toasts.show(`Goal set: ${method?.name || state.goalId}`, 'info');
        return;
      }
      if (action.type === 'runSearch') {
        if (searchInput) searchInput.value = String(action.payload || '');
        switchPanel(0);
        updateUrlPreview();
        executeSearch();
        return;
      }
      if (action.type === 'exportCsv') {
        exportLastResultsCsv();
        return;
      }
      if (action.type === 'bulkOpen') {
        bulkOpenLastResults();
        return;
      }
      if (action.type === 'openModal') {
        const p = action.payload || {};
        if (p.modal === 'settings') openSettingsModal();
        if (p.modal === 'methods') {
          const method = getMethodById(p.methodId) || methods[0];
          modal.open(`
            <h2 class="modal__title">${escapeHtml(method?.name || 'Method')}</h2>
            <p class="modal__subtitle">${escapeHtml(method?.description || method?.osintUse || '')}</p>
            <div class="modal__section">
              <h3>Steps</h3>
              <p class="modal__subtitle">${escapeHtml((method?.steps || []).join(' • ') || '')}</p>
            </div>
            <div class="modal__actions">
              <button type="button" class="btn btn--primary" data-modal-close="true">Close</button>
            </div>
          `);
        }
      }
    }

    async function sendChatMessage(text) {
      const raw = (text ?? chatInput?.value ?? '').toString().trim();
      if (!raw || chatPending) return;

      chatPending = true;
      if (chatInput) chatInput.disabled = true;
      if (chatSend) chatSend.disabled = true;

      addAssistantMessage('user', raw);
      if (text === undefined && chatInput) chatInput.value = '';

      const priorHistory = state.chatHistory.slice(-MAX_CHAT_HISTORY_ENTRIES);

      let thinkingEl = null;
      if (chatMessages) {
        thinkingEl = document.createElement('div');
        thinkingEl.className = 'chat-message chat-message--assistant chat-message--pending';
        thinkingEl.setAttribute('role', 'status');
        thinkingEl.innerHTML =
          '<span class="chat-message__role">Assistant</span><p class="chat-message__text">Thinking</p>';
        chatMessages.appendChild(thinkingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      try {
        const res = await assistant.respond(raw, {
          lastTarget: state.lastTarget,
          lastResults: state.lastResults,
          history: priorHistory,
        });

        thinkingEl?.remove();
        thinkingEl = null;

        const replyText = res?.text || 'No response available.';
        addAssistantMessage('assistant', replyText, res?.actions || []);

        state.chatHistory.push(
          { role: 'user', content: safeStr(raw, 1200) },
          { role: 'assistant', content: safeStr(replyText, 2000) }
        );
        if (state.chatHistory.length > MAX_CHAT_HISTORY_ENTRIES) {
          state.chatHistory = state.chatHistory.slice(-MAX_CHAT_HISTORY_ENTRIES);
        }

        if (res?.warning) {
          toasts.show(res.warning, 'warning', { durationMs: 4500 });
        }
        if (res?.autoAction) {
          runAssistantAction(res.autoAction);
        }
      } catch {
        thinkingEl?.remove();
        thinkingEl = null;
        addAssistantMessage(
          'assistant',
          'Unable to process that request right now. Please try again.'
        );
        toasts.show('Assistant request failed', 'error');
      } finally {
        thinkingEl?.remove();
        chatPending = false;
        if (chatInput) chatInput.disabled = false;
        if (chatSend) chatSend.disabled = false;
      }
    }

    // Pre-build memoized static command palette items once at init
    const staticMethodItems = methods.map((m) => ({
      id: `goal:${m.id}`,
      label: `Goal: ${m.name}`,
      icon: '◎',
      hint: m.id,
      _search: `goal: ${m.name} ${m.id}`.toLowerCase(),
      run: () => {
        setGoal(m.id);
        updateUrlPreview();
        toasts.show(`Goal set: ${m.name}`, 'info');
      },
    }));

    const staticPrefixItems = prefixIndex.all.slice(0, 200).map((p) => {
      const host = p.host || p.subdomain || '';
      const cat = p.category || 'web';
      return {
        id: `prefix:${host}`,
        label: `Open ${host}`,
        icon: '↗',
        hint: cat,
        _search: `open ${host} ${cat}`.toLowerCase(),
        run: () => {
          const url = buildSafeHostUrl(host, getCurrentTargetPath());
          if (isSafeHttpUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        },
      };
    });

    const palette = createCommandPalette({
      shouldOpen: () => {
        if (modal.isOpen()) modal.close();
        return true;
      },
      onSelect: (item) => item?.run?.(),
      getItems: (query) => {
        const q = (query || '').toLowerCase().trim();
        const base = [
          {
            id: 'focus-search',
            label: 'Focus Search',
            icon: '⌁',
            hint: '/',
            _search: 'focus search /',
            run: () => {
              switchPanel(0);
              searchInput?.focus();
            },
          },
          {
            id: 'toggle-theme',
            label: `Theme: ${getTheme()}`,
            icon: '◐',
            hint: 'T',
            _search: `theme: ${getTheme()} toggle dark light t`,
            run: () => {
              const t = toggleTheme();
              toasts.show(`Theme: ${t}`, 'info');
            },
          },
          {
            id: 'open-settings',
            label: 'Settings',
            icon: '⧉',
            hint: 'Keys & Presets',
            _search: 'settings keys presets api provider',
            run: () => openSettingsModal(),
          },
          {
            id: 'copy-all',
            label: 'Copy all last results',
            icon: '⎘',
            hint: 'Clipboard',
            _search: 'copy all last results clipboard urls',
            run: () => copyAllLastResults(),
          },
          {
            id: 'export',
            label: 'Export last results (CSV)',
            icon: '⇩',
            hint: 'Ctrl+E',
            _search: 'export last results csv ctrl+e',
            run: () => exportLastResultsCsv(),
          },
          {
            id: 'bulk-open',
            label: 'Bulk open last results',
            icon: '↗',
            hint: 'Ctrl+O',
            _search: 'bulk open last results tabs ctrl+o',
            run: () => bulkOpenLastResults(),
          },
        ];

        const presetItems = getPresets().map((p) => ({
          id: `preset:${p.id}`,
          label: `Preset: ${p.name}`,
          icon: '⟠',
          hint: p.goalId,
          _search: `preset: ${p.name} ${p.target} ${p.goalId}`.toLowerCase(),
          run: () => {
            setGoal(p.goalId);
            if (searchInput) searchInput.value = p.target;
            switchPanel(0);
            updateUrlPreview();
            executeSearch();
          },
        }));

        const matches = [];
        const lists = [base, presetItems, staticMethodItems, staticPrefixItems];
        for (const list of lists) {
          for (const it of list) {
            if (!q || it._search.includes(q)) {
              matches.push(it);
              if (matches.length >= 24) return matches;
            }
          }
        }
        return matches;
      },
    });

    // ----------------------------
    // INIT wiring
    // ----------------------------
    if (statPrefixes) statPrefixes.textContent = prefixIndex.all.length.toLocaleString();
    if (statMethods) statMethods.textContent = methods.length.toLocaleString();

    setGoal(state.goalId);
    switchPanel(0);
    renderRecentTargets();
    updateUrlPreview();

    if (searchSubmit) on(searchSubmit, 'click', executeSearch);
    if (searchClearBtn) {
      on(searchClearBtn, 'click', () => {
        if (searchInput) {
          searchInput.value = '';
          updateUrlPreview();
          searchInput.focus();
        }
      });
    }
    if (searchInput) {
      searchInput.setAttribute('maxlength', String(MAX_INPUT_LEN));
      on(searchInput, 'keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeSearch();
        }
        if (e.key === 'Escape') {
          searchInput.value = '';
          updateUrlPreview();
          searchInput.blur();
        }
      });
      const debouncedPreview = debounce(updateUrlPreview, DEBOUNCE_MS);
      on(searchInput, 'input', () => {
        if (searchClearBtn) searchClearBtn.hidden = searchInput.value.length === 0;
        debouncedPreview();
      });
    }

    if (copyBtn) {
      on(copyBtn, 'click', () => {
        if (urlOutput?.textContent) copyText(urlOutput.textContent, 'Copied URL');
      });
    }

    // Delegated recent target chips
    if (recentTargetsEl) {
      on(recentTargetsEl, 'click', (e) => {
        const chip = e.target instanceof Element ? e.target.closest('.recent-chip') : null;
        if (!chip) return;
        const target = chip.getAttribute('data-recent-target') || '';
        if (!target) return;
        if (searchInput) searchInput.value = target;
        updateUrlPreview();
        executeSearch();
      });
    }

    // Single delegated click listener on results grid
    if (resultsGrid) {
      on(resultsGrid, 'click', (e) => {
        const btn = e.target instanceof Element ? e.target.closest('.result-card__copy') : null;
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const url = btn.getAttribute('data-url') || '';
        copyText(url, 'Copied URL');
      });
    }

    // Delegated category pills in Library panel
    if (libraryCategories) {
      on(libraryCategories, 'click', (e) => {
        const pill = e.target instanceof Element ? e.target.closest('.category-pill') : null;
        if (!pill) return;
        const cat = pill.getAttribute('data-category') || 'all';
        activeCategory = cat;
        libraryCategories.querySelectorAll('.category-pill').forEach((el) => {
          const isActive = el.getAttribute('data-category') === activeCategory;
          el.classList.toggle('category-pill--active', isActive);
          el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        filterPrefixLibrary();
      });
    }

    // Single delegated click listener on Prefix Library
    if (prefixList) {
      on(prefixList, 'click', (e) => {
        const copyTrigger =
          e.target instanceof Element ? e.target.closest('.prefix-card__copy') : null;
        if (copyTrigger) {
          e.preventDefault();
          e.stopPropagation();
          const host = copyTrigger.getAttribute('data-host') || '';
          const url = buildSafeHostUrl(host, getCurrentTargetPath());
          copyText(url, `Copied ${host}`);
          return;
        }

        const linkTrigger =
          e.target instanceof Element ? e.target.closest('.prefix-card__link') : null;
        if (linkTrigger instanceof HTMLAnchorElement) {
          e.stopPropagation();
          const card = linkTrigger.closest('.prefix-card');
          const host = card?.getAttribute('data-host') || '';
          if (host) {
            const url = buildSafeHostUrl(host, getCurrentTargetPath());
            if (isSafeHttpUrl(url)) linkTrigger.href = url;
          }
          return;
        }

        const card = e.target instanceof Element ? e.target.closest('.prefix-card') : null;
        if (!card) return;
        const host = card.getAttribute('data-host') || '';
        const url = buildSafeHostUrl(host, getCurrentTargetPath());
        if (isSafeHttpUrl(url)) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
    }

    if (libraryFilter) {
      libraryFilter.setAttribute('maxlength', '100');
      on(
        libraryFilter,
        'input',
        debounce(() => {
          librarySearchQuery = libraryFilter.value || '';
          filterPrefixLibrary();
        }, DEBOUNCE_MS)
      );
    }

    // Single delegated click listener on Methods Panel
    if (comboList) {
      on(comboList, 'click', (e) => {
        const useBtn = e.target instanceof Element ? e.target.closest('[data-use-goal]') : null;
        if (!useBtn) return;
        const goalId = useBtn.getAttribute('data-use-goal') || 'profile-discovery';
        setGoal(goalId);
        switchPanel(0);
        updateUrlPreview();
        if (searchInput?.value?.trim()) {
          executeSearch();
        } else {
          const method = getMethodById(state.goalId);
          toasts.show(`Goal set: ${method?.name || state.goalId}`, 'info');
          searchInput?.focus();
        }
      });
    }

    // Single delegated listeners on Modal Body (click + submit)
    if (modalBody) {
      on(modalBody, 'submit', (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;

        if (form.id === 'settings-form') {
          e.preventDefault();
          const providerSelect = $('#provider-select', modalBody);
          const openaiKeyInput = $('#openai-key', modalBody);
          const anthropicKeyInput = $('#anthropic-key', modalBody);

          const newProvider =
            providerSelect instanceof HTMLSelectElement ? providerSelect.value : 'local';
          const enteredOpenAI =
            openaiKeyInput instanceof HTMLInputElement ? openaiKeyInput.value.trim() : '';
          const enteredAnthropic =
            anthropicKeyInput instanceof HTMLInputElement ? anthropicKeyInput.value.trim() : '';

          if (enteredOpenAI) setOpenAIKey(enteredOpenAI);
          if (enteredAnthropic) setAnthropicKey(enteredAnthropic);
          setProvider(newProvider);

          const missingOpenAI = newProvider === 'openai' && !enteredOpenAI && !hasOpenAIKey();
          const missingAnthropic =
            newProvider === 'anthropic' && !enteredAnthropic && !hasAnthropicKey();

          if (missingOpenAI || missingAnthropic) {
            toasts.show(
              `Saved provider (${newProvider}), but no API key is configured — assistant will use local fallback.`,
              'warning',
              { durationMs: 4500 }
            );
          } else {
            toasts.show(`Saved settings (provider: ${getProvider()})`, 'success');
          }
          modal.close();
          return;
        }

        if (form.id === 'save-preset-form') {
          e.preventDefault();
          const nameInput = $('#preset-name', modalBody);
          const rawName = nameInput instanceof HTMLInputElement ? nameInput.value.trim() : '';
          const name = rawName || pendingPresetTarget;
          const res = addPreset({
            name,
            target: pendingPresetTarget,
            goalId: state.goalId,
          });
          if (res && res.ok === false) {
            toasts.show(res.error || 'Could not save preset.', 'error');
            return;
          }
          toasts.show(`Saved preset: ${res?.preset?.name || name}`, 'success');
          modal.close();
        }
      });

      on(modalBody, 'click', (e) => {
        if (!(e.target instanceof Element)) return;

        if (e.target.closest('#clear-settings')) {
          clearLocalSettings();
          toasts.show('Cleared local assistant keys', 'info');
          const providerSelect = $('#provider-select', modalBody);
          const openaiKeyInput = $('#openai-key', modalBody);
          const anthropicKeyInput = $('#anthropic-key', modalBody);
          if (providerSelect instanceof HTMLSelectElement) providerSelect.value = 'local';
          if (openaiKeyInput instanceof HTMLInputElement) {
            openaiKeyInput.value = '';
            openaiKeyInput.placeholder = 'sk-...';
          }
          if (anthropicKeyInput instanceof HTMLInputElement) {
            anthropicKeyInput.value = '';
            anthropicKeyInput.placeholder = 'sk-ant-...';
          }
          return;
        }

        const applyBtn = e.target.closest('[data-preset-apply]');
        if (applyBtn) {
          const id = applyBtn.getAttribute('data-preset-apply') || '';
          const preset = getPresets().find((x) => x.id === id);
          if (!preset) return;
          setGoal(preset.goalId);
          if (searchInput) searchInput.value = preset.target;
          switchPanel(0);
          updateUrlPreview();
          modal.close();
          executeSearch();
          return;
        }

        const removeBtn = e.target.closest('[data-preset-remove]');
        if (removeBtn) {
          const id = removeBtn.getAttribute('data-preset-remove') || '';
          const res = removePreset(id);
          if (res && res.ok === false) {
            toasts.show(res.error || 'Could not delete preset.', 'error');
            return;
          }
          const updated = getPresets();
          const listEl = $('#preset-list', modalBody);
          const countEl = $('#preset-count', modalBody);
          if (listEl) listEl.innerHTML = renderPresetListHtml(updated);
          if (countEl) {
            countEl.textContent = updated.length
              ? `${updated.length} saved`
              : 'Save frequently-used targets + goals for one-click reuse.';
          }
          toasts.show('Preset deleted', 'info');
          return;
        }

        if (e.target.closest('[data-bulk-confirm="true"]')) {
          const urls = pendingBulkUrls.slice();
          pendingBulkUrls = [];
          modal.close();
          openUrlsNow(urls);
          return;
        }

        if (e.target.closest('[data-bulk-copy="true"]')) {
          const urls = pendingBulkUrls.slice();
          pendingBulkUrls = [];
          modal.close();
          copyText(urls.join('\n'), `Copied ${urls.length} URLs`);
        }
      });
    }

    // Single delegated listener on chat message action buttons
    if (chatMessages) {
      on(chatMessages, 'click', (e) => {
        const btn =
          e.target instanceof Element ? e.target.closest('.chat-message__action') : null;
        if (!btn) return;
        const action = chatActionMap.get(btn);
        if (action) runAssistantAction(action);
      });
    }

    if (chatSend) on(chatSend, 'click', () => sendChatMessage());
    if (chatInput) {
      chatInput.setAttribute('maxlength', String(MAX_INPUT_LEN));
      on(chatInput, 'keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendChatMessage();
        }
      });
    }

    // Accessible Tabs navigation
    navBtns.forEach((btn, i) => {
      on(btn, 'click', () => {
        const idx = Number(btn.getAttribute('data-panel') ?? i);
        switchPanel(idx);
      });
    });

    if (navEl && navBtns.length) {
      on(navEl, 'keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') {
          return;
        }
        e.preventDefault();
        let nextIdx = state.activePanel;
        if (e.key === 'ArrowRight') nextIdx = (state.activePanel + 1) % navBtns.length;
        else if (e.key === 'ArrowLeft')
          nextIdx = (state.activePanel - 1 + navBtns.length) % navBtns.length;
        else if (e.key === 'Home') nextIdx = 0;
        else if (e.key === 'End') nextIdx = navBtns.length - 1;

        switchPanel(nextIdx);
        const targetBtn = navBtns.find(
          (b, i) => Number(b.getAttribute('data-panel') ?? i) === nextIdx
        );
        if (targetBtn instanceof HTMLElement) targetBtn.focus();
      });
    }

    // Quick Method Chips
    $$('.method-chip').forEach((chip) => {
      on(chip, 'click', () => {
        const q = chip.getAttribute('data-query') || '';
        const goalId = chip.getAttribute('data-goal') || 'profile-discovery';
        setGoal(goalId);
        updateUrlPreview();
        if (searchInput?.value?.trim()) {
          executeSearch();
        } else if (q) {
          sendChatMessage(q);
        }
      });
    });

    // Collapsible Chat Panel
    if (chatToggle) {
      on(chatToggle, 'click', () => {
        const expanded = chatToggle.getAttribute('aria-expanded') === 'true';
        const nextExpanded = !expanded;
        chatToggle.setAttribute('aria-expanded', String(nextExpanded));
        const icon = chatToggle.querySelector('.chat-panel__toggle-icon');
        if (icon) icon.textContent = nextExpanded ? '−' : '+';
        if (chatPanel) chatPanel.classList.toggle('chat-panel--collapsed', !nextExpanded);
        if (chatBody) chatBody.hidden = !nextExpanded;
      });
    }

    on(cmdPaletteBtn, 'click', () => palette.open());
    on(themeToggle, 'click', () => {
      const t = toggleTheme();
      toasts.show(`Theme: ${t}`, 'info');
    });
    on(settingsBtn, 'click', openSettingsModal);
    on(copyAllBtn, 'click', copyAllLastResults);
    on(exportCsvBtn, 'click', exportLastResultsCsv);
    on(bulkOpenBtn, 'click', bulkOpenLastResults);
    on(savePresetBtn, 'click', openSavePresetModal);

    // Global keyboard shortcuts
    on(document, 'keydown', (e) => {
      const overlayOpen = modal.isOpen() || palette.isOpen();
      if (overlayOpen || isTypingContext(e.target)) return;

      const k = e.key.toLowerCase();
      const hasMod = e.metaKey || e.ctrlKey || e.altKey;

      if (!hasMod && k === 't') {
        const t = toggleTheme();
        toasts.show(`Theme: ${t}`, 'info');
        return;
      }

      if (!hasMod && e.key === '/') {
        e.preventDefault();
        switchPanel(0);
        searchInput?.focus();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !e.altKey && k === 'e') {
        e.preventDefault();
        exportLastResultsCsv();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !e.altKey && k === 'o') {
        e.preventDefault();
        bulkOpenLastResults();
      }
    });

    addAssistantMessage(
      'assistant',
      'System ready. Use quick goals, paste a Facebook URL, or press Ctrl/Cmd+K for commands.'
    );
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) console.error('OSINT init error:', err);
    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = '<p class="error-fallback">Unable to load. Please refresh the page.</p>';
    }
  }
}
