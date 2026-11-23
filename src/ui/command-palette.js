import { on } from '../utils/dom.js';
import { escapeHtml } from '../utils/security.js';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(root) {
  if (!root) return [];
  return [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter((el) => {
    if (!(el instanceof HTMLElement)) return false;
    if (el.hidden || el.closest('[hidden]')) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

function lockBodyScroll() {
  const count = Number(document.body.getAttribute('data-overlay-locks') || '0') + 1;
  document.body.setAttribute('data-overlay-locks', String(count));
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  const count = Math.max(0, Number(document.body.getAttribute('data-overlay-locks') || '0') - 1);
  if (count === 0) {
    document.body.removeAttribute('data-overlay-locks');
    document.body.style.overflow = '';
  } else {
    document.body.setAttribute('data-overlay-locks', String(count));
  }
}

export function createCommandPalette({
  paletteId = 'command-palette',
  inputId = 'command-input',
  resultsId = 'command-results',
  onSelect,
  getItems,
  shouldOpen,
} = {}) {
  const palette = document.getElementById(paletteId);
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  const content = palette?.querySelector('.command-palette__content') || palette;

  if (input) {
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', resultsId);
    input.setAttribute('aria-expanded', 'false');
  }

  let openState = false;
  let selectedIdx = 0;
  let activeItems = [];
  /** @type {HTMLElement | null} */
  let previousFocus = null;

  function isOpen() {
    return openState;
  }

  function close() {
    if (!palette || !openState) return;
    palette.hidden = true;
    openState = false;
    selectedIdx = 0;
    input?.setAttribute('aria-expanded', 'false');
    input?.removeAttribute('aria-activedescendant');
    unlockBodyScroll();

    const toRestore = previousFocus;
    previousFocus = null;
    if (toRestore && toRestore.isConnected && typeof toRestore.focus === 'function') {
      toRestore.focus();
    }
  }

  function open() {
    if (!palette || !input || openState) return;
    if (typeof shouldOpen === 'function' && shouldOpen() === false) return;

    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockBodyScroll();

    palette.hidden = false;
    openState = true;
    input.setAttribute('aria-expanded', 'true');
    input.value = '';
    selectedIdx = 0;
    render('');
    input.focus();
  }

  function setSelected(idx, { scroll = true } = {}) {
    if (!activeItems.length) {
      selectedIdx = -1;
      input?.removeAttribute('aria-activedescendant');
      return;
    }

    const len = activeItems.length;
    selectedIdx = ((idx % len) + len) % len;

    const optionEls = results?.querySelectorAll('.command-item') || [];
    optionEls.forEach((el, i) => {
      const isSelected = i === selectedIdx;
      el.classList.toggle('command-item--selected', isSelected);
      el.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    const activeEl = optionEls[selectedIdx];
    if (activeEl) {
      input?.setAttribute('aria-activedescendant', activeEl.id);
      if (scroll && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    } else {
      input?.removeAttribute('aria-activedescendant');
    }
  }

  function render(query) {
    if (!results) return;
    const rawItems = typeof getItems === 'function' ? getItems(query) : [];
    activeItems = Array.isArray(rawItems) ? rawItems.slice(0, 24) : [];

    if (!activeItems.length) {
      results.innerHTML = '<div class="command-empty" role="status">No matching commands</div>';
      setSelected(-1, { scroll: false });
      return;
    }

    results.innerHTML = activeItems
      .map((it, i) => {
        const hint = it.hint
          ? `<span class="command-item__hint">${escapeHtml(it.hint)}</span>`
          : '<span class="command-item__hint"></span>';
        const isSelected = i === 0;
        return `
          <div class="command-item${isSelected ? ' command-item--selected' : ''}" id="cmd-opt-${i}" role="option" aria-selected="${isSelected ? 'true' : 'false'}" data-idx="${i}" data-id="${escapeHtml(String(it.id))}">
            <span class="command-item__icon" aria-hidden="true">${escapeHtml(it.icon || '⟡')}</span>
            <span class="command-item__text">${escapeHtml(it.label || '')}</span>
            ${hint}
          </div>
        `;
      })
      .join('');

    setSelected(0, { scroll: false });
  }

  function submitSelected() {
    const item = activeItems[selectedIdx];
    if (!item) return;
    close();
    if (typeof onSelect === 'function') onSelect(item);
  }

  on(palette, 'click', (e) => {
    const closeTarget = e.target instanceof Element ? e.target.closest('[data-command-close="true"]') : null;
    if (closeTarget) {
      close();
      return;
    }

    const el = e.target instanceof Element ? e.target.closest('.command-item') : null;
    if (!el) return;

    const idxAttr = el.getAttribute('data-idx');
    let idx = idxAttr !== null ? Number(idxAttr) : -1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= activeItems.length) {
      const id = el.getAttribute('data-id') || '';
      idx = activeItems.findIndex((x) => String(x.id) === id);
    }
    if (idx >= 0) {
      setSelected(idx, { scroll: false });
      submitSelected();
    }
  });

  on(results, 'mouseover', (e) => {
    const el = e.target instanceof Element ? e.target.closest('.command-item') : null;
    if (!el) return;
    const idx = Number(el.getAttribute('data-idx'));
    if (Number.isInteger(idx) && idx >= 0 && idx < activeItems.length && idx !== selectedIdx) {
      setSelected(idx, { scroll: false });
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
      return;
    }
    if (e.key === 'Home' && activeItems.length) {
      e.preventDefault();
      setSelected(0);
      return;
    }
    if (e.key === 'End' && activeItems.length) {
      e.preventDefault();
      setSelected(activeItems.length - 1);
    }
  });

  on(document, 'keydown', (e) => {
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'k') {
      e.preventDefault();
      if (isOpen()) close();
      else open();
      return;
    }
    if (!isOpen()) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === 'Tab' && content) {
      const focusables = getFocusableElements(content);
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !content.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !content.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  return { open, close, isOpen };
}
