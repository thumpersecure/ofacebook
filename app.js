/**
 * FB OSINT Terminal 2036 — Commercial-grade refactor bootstrap.
 * This file is intentionally tiny; the application lives in `src/app/init.js`.
 */
import { initApp } from './src/app/init.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
