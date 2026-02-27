# ofacebook

A Facebook OSINT tool that uses prefixes. Designed as simple mobile web app.

## GitHub Pages Deployment

Static site—no build step required.

1. **Repository Settings** → Pages → Source: Deploy from a branch
2. **Branch**: `main` (or your default) → folder: `/ (root)`
3. **Structure**: `index.html` must be at repository root
4. **`.nojekyll`**: Included at root so folders starting with `_` (e.g. `_data`) are served

## Security

- **CSP**: Content-Security-Policy meta tag restricts scripts, styles, and resources
- **Input sanitization**: User input escaped before display; URLs sanitized to prevent XSS
- **No sensitive storage**: All processing is client-side; no data sent to servers
- **security.txt**: Available at `/security.txt` and `/.well-known/security.txt` 
