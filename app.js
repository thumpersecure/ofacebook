/**
 * Facebook OSINT Tool - Client-side application
 *
 * SECURITY CONSIDERATIONS:
 * - All processing is client-side; no sensitive data is stored or transmitted
 * - User input is escaped before display to prevent XSS
 * - URLs are built with sanitized parameters to prevent javascript: or data: injection
 * - Uses textContent/DOM APIs instead of innerHTML for user-controlled content
 * - No eval(), new Function(), or other dynamic code execution
 */

(function () {
  'use strict';

  /**
   * Escapes HTML special characters to prevent XSS when displaying user input.
   * SECURITY: Always use this before inserting user-controlled data into the DOM.
   * @param {string} str - Raw user input
   * @returns {string} - Safe string for display
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Sanitizes a string for use in URL path/query - allows only alphanumeric,
   * dots, underscores, hyphens. Prevents javascript:, data:, and other schemes.
   * SECURITY: Use when building URLs from user input.
   * @param {string} str - Raw user input
   * @returns {string} - Safe string for URL
   */
  function sanitizeForUrl(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[^a-zA-Z0-9._-]/g, '');
  }

  /**
   * Builds a safe Facebook profile URL. Sanitizes input to prevent URL injection.
   * @param {string} identifier - Username or numeric ID
   * @returns {string} - Safe facebook.com URL
   */
  function buildProfileUrl(identifier) {
    const safe = sanitizeForUrl(identifier.trim());
    if (!safe) return '';
    return 'https://www.facebook.com/' + encodeURIComponent(safe);
  }

  /**
   * Safely creates a text node or element with escaped content.
   * SECURITY: Prefers textContent over innerHTML for user data.
   */
  function setElementText(el, text) {
    if (!el) return;
    el.textContent = escapeHtml(String(text));
  }

  // DOM elements
  const searchInput = document.getElementById('search-input');
  const searchSubmit = document.querySelector('.search-box__submit');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.querySelector('.chat-panel__send');
  const chatMessages = document.getElementById('chat-messages');
  const resultsGrid = document.querySelector('.results-grid');

  /**
   * Renders a result card with sanitized data.
   * SECURITY: All user-controlled values passed through escapeHtml.
   */
  function renderResultCard(data) {
    const article = document.createElement('article');
    article.className = 'result-card glass';
    article.innerHTML = [
      '<div class="result-card__header">',
      '<span class="result-card__type">' + escapeHtml(data.type || 'Match') + '</span>',
      '<span class="result-card__confidence">' + escapeHtml(String(data.confidence || '--')) + '%</span>',
      '</div>',
      '<h3 class="result-card__title"></h3>',
      '<pre class="result-card__data"><code></code></pre>',
      '<div class="result-card__meta"><span></span></div>'
    ].join('');

    setElementText(article.querySelector('.result-card__title'), data.title);
    setElementText(article.querySelector('code'), data.data || '');
    setElementText(article.querySelector('.result-card__meta span'), data.meta || '');

    return article;
  }

  /**
   * Executes search - builds URLs and displays results.
   * SECURITY: Input sanitized before URL construction and display.
   */
  function executeSearch() {
    const raw = searchInput ? searchInput.value : '';
    const sanitized = raw.trim();
    if (!sanitized || !resultsGrid) return;

    const url = buildProfileUrl(sanitized);
    if (!url) return;

    // Clear previous results and add new (sanitized) result
    resultsGrid.innerHTML = '';
    const card = renderResultCard({
      type: 'Profile',
      confidence: '--',
      title: sanitized,
      data: 'URL: ' + url + '\nMethod: Prefix lookup',
      meta: 'Client-side only - no data stored'
    });
    resultsGrid.appendChild(card);

    // Open in new tab - navigation is safe (user-initiated)
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Adds a chat message. SECURITY: User input escaped before display.
   */
  function addChatMessage(role, text) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = 'chat-message chat-message--' + (role === 'user' ? 'user' : 'assistant');
    const roleSpan = document.createElement('span');
    roleSpan.className = 'chat-message__role';
    setElementText(roleSpan, role === 'user' ? 'You' : 'Assistant');
    const p = document.createElement('p');
    p.className = 'chat-message__text';
    setElementText(p, text);
    div.appendChild(roleSpan);
    div.appendChild(p);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendChatMessage() {
    const raw = chatInput ? chatInput.value : '';
    const sanitized = raw.trim();
    if (!sanitized) return;

    addChatMessage('user', sanitized);
    chatInput.value = '';

    // Simple client-side response - no external API, no storage
    addChatMessage('assistant', 'Enter a search query above to look up a profile. All processing is client-side.');
  }

  // Event listeners
  if (searchSubmit) searchSubmit.addEventListener('click', executeSearch);
  if (searchInput) searchInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') executeSearch(); });
  if (chatSend) chatSend.addEventListener('click', sendChatMessage);
  if (chatInput) chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChatMessage(); });

  // Nav buttons (UI only)
  document.querySelectorAll('.nav__btn').forEach(function (btn, i) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.nav__btn').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.classList.remove('nav__btn--active'); });
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('nav__btn--active');
    });
  });

  // Chat panel toggle
  const chatToggle = document.querySelector('.chat-panel__toggle');
  if (chatToggle) {
    chatToggle.addEventListener('click', function () {
      const expanded = chatToggle.getAttribute('aria-expanded') === 'true';
      chatToggle.setAttribute('aria-expanded', !expanded);
      chatToggle.querySelector('.chat-panel__toggle-icon').textContent = expanded ? '+' : '−';
      document.getElementById('chat-panel').classList.toggle('chat-panel--collapsed', expanded);
    });
  }
})();
