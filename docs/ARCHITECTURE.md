# Architecture

This project is a **static, client-side** web application (designed for GitHub Pages) that uses **ES modules** and a strict Content Security Policy.

## Top-level flow

1. `index.html` loads `app.js` as a module.
2. `app.js` calls `initApp()` from `src/app/init.js`.
3. `initApp()`:
   - renders prefix library + method combinations
   - wires up search, assistant chat, keyboard shortcuts
   - enables UI subsystems (toasts, modal, command palette, theme)
   - provides an optional settings UI for assistant providers + presets

## Key modules

### UI

- `src/ui/toast.js`: lightweight toast notifications
- `src/ui/modal.js`: modal open/close + escape/backdrop behavior
- `src/ui/command-palette.js`: Ctrl/Cmd+K palette for actions/goals/prefix quick-open
- `src/ui/theme.js`: light/dark mode persisted to `localStorage`

### Assistant

- `src/assistant/assistant.js`:
  - **local** provider: fast, deterministic workflow recommendations + link shim decoding
  - **optional** provider adapters: OpenAI / Anthropic (BYO key, stored locally)
  - emits **actions** (open/copy/export/run search) that the UI renders as buttons

### Settings

- `src/app/settings.js`: assistant provider selection + optional BYO keys (stored locally)
- `src/app/presets.js`: saved target + goal presets (stored locally)

### Domain data

- `src/prefix-library.js`: thumpersecure-derived prefix list + method combinations
- `src/domain/prefixes.js`: indexing + token→host resolution helpers
- `src/domain/methods.js`: method combination accessor helpers

## Storage

All persistence is browser-local:

- `localStorage` keys:
  - `osint.theme`
  - `osint.assistant.provider`
  - `osint.openai.key` / `osint.anthropic.key`

No data is sent anywhere unless you explicitly enable a remote assistant provider and supply your own key.

