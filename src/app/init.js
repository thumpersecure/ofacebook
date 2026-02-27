import { createToasts } from '../ui/toast.js';
import { createModal } from '../ui/modal.js';
import { createCommandPalette } from '../ui/command-palette.js';
import { initTheme, toggleTheme, getTheme } from '../ui/theme.js';
import { $, $$, on } from '../utils/dom.js';
import { debounce, safeStr } from '../utils/lang.js';
import { escapeHtml, sanitizeForUrl } from '../utils/security.js';
import { buildUrl as buildPrefixUrl, THUMPERSECURE_PREFIXES, METHOD_COMBINATIONS } from '../prefix-library.js';
import { createAssistant } from '../assistant/assistant.js';
import { getPlan, getPlanId, setPlanId, getProvider, setProvider, setOpenAIKey, setAnthropicKey, hasFeature } from '../commercial/entitlements.js';
import { canConsume, increment, getUsage } from '../commercial/usage.js';
import { getPrefixIndex, matchPrefixHost, resolvePrefixHost } from '../domain/prefixes.js';
import { getMethodCombinations, getMethodById } from '../domain/methods.js';
import { getPresets, addPreset, removePreset } from './presets.js';

const MAX_INPUT_LEN = 500;
const MAX_CHAT_MESSAGES = 80;
const DEBOUNCE_MS = 150;

function buildHostUrl(host, path) {
  if (!host || typeof host !== 'string') return '';
  const base = host.startsWith('http') ? host : `https://${host}`;
  const p = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const url = base + p;
  return url.length > 2048 ? base : url;
}

function renderMarkdownLite(text) {
  // CSP-friendly, tiny: bold + inline code + newlines.
  const t = escapeHtml(String(text ?? ''));
  return t
    .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\\n/g, '<br>');
}

function toCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  return rows.map((r) => r.map(esc).join(',')).join('\\n');
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function initApp() {
  initTheme();

  const toasts = createToasts();
  const modal = createModal();
  const assistant = createAssistant();

  const prefixIndex = getPrefixIndex();
  const methods = getMethodCombinations();

  const searchInput = $('#search-input');
  const searchSubmit = $('.search-box__submit');
  const resultsGrid = $('#results-grid');
  const resultsTitle = $('.results__title');
  const chatMessages = $('#chat-messages');
  const chatInput = $('#chat-input');
  const chatSend = $('.chat-panel__send');
  const prefixList = $('#prefix-list');
  const comboList = $('#combo-list');
  const urlOutput = $('#url-output');
  const themeToggle = $('#theme-toggle');
  const upgradeBtn = $('#upgrade-btn');
  const copyBtn = $('#url-copy-btn');
  const activeGoalLabel = $('#active-goal');
  const exportCsvBtn = $('#export-csv-btn');
  const bulkOpenBtn = $('#bulk-open-btn');
  const savePresetBtn = $('#save-preset-btn');

  /** @type {{ goalId: string, lastTarget: string, lastResults: Array<{host: string, url: string, category: string}> }} */
  const state = {
    goalId: 'profile-discovery',
    lastTarget: '',
    lastResults: [],
  };

  function setGoal(goalId) {
    const m = getMethodById(goalId);
    state.goalId = m ? goalId : 'profile-discovery';
    $$('.method-chip').forEach((c) => c.classList.toggle('method-chip--active', c.getAttribute('data-goal') === state.goalId));
    if (activeGoalLabel) {
      const method = getMethodById(state.goalId) || methods[0];
      activeGoalLabel.textContent = method?.name || 'Profile Discovery';
    }
  }

  function addAssistantMessage(role, text, actions = []) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = `chat-message chat-message--${role === 'user' ? 'user' : 'assistant'}`;
    const label = role === 'user' ? 'You' : 'Assistant';
    const actionsHtml = actions?.length
      ? `<div class="chat-message__actions">${actions
          .slice(0, 4)
          .map((a, i) => `<button type="button" class="chat-message__action" data-action-idx="${i}">${escapeHtml(a.label || 'Action')}</button>`)
          .join('')}</div>`
      : '';
    div.innerHTML = `
      <span class="chat-message__role">${escapeHtml(label)}</span>
      <p class="chat-message__text">${renderMarkdownLite(safeStr(text, 6000))}</p>
      ${actionsHtml}
    `;

    if (actions?.length) {
      div.querySelectorAll('.chat-message__action').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-action-idx') || '0');
          runAssistantAction(actions[idx]);
        });
      });
    }

    chatMessages.appendChild(div);
    while (chatMessages.children.length > MAX_CHAT_MESSAGES) chatMessages.removeChild(chatMessages.children[0]);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function openPricingModal() {
    const plan = getPlan();
    const usage = getUsage();
    const presets = getPresets();

    const plans = ['free', 'pro', 'enterprise'].map((id) => {
      const p = id === 'free' ? 'Free' : id === 'pro' ? 'Pro' : 'Enterprise';
      const price = id === 'free' ? '$0' : id === 'pro' ? '$12/mo' : 'Contact';
      const active = plan.id === id ? ' (current)' : '';
      return `<option value="${id}" ${plan.id === id ? 'selected' : ''}>${p} — ${price}${active}</option>`;
    });

    const provider = getProvider();
    const providerDisabled = hasFeature('llmProviders') ? '' : 'disabled';

    modal.open(`
      <h2 class="modal__title">Plans & Settings</h2>
      <p class="modal__subtitle">Client-side demo gating (no backend). Limits reset daily.</p>

      <div class="modal__section">
        <h3>Plan</h3>
        <div class="modal__field">
          <label for="plan-select">Current plan</label>
          <select id="plan-select">${plans.join('')}</select>
        </div>
        <div class="modal__field">
          <label>Today usage</label>
          <div class="modal__subtitle">Searches: ${usage.searches} • Assistant messages: ${usage.assistantMessages}</div>
        </div>
      </div>

      <div class="modal__section">
        <h3>Assistant provider</h3>
        <p class="modal__subtitle">Optional BYO API key. Keys are stored in <code>localStorage</code> in your browser.</p>
        <div class="modal__field">
          <label for="provider-select">Provider</label>
          <select id="provider-select" ${providerDisabled}>
            <option value="local" ${provider === 'local' ? 'selected' : ''}>Local (offline)</option>
            <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI (BYO key)</option>
            <option value="anthropic" ${provider === 'anthropic' ? 'selected' : ''}>Anthropic (BYO key)</option>
          </select>
        </div>
        <div class="modal__field">
          <label for="openai-key">OpenAI API key</label>
          <input id="openai-key" type="password" inputmode="text" autocomplete="off" placeholder="sk-..." ${providerDisabled}>
        </div>
        <div class="modal__field">
          <label for="anthropic-key">Anthropic API key</label>
          <input id="anthropic-key" type="password" inputmode="text" autocomplete="off" placeholder="sk-ant-..." ${providerDisabled}>
        </div>
        <div class="modal__actions">
          <button type="button" class="btn btn--primary" id="save-settings">Save</button>
          <button type="button" class="btn" id="close-settings">Close</button>
        </div>
      </div>

      <div class="modal__section">
        <h3>Presets</h3>
        <p class="modal__subtitle">Save frequently-used targets + goals. Pro feature.</p>
        <div class="modal__subtitle">${presets.length ? `${presets.length} saved` : 'No presets saved yet.'}</div>
        <div class="modal__actions" id="preset-actions">
          ${presets
            .slice(0, 6)
            .map(
              (p) =>
                `<button type="button" class="btn" data-preset-apply="${escapeHtml(p.id)}">Apply: ${escapeHtml(p.name)}</button>` +
                `<button type="button" class="btn btn--danger" data-preset-remove="${escapeHtml(p.id)}">Delete</button>`
            )
            .join('')}
        </div>
      </div>
    `);

    const planSelect = $('#plan-select', document.getElementById('modal-body'));
    const providerSelect = $('#provider-select', document.getElementById('modal-body'));
    const openaiKey = $('#openai-key', document.getElementById('modal-body'));
    const anthropicKey = $('#anthropic-key', document.getElementById('modal-body'));
    const saveBtn = $('#save-settings', document.getElementById('modal-body'));
    const closeBtn = $('#close-settings', document.getElementById('modal-body'));

    saveBtn?.addEventListener('click', () => {
      const newPlan = planSelect?.value || 'free';
      setPlanId(newPlan);
      const newProvider = providerSelect?.value || 'local';
      setProvider(newProvider);
      setOpenAIKey(openaiKey?.value || '');
      setAnthropicKey(anthropicKey?.value || '');
      toasts.show(`Saved settings (plan: ${getPlanId()}, provider: ${getProvider()})`, 'success');
      modal.close();
    });
    closeBtn?.addEventListener('click', () => modal.close());

    const presetActions = $('#preset-actions', document.getElementById('modal-body'));
    presetActions?.querySelectorAll('[data-preset-apply]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-preset-apply') || '';
        const p = getPresets().find((x) => x.id === id);
        if (!p) return;
        setGoal(p.goalId);
        if (searchInput) searchInput.value = p.target;
        updateUrlPreview();
        toasts.show(`Applied preset: ${p.name}`, 'success');
        modal.close();
      });
    });
    presetActions?.querySelectorAll('[data-preset-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-preset-remove') || '';
        removePreset(id);
        toasts.show('Preset deleted', 'info');
        modal.close();
        openPricingModal();
      });
    });
  }

  function openSavePresetModal() {
    const target = state.lastTarget || searchInput?.value?.trim() || '';
    if (!target) {
      toasts.show('Nothing to save yet — run a search first.', 'info');
      return;
    }
    if (!hasFeature('savedPresets')) {
      toasts.show('Presets are a Pro feature.', 'info');
      openPricingModal();
      return;
    }

    const method = getMethodById(state.goalId) || methods[0];
    modal.open(`
      <h2 class="modal__title">Save preset</h2>
      <p class="modal__subtitle">Store a target + goal for one-click reuse.</p>
      <div class="modal__field">
        <label for="preset-name">Name</label>
        <input id="preset-name" type="text" autocomplete="off" value="${escapeHtml(target)}">
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
        <button type="button" class="btn btn--primary" id="preset-save">Save</button>
        <button type="button" class="btn" data-modal-close="true">Cancel</button>
      </div>
    `);

    const nameInput = $('#preset-name', document.getElementById('modal-body'));
    const save = $('#preset-save', document.getElementById('modal-body'));
    save?.addEventListener('click', () => {
      const name = nameInput?.value || target;
      addPreset({ name, target, goalId: state.goalId });
      toasts.show('Preset saved', 'success');
      modal.close();
    });
  }

  function updateUrlPreview() {
    if (!urlOutput || !searchInput) return;
    const path = searchInput.value.trim().slice(0, MAX_INPUT_LEN);
    const subdomain = 'www.facebook.com';
    urlOutput.textContent = buildHostUrl(subdomain, path ? `/${sanitizeForUrl(path, MAX_INPUT_LEN)}` : '');
  }

  function copyUrlToClipboard() {
    if (!urlOutput?.textContent) return;
    navigator.clipboard?.writeText(urlOutput.textContent)
      .then(() => toasts.show('Copied URL', 'success'))
      .catch(() => toasts.show('Copy failed', 'error'));
  }

  function renderPrefixLibrary() {
    if (!prefixList) return;
    const frag = document.createDocumentFragment();
    for (const p of THUMPERSECURE_PREFIXES) {
      const card = document.createElement('div');
      card.className = 'prefix-card';
      card.innerHTML = `
        <span class="prefix-card__domain">${escapeHtml(p.subdomain)}</span>
        <span class="prefix-card__cat">${escapeHtml(p.category)}</span>
        <span class="prefix-card__purpose">${escapeHtml(p.purpose)}</span>
        <a href="${escapeHtml(buildPrefixUrl(p.subdomain))}" target="_blank" rel="noopener noreferrer" class="prefix-card__link">Open</a>
      `;
      card.querySelector('.prefix-card__link')?.addEventListener('click', (e) => e.stopPropagation());
      card.addEventListener('click', () => {
        const path = searchInput?.value?.trim() ? `/${sanitizeForUrl(searchInput.value, MAX_INPUT_LEN)}` : '';
        window.open(buildPrefixUrl(p.subdomain, path), '_blank', 'noopener,noreferrer');
      });
      frag.appendChild(card);
    }
    prefixList.innerHTML = '';
    prefixList.appendChild(frag);
  }

  function renderComboLibrary() {
    if (!comboList) return;
    const frag = document.createDocumentFragment();
    for (const c of METHOD_COMBINATIONS) {
      const card = document.createElement('div');
      card.className = 'combo-card';
      const domains = c.prefixes
        .map((x) => resolvePrefixHost(prefixIndex, x) || x)
        .filter(Boolean)
        .join(', ');
      card.innerHTML = `
        <h4 class="combo-card__name">${escapeHtml(c.name)}</h4>
        <p class="combo-card__tip">${escapeHtml(c.description || c.osintUse || '')}</p>
        <code class="combo-card__prefixes">${escapeHtml(domains)}</code>
      `;
      frag.appendChild(card);
    }
    comboList.innerHTML = '';
    comboList.appendChild(frag);
  }

  function filterPrefixLibrary(query) {
    if (!prefixList) return;
    const q = (query || '').toLowerCase().trim();
    const cards = prefixList.querySelectorAll('.prefix-card');
    for (const card of cards) {
      const domain = card.querySelector('.prefix-card__domain')?.textContent || '';
      const purpose = card.querySelector('.prefix-card__purpose')?.textContent || '';
      const cat = card.querySelector('.prefix-card__cat')?.textContent || '';
      const match = !q || domain.toLowerCase().includes(q) || purpose.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
      /** @type {HTMLElement} */ (card).style.display = match ? '' : 'none';
    }
  }

  function executeSearch() {
    const raw = searchInput?.value?.trim() || '';
    if (!raw || !resultsGrid) return;

    const ok = canConsume('searches', 1);
    if (!ok.ok) {
      toasts.show(`Daily search limit reached (${ok.limit}).`, 'error');
      openPricingModal();
      return;
    }

    const safe = sanitizeForUrl(raw, MAX_INPUT_LEN);
    if (!safe) return;

    state.lastTarget = safe;
    increment('searches', 1);

    const plan = getPlan();
    const goal = getMethodById(state.goalId) || methods[0];
    const prefixHosts = (goal.prefixes || [])
      .map((p) => resolvePrefixHost(prefixIndex, p))
      .filter(Boolean);

    const max = plan.limits?.maxResultsPerSearch ?? 8;
    const picked = prefixHosts.slice(0, max);

    const frag = document.createDocumentFragment();
    const newResults = [];

    for (const host of picked) {
      const url = buildHostUrl(host, `/${safe}`);
      const entry = prefixIndex.byHost.get(host);
      const category = entry?.category || 'web';
      newResults.push({ host, url, category });

      const card = document.createElement('article');
      card.className = 'result-card glass';
      card.innerHTML = `
        <div class="result-card__header">
          <span class="result-card__type">${escapeHtml(category)}</span>
          <span class="result-card__confidence">${escapeHtml(goal.id)}</span>
        </div>
        <h3 class="result-card__title">${escapeHtml(host)}</h3>
        <pre class="result-card__data"><code>${escapeHtml(url)}</code></pre>
        <div class="result-card__meta">
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="result-card__link">Open</a>
          <button type="button" class="result-card__copy" aria-label="Copy URL" data-url="${escapeHtml(url)}">Copy</button>
        </div>
      `;
      frag.appendChild(card);
    }

    resultsGrid.innerHTML = '';
    resultsGrid.appendChild(frag);
    state.lastResults = newResults;

    if (resultsTitle) resultsTitle.textContent = `Results for "${escapeHtml(raw.slice(0, 80))}" — ${escapeHtml(goal.name)}`;
    toasts.show(`Generated ${newResults.length} URLs`, 'success');

    resultsGrid.querySelectorAll('.result-card__copy').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const u = btn.getAttribute('data-url') || '';
        navigator.clipboard?.writeText(u)
          .then(() => toasts.show('Copied URL', 'success'))
          .catch(() => toasts.show('Copy failed', 'error'));
      });
    });
  }

  function exportLastResultsCsv() {
    if (!state.lastResults?.length) return;
    if (!hasFeature('export')) {
      toasts.show('Export is a Pro feature.', 'info');
      openPricingModal();
      return;
    }

    const rows = [['host', 'category', 'url'], ...state.lastResults.map((r) => [r.host, r.category, r.url])];
    downloadText('fb-osint-results.csv', toCsv(rows));
    toasts.show('Exported CSV', 'success');
  }

  function bulkOpenLastResults() {
    if (!state.lastResults?.length) return;
    if (!hasFeature('bulkOpen')) {
      toasts.show('Bulk open is a Pro feature.', 'info');
      openPricingModal();
      return;
    }

    const urls = state.lastResults.slice(0, 12).map((r) => r.url);
    for (const u of urls) window.open(u, '_blank', 'noopener,noreferrer');
    toasts.show(`Opened ${urls.length} tabs`, 'success');
  }

  function runAssistantAction(action) {
    if (!action) return;
    if (action.type === 'copy') {
      navigator.clipboard?.writeText(String(action.payload || ''))
        .then(() => toasts.show('Copied', 'success'))
        .catch(() => toasts.show('Copy failed', 'error'));
      return;
    }
    if (action.type === 'open') {
      window.open(String(action.payload || ''), '_blank', 'noopener,noreferrer');
      return;
    }
    if (action.type === 'runSearch') {
      if (searchInput) searchInput.value = String(action.payload || '');
      updateUrlPreview();
      executeSearch();
      return;
    }
    if (action.type === 'exportCsv') {
      exportLastResultsCsv();
      return;
    }
    if (action.type === 'openModal') {
      const p = action.payload || {};
      if (p.modal === 'pricing') openPricingModal();
      if (p.modal === 'methods') {
        const method = getMethodById(p.methodId) || methods[0];
        modal.open(`
          <h2 class="modal__title">${escapeHtml(method.name)}</h2>
          <p class="modal__subtitle">${escapeHtml(method.description || method.osintUse || '')}</p>
          <div class="modal__section">
            <h3>Steps</h3>
            <p class="modal__subtitle">${escapeHtml((method.steps || []).join(' • ') || '')}</p>
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
    if (!raw) return;

    const ok = canConsume('assistantMessages', 1);
    if (!ok.ok) {
      toasts.show(`Daily assistant limit reached (${ok.limit}).`, 'error');
      openPricingModal();
      return;
    }

    addAssistantMessage('user', raw);
    increment('assistantMessages', 1);
    if (chatInput) chatInput.value = '';

    const res = await assistant.respond(raw, { lastTarget: state.lastTarget, lastResults: state.lastResults });
    addAssistantMessage('assistant', res.text, res.actions || []);
  }

  const palette = createCommandPalette({
    onSelect: (item) => item?.run?.(),
    getItems: (query) => {
      const q = (query || '').toLowerCase();
      /** @type {Array<{id: string, label: string, icon?: string, hint?: string, run: Function}>} */
      const base = [
        { id: 'focus-search', label: 'Focus Search', icon: '⌁', hint: 'Enter', run: () => searchInput?.focus() },
        { id: 'toggle-theme', label: `Theme: ${getTheme()}`, icon: '◐', hint: 'T', run: () => { const t = toggleTheme(); toasts.show(`Theme: ${t}`, 'info'); } },
        { id: 'open-settings', label: 'Plans & Settings', icon: '⧉', hint: 'P', run: () => openPricingModal() },
        { id: 'export', label: 'Export last results (CSV)', icon: '⇩', hint: 'Pro', run: () => exportLastResultsCsv() },
        { id: 'bulk-open', label: 'Bulk open last results', icon: '↗', hint: 'Pro', run: () => bulkOpenLastResults() },
      ];

      const methodItems = methods.map((m) => ({
        id: `goal:${m.id}`,
        label: `Goal: ${m.name}`,
        icon: '◎',
        hint: m.id,
        run: () => { setGoal(m.id); toasts.show(`Goal set: ${m.name}`, 'info'); },
      }));

      const presetItems = getPresets().map((p) => ({
        id: `preset:${p.id}`,
        label: `Preset: ${p.name}`,
        icon: '⟠',
        hint: p.goalId,
        run: () => {
          setGoal(p.goalId);
          if (searchInput) searchInput.value = p.target;
          updateUrlPreview();
          toasts.show(`Applied preset: ${p.name}`, 'success');
        },
      }));

      const prefixItems = prefixIndex.all.slice(0, 200).map((p) => ({
        id: `prefix:${p.host}`,
        label: `Open ${p.host}`,
        icon: '↗',
        hint: p.category,
        run: () => window.open(buildHostUrl(p.host, state.lastTarget ? `/${state.lastTarget}` : ''), '_blank', 'noopener,noreferrer'),
      }));

      const items = [...base, ...methodItems, ...presetItems, ...prefixItems];
      return items.filter((it) => !q || it.label.toLowerCase().includes(q) || (it.hint || '').toLowerCase().includes(q)).slice(0, 24);
    },
  });

  // ----------------------------
  // INIT wiring
  // ----------------------------
  try {
    renderPrefixLibrary();
    renderComboLibrary();
    setGoal(state.goalId);

    if (searchSubmit) on(searchSubmit, 'click', executeSearch);
    if (searchInput) {
      searchInput.setAttribute('maxlength', String(MAX_INPUT_LEN));
      on(searchInput, 'keydown', (e) => {
        if (e.key === 'Enter') executeSearch();
        if (e.key === 'Escape') { searchInput.value = ''; updateUrlPreview(); searchInput.blur(); }
      });
      on(searchInput, 'input', debounce(updateUrlPreview, DEBOUNCE_MS));
    }

    if (copyBtn) on(copyBtn, 'click', copyUrlToClipboard);

    const libraryFilter = $('#library-filter');
    if (libraryFilter) {
      libraryFilter.setAttribute('maxlength', '100');
      on(libraryFilter, 'input', debounce(() => filterPrefixLibrary(libraryFilter.value), DEBOUNCE_MS));
    }

    if (chatSend) on(chatSend, 'click', () => sendChatMessage());
    if (chatInput) {
      chatInput.setAttribute('maxlength', String(MAX_INPUT_LEN));
      on(chatInput, 'keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });
    }

    const navBtns = $$('.nav__btn');
    navBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        navBtns.forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.classList.remove('nav__btn--active'); });
        btn.setAttribute('aria-pressed', 'true');
        btn.classList.add('nav__btn--active');
        const idx = Number(btn.getAttribute('data-panel') || '0');
        const panels = $$('.main-panel');
        panels.forEach((p) => p.classList.remove('main-panel--active'));
        panels[idx]?.classList.add('main-panel--active');
      });
    });

    $$('.method-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-query') || '';
        const goalId = chip.getAttribute('data-goal') || 'profile-discovery';
        setGoal(goalId);
        sendChatMessage(q);
      });
    });

    const chatToggle = $('.chat-panel__toggle');
    if (chatToggle) {
      chatToggle.addEventListener('click', () => {
        const expanded = chatToggle.getAttribute('aria-expanded') === 'true';
        chatToggle.setAttribute('aria-expanded', String(!expanded));
        const icon = chatToggle.querySelector('.chat-panel__toggle-icon');
        if (icon) icon.textContent = expanded ? '+' : '−';
        const panel = $('#chat-panel');
        if (panel) panel.classList.toggle('chat-panel--collapsed', expanded);
      });
    }

    on(themeToggle, 'click', () => {
      const t = toggleTheme();
      toasts.show(`Theme: ${t}`, 'info');
    });
    on(upgradeBtn, 'click', openPricingModal);
    on(exportCsvBtn, 'click', exportLastResultsCsv);
    on(bulkOpenBtn, 'click', bulkOpenLastResults);
    on(savePresetBtn, 'click', openSavePresetModal);

    on(document, 'keydown', (e) => {
      if (e.key.toLowerCase() === 't' && (e.target === document.body)) {
        const t = toggleTheme();
        toasts.show(`Theme: ${t}`, 'info');
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        exportLastResultsCsv();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        bulkOpenLastResults();
      }
    });

    updateUrlPreview();
    addAssistantMessage('assistant', 'System ready. Use quick goals, paste a Facebook URL, or press Ctrl/Cmd+K for commands.');
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) console.error('OSINT init error:', err);
    const main = document.getElementById('main-content');
    if (main) main.innerHTML = '<p class="error-fallback">Unable to load. Please refresh the page.</p>';
  }
}

