# FB OSINT Terminal 2036

An immersive, client-side Facebook OSINT workflow builder that turns a target path (username / numeric ID / route) into **high-signal URL variants** across the thumpersecure prefix universe — with a powerful in-app assistant, command palette, and commercial-grade plan gating scaffolding.

- **Live demo**: `https://thumpersecure.github.io/ofacebook/`
- **Prefix source**: `thumpersecure/thumpersecure` (`facebook-prefix-list.md`)

## What’s new in this refactor

- **Modern modular architecture**: `app.js` is now a thin bootstrap; core logic lives in `src/app/init.js`.
- **Command Palette**: press **Ctrl/Cmd+K** for actions, goals, and quick-open.
- **Plans & feature gating (client-side demo)**: limits, Pro feature switches, upgrade modal.
- **Assistant upgrade**:
  - multi-turn context (remembers last target + last results)
  - actionable buttons (copy/open/run search/export)
  - optional BYO key providers (OpenAI / Anthropic) with strict CSP `connect-src`
- **Theme toggle**: light/dark stored in `localStorage`.

## Quick start (local)

Because this is pure static HTML + ESM, you just need a static file server (opening the file directly may break module imports).

```bash
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

## Usage

- **Search**: enter a username/ID/path → click **Execute**
- **Goals**: use the quick chips (Profile / Links / Business / API / Locale) to set the active workflow goal
- **Assistant**: paste a Facebook URL (e.g. a Link Shim URL) or ask for a workflow; click the action buttons in responses

### Keyboard shortcuts

- **Ctrl/Cmd+K**: command palette
- **T** (while focused on the page): toggle theme
- **Ctrl/Cmd+E**: export last results (Pro)
- **Ctrl/Cmd+O**: bulk open last results (Pro)

## Security model

- **Client-side only**: no backend, no tracking, no user accounts
- **Strict CSP**: no inline scripts; explicit `connect-src` allow-list for optional assistant providers
- **Input sanitization**: URL/path sanitization to reduce injection risk
- **Security contact**: `security.txt` and `/.well-known/security.txt`

## Repo layout (high level)

- `index.html`: UI shell
- `app.js`: bootstrap (ES module)
- `styles.css`: UI theme + components
- `src/app/init.js`: app controller (rendering, events, state)
- `src/assistant/assistant.js`: assistant engine + optional providers
- `src/commercial/*`: plans, entitlements, usage limits
- `src/ui/*`: modal / toasts / command palette / theme
- `src/prefix-library.js`: thumpersecure-derived prefix list + method combinations

## Deployment (GitHub Pages)

1. Repo Settings → Pages → Deploy from branch
2. Choose your default branch → `/ (root)`
3. Ensure `index.html` is at the repository root

## License

MIT. See `LICENSE`.
