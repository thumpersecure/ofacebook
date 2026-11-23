import { escapeHtml } from '../utils/security.js';

const ICONS = {
  success: '✓',
  error: '×',
  warning: '!',
  info: 'i',
};

const MAX_VISIBLE_TOASTS = 3;

export function createToasts({ containerId = 'toast-container' } = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    return {
      show: () => {},
      clear: () => {},
    };
  }

  /** @type {Array<{ dismiss: () => void }>} */
  const activeToasts = [];

  function show(message, type = 'info', { durationMs = 2600 } = {}) {
    while (activeToasts.length >= MAX_VISIBLE_TOASTS) {
      activeToasts[0]?.dismiss();
    }

    const t = type in ICONS ? type : 'info';
    const toast = document.createElement('div');
    toast.className = `toast toast--${t}`;

    if (t === 'error') {
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
    } else {
      toast.setAttribute('role', 'status');
    }

    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${escapeHtml(ICONS[t])}</span>
      <div class="toast__content">${escapeHtml(String(message ?? ''))}</div>
      <button type="button" class="toast__close" aria-label="Dismiss notification">×</button>
    `;

    let timerId = null;
    let remainingMs = durationMs;
    let startedAt = 0;
    let dismissed = false;

    const clearTimer = () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      clearTimer();
      const idx = activeToasts.indexOf(record);
      if (idx >= 0) activeToasts.splice(idx, 1);
      toast.remove();
    };

    const startTimer = () => {
      if (dismissed || remainingMs <= 0) return;
      clearTimer();
      startedAt = Date.now();
      timerId = window.setTimeout(dismiss, remainingMs);
    };

    const pauseTimer = () => {
      if (timerId === null) return;
      clearTimer();
      const elapsed = Date.now() - startedAt;
      remainingMs = Math.max(400, remainingMs - elapsed);
    };

    const record = { dismiss };

    const closeBtn = toast.querySelector('.toast__close');
    closeBtn?.addEventListener('click', dismiss);

    if (durationMs > 0) {
      toast.addEventListener('mouseenter', pauseTimer);
      toast.addEventListener('focusin', pauseTimer);
      toast.addEventListener('mouseleave', startTimer);
      toast.addEventListener('focusout', (e) => {
        if (!(e.relatedTarget instanceof Node) || !toast.contains(e.relatedTarget)) {
          startTimer();
        }
      });
    }

    activeToasts.push(record);
    container.appendChild(toast);

    if (durationMs > 0) {
      startTimer();
    }
  }

  function clear() {
    const snapshot = activeToasts.slice();
    for (const item of snapshot) {
      item.dismiss();
    }
    activeToasts.length = 0;
    container.innerHTML = '';
  }

  return { show, clear };
}
