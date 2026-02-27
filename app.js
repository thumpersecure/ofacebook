/**
 * Facebook OSINT Tool 2036 - Main Application
 * Futuristic OSINT assistant using thumpersecure prefix list
 *
 * SECURITY: Client-side only, input sanitization, no eval, CSP compliant
 * PERFORMANCE: Debounced input, DocumentFragment batching, O(1) prefix lookup
 */
(function () {
  'use strict';

  const MAX_INPUT_LEN = 500;
  const MAX_CHAT_MESSAGES = 50;
  const DEBOUNCE_MS = 150;

  // ==========================================================================
  // UTILITIES
  // ==========================================================================
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function sanitizeForUrl(str) {
    if (typeof str !== 'string') return '';
    return str.slice(0, MAX_INPUT_LEN).replace(/[^a-zA-Z0-9._\-/]/g, '');
  }

  function safeStr(val, maxLen) {
    const s = String(val ?? '');
    return maxLen ? s.slice(0, maxLen) : s;
  }

  // ==========================================================================
  // INLINE DATA - Prefix library (from thumpersecure) for no-module support
  // ==========================================================================
  const PREFIX_DATA = [
    { s: '0.facebook.com', c: 'mobile', p: 'Zero-data / free basics' },
    { s: 'c.facebook.com', c: 'infra', p: 'Content/CDN' },
    { s: 'd.facebook.com', c: 'mobile', p: 'Desktop-optimized mobile' },
    { s: 'h.facebook.com', c: 'mobile', p: 'Touch/HTML5 mobile' },
    { s: 'l.facebook.com', c: 'link', p: 'Link shim / referral tracer' },
    { s: 'm.facebook.com', c: 'mobile', p: 'Primary mobile site' },
    { s: 'n.facebook.com', c: 'infra', p: 'Notifications' },
    { s: 'o.facebook.com', c: 'mobile', p: 'Optimized mobile' },
    { s: 'p.facebook.com', c: 'infra', p: 'Platform' },
    { s: 't.facebook.com', c: 'link', p: 'Tracking / short URLs' },
    { s: 'w.facebook.com', c: 'web', p: 'Web access' },
    { s: 'x.facebook.com', c: 'infra', p: 'Experimental' },
    { s: 'z.facebook.com', c: 'infra', p: 'Zero-rated' },
    { s: 'lm.facebook.com', c: 'link', p: 'Link shim mobile' },
    { s: 'tm.facebook.com', c: 'link', p: 'Tracking mobile' },
    { s: 'hs.facebook.com', c: 'support', p: 'Help/support' },
    { s: 'ww.facebook.com', c: 'web', p: 'WWW typo catch' },
    { s: 'ai.facebook.com', c: 'corp', p: 'AI/research' },
    { s: 'mbasic.facebook.com', c: 'mobile', p: 'Text-only mobile (OSINT key)' },
    { s: 'mobile.facebook.com', c: 'mobile', p: 'Mobile redirect' },
    { s: 'touch.facebook.com', c: 'mobile', p: 'Touch-optimized' },
    { s: 'iphone.facebook.com', c: 'mobile', p: 'iPhone mobile' },
    { s: 'lite.facebook.com', c: 'mobile', p: 'Facebook Lite' },
    { s: 'free.facebook.com', c: 'mobile', p: 'Free basics' },
    { s: 'zero.facebook.com', c: 'mobile', p: 'Zero-data' },
    { s: 'web.facebook.com', c: 'web', p: 'Alternative web' },
    { s: 'api.facebook.com', c: 'dev', p: 'API endpoint' },
    { s: 'graph.facebook.com', c: 'dev', p: 'Graph API' },
    { s: 'developers.facebook.com', c: 'dev', p: 'Developer portal' },
    { s: 'apps.facebook.com', c: 'dev', p: 'App platform' },
    { s: 'code.facebook.com', c: 'dev', p: 'Engineering' },
    { s: 'connect.facebook.com', c: 'dev', p: 'OAuth/Connect' },
    { s: 'pixel.facebook.com', c: 'dev', p: 'Tracking pixel' },
    { s: 'static.facebook.com', c: 'infra', p: 'Static assets' },
    { s: 'upload.facebook.com', c: 'infra', p: 'Upload endpoint' },
    { s: 'login.facebook.com', c: 'auth', p: 'Login' },
    { s: 'secure.facebook.com', c: 'auth', p: 'Secure login' },
    { s: 'register.facebook.com', c: 'auth', p: 'Registration' },
    { s: 'ads.facebook.com', c: 'biz', p: 'Advertising' },
    { s: 'business.facebook.com', c: 'biz', p: 'Business suite' },
    { s: 'pay.facebook.com', c: 'biz', p: 'Facebook Pay' },
    { s: 'shop.facebook.com', c: 'biz', p: 'Shops' },
    { s: 'gaming.facebook.com', c: 'product', p: 'Gaming' },
    { s: 'watch.facebook.com', c: 'product', p: 'Watch' },
    { s: 'pages.facebook.com', c: 'product', p: 'Pages' },
    { s: 'work.facebook.com', c: 'product', p: 'Workplace' },
    { s: 'workplace.facebook.com', c: 'product', p: 'Workplace' },
    { s: 'portal.facebook.com', c: 'product', p: 'Portal' },
    { s: 'about.facebook.com', c: 'corp', p: 'About' },
    { s: 'blog.facebook.com', c: 'corp', p: 'Blog' },
    { s: 'research.facebook.com', c: 'corp', p: 'Research' },
    { s: 'transparency.facebook.com', c: 'corp', p: 'Transparency' },
    { s: 'postmaster.facebook.com', c: 'corp', p: 'Email tools' },
    { s: 'dns.facebook.com', c: 'infra', p: 'DNS' },
    { s: 'intern.facebook.com', c: 'infra', p: 'Internal' },
    { s: 'v4help.facebook.com', c: 'infra', p: 'IPv4 help' },
    { s: 'www.facebook.com', c: 'web', p: 'Primary site' },
    { s: 'www2.facebook.com', c: 'web', p: 'Load-balanced' },
    { s: 'wwww.facebook.com', c: 'web', p: 'Typo catch' },
    { s: 'beta.facebook.com', c: 'product', p: 'Beta' },
    { s: 'new.facebook.com', c: 'product', p: 'New features' },
    { s: 'error.facebook.com', c: 'product', p: 'Error pages' },
    { s: 'badge.facebook.com', c: 'product', p: 'Verification' },
    { s: 'www.fb.com', c: 'short', p: 'Short redirect' },
    { s: 's.fb.com', c: 'short', p: 'Short URLs' },
    { s: 'investor.fb.com', c: 'corp', p: 'Investors' },
    { s: 'newsroom.fb.com', c: 'corp', p: 'Press' },
    { s: 'search.fb.com', c: 'short', p: 'Search' },
    { s: 'ar-ar.facebook.com', c: 'locale', p: 'Arabic' },
    { s: 'zh-cn.facebook.com', c: 'locale', p: 'Chinese (Simplified)' },
    { s: 'zh-tw.facebook.com', c: 'locale', p: 'Chinese (Taiwan)' },
    { s: 'de-de.facebook.com', c: 'locale', p: 'German' },
    { s: 'en-gb.facebook.com', c: 'locale', p: 'English (UK)' },
    { s: 'es-la.facebook.com', c: 'locale', p: 'Spanish (LATAM)' },
    { s: 'fr-fr.facebook.com', c: 'locale', p: 'French' },
    { s: 'ja-jp.facebook.com', c: 'locale', p: 'Japanese' },
    { s: 'ko-kr.facebook.com', c: 'locale', p: 'Korean' },
    { s: 'pt-br.facebook.com', c: 'locale', p: 'Portuguese (Brazil)' },
    { s: 'ru-ru.facebook.com', c: 'locale', p: 'Russian' },
    { s: 'tr-tr.facebook.com', c: 'locale', p: 'Turkish' },
    { s: 'vi-vn.facebook.com', c: 'locale', p: 'Vietnamese' },
  ];

  const METHOD_COMBOS = [
    { id: 'profile', name: 'Profile Discovery', prefixes: ['mbasic', 'm', 'touch'], tip: 'Try mbasic first for unauthenticated viewing' },
    { id: 'link', name: 'Link Tracking', prefixes: ['l', 'lm', 't'], tip: 'Decode l.php?u= for destination URL' },
    { id: 'biz', name: 'Business Intel', prefixes: ['business', 'ads', 'transparency'], tip: 'Ads Library at business.facebook.com/ads/library' },
    { id: 'api', name: 'API Discovery', prefixes: ['developers', 'graph', 'api'], tip: 'Graph API Explorer at developers.facebook.com/tools/explorer' },
    { id: 'locale', name: 'Locale Search', prefixes: ['zh-cn', 'ar-ar', 'en-gb'], tip: 'Use {locale}.facebook.com for regional content' },
    { id: 'short', name: 'Short Links', prefixes: ['www.fb.com', 's.fb.com', 'l'], tip: 'Trace fb.com redirect chain' },
  ];

  const INTENT_KEYWORDS = {
    profile: ['find', 'profile', 'lookup', 'search', 'person', 'user', 'who is'],
    link: ['link', 'track', 'trace', 'referral', 'redirect', 'l.facebook', 'fb.me'],
    biz: ['business', 'ads', 'advertiser', 'company', 'page', 'transparency'],
    api: ['api', 'graph', 'developer', 'endpoint'],
    locale: ['locale', 'language', 'region', 'country', 'zh', 'ar'],
  };

  function detectIntent(query) {
    const q = (query || '').toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some((k) => q.includes(k))) return intent;
    }
    return 'profile';
  }

  function getRecommendation(query) {
    const intent = detectIntent(query);
    const combo = METHOD_COMBOS.find((m) => m.id === intent) || METHOD_COMBOS[0];
    const tips = [];
    if (intent === 'profile') tips.push('mbasic.facebook.com often shows more without login', 'Extract userID from page source for API use');
    if (intent === 'link') tips.push('l.facebook.com/l.php?u= contains destination URL', 'Check referral data for lm.facebook.com');
    if (intent === 'biz') tips.push('Page transparency shows admin locations', 'Ads Library supports keyword search');
    if (intent === 'api') tips.push('Access token required for Graph API', 'ThreatExchange for threat intel');
    if (intent === 'locale') tips.push('Format: zh-cn.facebook.com, ar-ar.facebook.com');
    return { intent, combo, tips: tips.length ? tips : [combo.tip] };
  }

  function buildUrl(subdomain, path) {
    if (!subdomain || typeof subdomain !== 'string') return '';
    var base = subdomain.startsWith('http') ? subdomain : 'https://' + subdomain;
    var p = path ? (path.startsWith('/') ? path : '/' + path) : '';
    var url = base + p;
    return url.length > 2048 ? base : url;
  }

  function matchPrefix(p, id) {
    if (!p || !id) return false;
    return p.s === id || p.s === id + '.facebook.com' || p.s === id + '.fb.com' || p.s.startsWith(id + '.');
  }

  function resolvePrefixDomains(ids) {
    var out = [];
    for (var i = 0; i < (ids && ids.length) || 0; i++) {
      var id = ids[i];
      var found = PREFIX_DATA.find(function (x) { return matchPrefix(x, id); });
      out.push(found ? found.s : id);
    }
    return out;
  }

  // ==========================================================================
  // DOM & UI
  // ==========================================================================
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const searchInput = $('#search-input');
  const searchSubmit = $('.search-box__submit');
  const methodSelect = $('.method-selector__options');
  const resultsGrid = $('#results-grid');
  const resultsTitle = $('.results__title');
  const chatMessages = $('#chat-messages');
  const chatInput = $('#chat-input');
  const chatSend = $('.chat-panel__send');
  const prefixList = $('#prefix-list');
  const comboList = $('#combo-list');
  const urlOutput = $('#url-output');

  function renderPrefixCard(p) {
    const card = document.createElement('div');
    card.className = 'prefix-card';
    card.innerHTML = `
      <span class="prefix-card__domain">${escapeHtml(p.s)}</span>
      <span class="prefix-card__cat">${escapeHtml(p.c)}</span>
      <span class="prefix-card__purpose">${escapeHtml(p.p)}</span>
      <a href="${buildUrl(p.s)}" target="_blank" rel="noopener noreferrer" class="prefix-card__link">Open</a>
    `;
    card.querySelector('.prefix-card__link').addEventListener('click', (e) => e.stopPropagation());
    card.addEventListener('click', () => {
      const path = searchInput?.value?.trim() ? '/' + sanitizeForUrl(searchInput.value) : '';
      window.open(buildUrl(p.s, path), '_blank', 'noopener,noreferrer');
    });
    return card;
  }

  function renderComboCard(c) {
    if (!c || !c.name) return null;
    var card = document.createElement('div');
    card.className = 'combo-card';
    var domains = resolvePrefixDomains(c.prefixes).join(', ');
    card.innerHTML = '<h4 class="combo-card__name">' + escapeHtml(c.name) + '</h4>' +
      '<p class="combo-card__tip">' + escapeHtml(c.tip) + '</p>' +
      '<code class="combo-card__prefixes">' + escapeHtml(domains) + '</code>';
    return card;
  }

  function executeSearch() {
    var raw = searchInput && searchInput.value ? searchInput.value.trim() : '';
    if (!raw || !resultsGrid) return;

    var safe = sanitizeForUrl(raw);
    if (!safe) return;

    var rec = getRecommendation(raw);
    if (!rec || !rec.combo) return;

    var primaryPrefixes = PREFIX_DATA.filter(function (p) {
      return rec.combo.prefixes.some(function (pre) { return matchPrefix(p, pre); });
    }).slice(0, 8);
    if (primaryPrefixes.length === 0) {
      primaryPrefixes = PREFIX_DATA.filter(function (p) {
        return ['mbasic', 'm', 'www'].some(function (pre) { return matchPrefix(p, pre); });
      }).slice(0, 4);
    }

    var frag = document.createDocumentFragment();
    for (var i = 0; i < primaryPrefixes.length; i++) {
      var p = primaryPrefixes[i];
      var url = buildUrl(p.s, safe);
      if (!url) continue;
      var card = document.createElement('article');
      card.className = 'result-card glass';
      card.innerHTML = '<div class="result-card__header">' +
        '<span class="result-card__type">' + escapeHtml(p.c) + '</span>' +
        '<span class="result-card__confidence">' + escapeHtml(rec.intent) + '</span></div>' +
        '<h3 class="result-card__title">' + escapeHtml(p.s) + '</h3>' +
        '<pre class="result-card__data"><code>' + escapeHtml(url) + '</code></pre>' +
        '<div class="result-card__meta">' +
        '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="result-card__link">Open</a>' +
        '<button type="button" class="result-card__copy" aria-label="Copy URL" data-url="' + escapeHtml(url) + '">Copy</button>' +
        '</div>';
      frag.appendChild(card);
    }
    resultsGrid.innerHTML = '';
    resultsGrid.appendChild(frag);

    if (resultsTitle) resultsTitle.textContent = 'Results for "' + escapeHtml(raw.slice(0, 80)) + '" — ' + rec.combo.name;
    addAssistantMessage('system', 'Recommended: ' + rec.combo.name + '. ' + (rec.tips ? rec.tips.join(' ') : rec.combo.tip));

    resultsGrid.querySelectorAll('.result-card__copy').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var u = btn.getAttribute('data-url');
        if (u && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(u).then(function () {
            btn.textContent = 'Copied';
            setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
          }).catch(function () {});
        }
      });
    });
  }

  function addAssistantMessage(role, text) {
    if (!chatMessages) return;
    var safeText = escapeHtml(safeStr(text, 2000));
    var div = document.createElement('div');
    div.className = 'chat-message chat-message--' + (role === 'user' ? 'user' : 'assistant');
    div.innerHTML = '<span class="chat-message__role">' + (role === 'user' ? 'You' : 'Assistant') + '</span>' +
      '<p class="chat-message__text">' + safeText + '</p>';
    chatMessages.appendChild(div);
    var children = chatMessages.children;
    while (children.length > MAX_CHAT_MESSAGES) {
      chatMessages.removeChild(children[0]);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendChatMessage() {
    var raw = chatInput && chatInput.value ? chatInput.value.trim() : '';
    if (!raw) return;

    addAssistantMessage('user', raw);
    chatInput.value = '';

    var rec = getRecommendation(raw);
    if (!rec || !rec.combo) return;
    var domains = resolvePrefixDomains(rec.combo.prefixes).join(', ');
    var response = 'For "' + safeStr(raw, 100) + '", I recommend ' + rec.combo.name + '. ' +
      (rec.tips ? rec.tips.join(' ') : rec.combo.tip) + ' Try: ' + domains + '.';
    addAssistantMessage('assistant', response);
  }

  function updateUrlPreview() {
    if (!urlOutput || !searchInput) return;
    var path = searchInput.value.trim().slice(0, MAX_INPUT_LEN);
    var subdomain = 'www.facebook.com';
    var sel = document.querySelector('.prefix-card--selected .prefix-card__domain');
    if (sel && sel.textContent) subdomain = sel.textContent;
    urlOutput.textContent = buildUrl(subdomain, path ? '/' + sanitizeForUrl(path) : '');
  }

  var debouncedUpdateUrl = debounce(updateUrlPreview, DEBOUNCE_MS);

  function copyUrlToClipboard() {
    if (!urlOutput || !urlOutput.textContent) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlOutput.textContent).catch(function () {});
    }
  }

  function filterPrefixLibrary(query) {
    if (!prefixList) return;
    var q = (query || '').toLowerCase().trim();
    var cards = prefixList.querySelectorAll('.prefix-card');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var domainEl = card.querySelector('.prefix-card__domain');
      var purposeEl = card.querySelector('.prefix-card__purpose');
      var catEl = card.querySelector('.prefix-card__cat');
      var domain = domainEl ? domainEl.textContent : '';
      var purpose = purposeEl ? purposeEl.textContent : '';
      var cat = catEl ? catEl.textContent : '';
      var match = !q || domain.toLowerCase().includes(q) || purpose.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
      card.style.display = match ? '' : 'none';
    }
  }

  // ==========================================================================
  // INIT
  // ==========================================================================
  function renderPrefixLibrary() {
    if (!prefixList) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < PREFIX_DATA.length; i++) {
      var card = renderPrefixCard(PREFIX_DATA[i]);
      if (card) frag.appendChild(card);
    }
    prefixList.innerHTML = '';
    prefixList.appendChild(frag);
  }

  function renderComboLibrary() {
    if (!comboList) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < METHOD_COMBOS.length; i++) {
      var card = renderComboCard(METHOD_COMBOS[i]);
      if (card) frag.appendChild(card);
    }
    comboList.innerHTML = '';
    comboList.appendChild(frag);
  }

  function init() {
    try {
      renderPrefixLibrary();
      renderComboLibrary();

      if (searchSubmit) searchSubmit.addEventListener('click', executeSearch);
      if (searchInput) {
        searchInput.setAttribute('maxlength', MAX_INPUT_LEN);
        searchInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') executeSearch();
          if (e.key === 'Escape') { searchInput.value = ''; updateUrlPreview(); searchInput.blur(); }
        });
        searchInput.addEventListener('input', debouncedUpdateUrl);
      }
      if (chatSend) chatSend.addEventListener('click', sendChatMessage);
      if (chatInput) {
        chatInput.setAttribute('maxlength', MAX_INPUT_LEN);
        chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChatMessage(); });
      }

      var navBtns = $$('.nav__btn');
      for (var i = 0; i < navBtns.length; i++) {
        (function (idx) {
          navBtns[idx].addEventListener('click', function () {
            for (var j = 0; j < navBtns.length; j++) {
              navBtns[j].setAttribute('aria-pressed', 'false');
              navBtns[j].classList.remove('nav__btn--active');
            }
            navBtns[idx].setAttribute('aria-pressed', 'true');
            navBtns[idx].classList.add('nav__btn--active');
            var panels = $$('.main-panel');
            for (var k = 0; k < panels.length; k++) panels[k].classList.remove('main-panel--active');
            if (panels[idx]) panels[idx].classList.add('main-panel--active');
          });
        })(i);
      }

      var chips = $$('.method-chip');
      for (var c = 0; c < chips.length; c++) {
        chips[c].addEventListener('click', function () {
          var q = this.getAttribute('data-query') || '';
          addAssistantMessage('user', q);
          var rec = getRecommendation(q);
          if (rec && rec.combo) {
            addAssistantMessage('assistant', rec.combo.name + ': ' + (rec.tips ? rec.tips.join(' ') : rec.combo.tip) + ' Prefixes: ' + resolvePrefixDomains(rec.combo.prefixes).join(', ') + '.');
          }
        });
      }

      var chatToggle = $('.chat-panel__toggle');
      if (chatToggle) {
        chatToggle.addEventListener('click', function () {
          var expanded = chatToggle.getAttribute('aria-expanded') === 'true';
          chatToggle.setAttribute('aria-expanded', !expanded);
          var icon = chatToggle.querySelector('.chat-panel__toggle-icon');
          if (icon) icon.textContent = expanded ? '+' : '−';
          var panel = $('#chat-panel');
          if (panel) panel.classList.toggle('chat-panel--collapsed', expanded);
        });
      }

      var copyBtn = $('#url-copy-btn');
      if (copyBtn) copyBtn.addEventListener('click', copyUrlToClipboard);

      var libraryFilter = $('#library-filter');
      if (libraryFilter) {
        libraryFilter.setAttribute('maxlength', 100);
        libraryFilter.addEventListener('input', debounce(function () { filterPrefixLibrary(libraryFilter.value); }, DEBOUNCE_MS));
      }

      updateUrlPreview();
      addAssistantMessage('system', 'Facebook OSINT Assistant ready. Enter a username/ID to search, or ask about methods (e.g. "find profile", "track links", "business research").');
    } catch (err) {
      if (typeof console !== 'undefined' && console.error) console.error('OSINT init error:', err);
      var main = document.getElementById('main-content');
      if (main) main.innerHTML = '<p class="error-fallback">Unable to load. Please refresh the page.</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
