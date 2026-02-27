import { $, on } from '../utils/dom.js';
import { escapeHtml } from '../utils/security.js';

export function createCommandPalette({
  paletteId = 'command-palette',
  inputId = 'command-input',
  resultsId = 'command-results',
  onSelect,
  getItems,
} = {}) {
  const palette = document.getElementById(paletteId);
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);

  let openState = false;
  let selectedIdx = 0;
  let activeItems = [];

  function isOpen() {
    return openState;
  }

  function close() {
    if (!palette) return;
    palette.hidden = true;
    openState = false;
    selectedIdx = 0;
  }

  function open() {
    if (!palette || !input) return;
    palette.hidden = false;
    openState = true;
    input.value = '';
    selectedIdx = 0;
    render('');
    input.focus();
  }

  function setSelected(idx) {
    selectedIdx = Math.max(0, Math.min(idx, activeItems.length - 1));
    results?.querySelectorAll('.command-item').forEach((el, i) => {
      el.classList.toggle('command-item--selected', i === selectedIdx);
    });
  }

  function render(query) {
    if (!results) return;
    const items = typeof getItems === 'function' ? getItems(query) : [];
    activeItems = items;
    results.innerHTML = items
      .slice(0, 24)
      .map((it) => {
        const hint = it.hint ? `<span class="command-item__hint">${escapeHtml(it.hint)}</span>` : '<span class="command-item__hint"></span>';
        return `
          <div class="command-item" role="option" data-id="${escapeHtml(String(it.id))}">
            <span class="command-item__icon" aria-hidden="true">${escapeHtml(it.icon || '⟡')}</span>
            <span class="command-item__text">${escapeHtml(it.label || '')}</span>
            ${hint}
          </div>
        `;
      })
      .join('');

    setSelected(0);
  }

  function submitSelected() {
    const item = activeItems[selectedIdx];
    if (!item) return;
    if (typeof onSelect === 'function') onSelect(item);
    close();
  }

  on(palette, 'click', (e) => {
    const el = /** @type {HTMLElement|null} */ (e.target instanceof Element ? e.target.closest('.command-item') : null);
    const backdrop = /** @type {HTMLElement|null} */ (e.target);
    if (backdrop && backdrop.getAttribute('data-command-close') === 'true') close();
    if (!el) return;
    const id = el.getAttribute('data-id') || '';
    const idx = activeItems.findIndex((x) => String(x.id) === id);
    if (idx >= 0) {
      setSelected(idx);
      submitSelected();
    }
  });

  on(input, 'input', () => render(input.value));
  on(input, 'keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSelected();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(selectedIdx + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(selectedIdx - 1);
    }
  });

  on(document, 'keydown', (e) => {
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'k') {
      e.preventDefault();
      if (isOpen()) close();
      else open();
    }
    if (k === 'escape' && isOpen()) close();
  });

  return { open, close, isOpen };
}

