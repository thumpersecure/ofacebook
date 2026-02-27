import { $, on } from '../utils/dom.js';

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

  function isOpen() {
    return !container.hidden;
  }

  function close() {
    container.hidden = true;
    document.body.style.overflow = '';
    body.innerHTML = '';
  }

  function open(html) {
    body.innerHTML = html;
    container.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  on(container, 'click', (e) => {
    const t = /** @type {HTMLElement|null} */ (e.target);
    if (t && (t.getAttribute('data-modal-close') === 'true')) close();
  });
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });

  return { open, close, isOpen };
}

