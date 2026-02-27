# Configuration

This app is static and does not require environment variables for basic use.

## Assistant providers (optional)

By default the assistant runs **Local (offline)**.

You can optionally switch to:

- OpenAI (BYO key)
- Anthropic (BYO key)

Keys are stored in `localStorage` in the browser. If you do not want keys stored locally, keep the provider set to **Local**.

## Content Security Policy

`index.html` contains a strict CSP. Optional provider use requires `connect-src` allow-list entries for:

- `https://api.openai.com`
- `https://api.anthropic.com`

If you add other providers, update the allow-list accordingly.

