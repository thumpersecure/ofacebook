# FB OSINT Terminal 2036

A futuristic Facebook OSINT tool using URL prefix enumeration. Built for GitHub Pages with an immersive 2036-style UI.

**Prefix source:** [thumpersecure/thumpersecure facebook-prefix-list.md](https://github.com/thumpersecure/thumpersecure/blob/main/facebook-prefix-list.md)

## Features

- **Prefix Library** – 80+ Facebook subdomains (mobile, developer, business, locale, etc.)
- **Method Combinations** – Recommended prefix combos for profile discovery, link tracking, business intel, API discovery, locale search
- **OSINT Assistant** – Natural language recommendations (e.g. "find profile", "track links")
- **URL Builder** – Enter username/ID, get URLs across multiple prefixes
- **Responsive** – Mobile-first, works on all devices
- **Security** – Client-side only, CSP, input sanitization, no sensitive data storage

## GitHub Pages Deployment

1. **Repository Settings** → Pages → Source: Deploy from a branch
2. **Branch:** `main` (or default) → folder: `/ (root)`
3. **Structure:** `index.html` at repository root
4. **`.nojekyll`:** Included so underscore folders are served

## Security

- **CSP:** Content-Security-Policy meta tag restricts scripts, styles, resources
- **Input sanitization:** User input escaped; URLs sanitized to prevent XSS
- **No sensitive storage:** All processing client-side
- **security.txt:** `/security.txt` and `/.well-known/security.txt`

## Usage

1. Enter a Facebook username or numeric ID
2. Click **Execute** or use quick method chips (Profile, Links, Business, etc.)
3. Browse the **Library** tab for all prefixes
4. Check **Methods** for recommended combinations
5. Ask the **Assistant** for guidance (e.g. "how do I track link referrals?")

## License

See LICENSE file.
