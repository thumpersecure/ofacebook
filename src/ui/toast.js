import { escapeHtml } from '../utils/security.js';

const ICONS = {
  success: '✓',
  error: '×',
  info: 'i',
};

export function createToasts({ containerId = 'toast-container' } = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    return {
      show: () => {},
      clear: () => {},
    };
  }

  function show(message, type = 'info', { durationMs = 2600 } = {}) {
    const toast = document.createElement('div');
    const t = type in ICONS ? type : 'info';
    toast.className = `toast toast--${t}`;
    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${escapeHtml(ICONS[t])}</span>
      <div class="toast__content">${escapeHtml(String(message ?? ''))}</div>
      <button type="button" class="toast__close" aria-label="Dismiss">×</button>
    `;

    const remove = () => {
      toast.remove();
    };
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn?.addEventListener('click', remove);

    container.appendChild(toast);
    if (durationMs > 0) window.setTimeout(remove, durationMs);
  }

  function clear() {
    container.innerHTML = '';
  }

  return { show, clear };
}

