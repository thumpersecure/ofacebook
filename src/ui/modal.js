import { on } from '../utils/dom.js';

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

export function createModal({ containerId = 'modal-container', bodyId = 'modal-body' } = {}) {
  const container = document.getElementById(containerId);
  const body = document.getElementById(bodyId);
  if (!container || !body) {
    return {
      open: () => {},
      close: () => {},
      isOpen: () => false,
    };
  }

  const content = container.querySelector('.modal__content') || container;
  /** @type {HTMLElement | null} */
  let previousFocus = null;

  function isOpen() {
    return !container.hidden;
  }

  function close() {
    if (!isOpen()) return;
    container.hidden = true;
    body.innerHTML = '';
    unlockBodyScroll();

    const toRestore = previousFocus;
    previousFocus = null;
    if (toRestore && toRestore.isConnected && typeof toRestore.focus === 'function') {
      toRestore.focus();
    }
  }

  function open(html) {
    const wasOpen = isOpen();
    if (!wasOpen) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      lockBodyScroll();
    }

    body.innerHTML = html;

    const titleEl = body.querySelector('.modal__title');
    if (titleEl) {
      titleEl.id = 'modal-title';
      container.setAttribute('aria-labelledby', 'modal-title');
    } else {
      container.removeAttribute('aria-labelledby');
    }

    container.hidden = false;

    const bodyFocusables = getFocusableElements(body);
    const closeBtn = container.querySelector('.modal__close');
    const firstTarget = bodyFocusables[0] || (closeBtn instanceof HTMLElement ? closeBtn : null);
    if (firstTarget) {
      firstTarget.focus();
    }
  }

  on(container, 'click', (e) => {
    const closeTarget = e.target instanceof Element ? e.target.closest('[data-modal-close="true"]') : null;
    if (closeTarget) close();
  });

  on(document, 'keydown', (e) => {
    if (!isOpen()) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === 'Tab') {
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
