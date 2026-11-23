/**
 * FB OSINT Terminal 2036 — Commercial-grade refactor bootstrap.
 * This file is intentionally tiny; the application lives in `src/app/init.js`.
 */
import { initApp } from './src/app/init.js';

let initialized = false;

function bootstrap() {
  if (initialized) return;
  initialized = true;

  const googleFonts = document.getElementById('google-fonts');
  if (googleFonts && googleFonts.media !== 'all') {
    googleFonts.media = 'all';
  }

  initApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
