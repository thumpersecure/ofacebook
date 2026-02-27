# Security

## Scope

This is a **client-side only** OSINT helper. It does not include authentication, a backend, or server-side storage.

## CSP

`index.html` sets a strict Content Security Policy:

- no inline scripts
- scripts only from `self`
- external styles restricted to Google Fonts
- optional `connect-src` allow-list for assistant providers

## Input handling

- URL/path inputs are sanitized before being appended to generated URLs.
- Chat messages are escaped before rendering; a minimal Markdown-like renderer is used (bold + inline code + line breaks).

## API keys (optional)

If you enable OpenAI/Anthropic providers:

- keys are stored in browser `localStorage`
- network calls are made directly from the browser

For a real commercial deployment, you should proxy provider calls through your own backend to avoid exposing keys client-side.

## Vulnerability reporting

See `security.txt` and `/.well-known/security.txt`.

