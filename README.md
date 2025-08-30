# javascript-playground

Run JavaScript using the real browser environment.

## Features

- Monaco Editor (same editor as VS Code)
- Executes code in a same-origin sandboxed iframe with full browser APIs
- Top-level `await` supported (code runs as an ES module)
- Console bridge for `log/info/warn/error` and error reporting

## Getting started

1. Install and run a static web server (recommended to avoid `file:` issues):

   - Python
     - `python3 -m http.server 5173`

   - Node.js
     - `npx serve -l 5173 --single`

2. Open the app:

   - `http://localhost:5173/` (or whatever port you used)

3. Type code in the editor and click "Run". Use "Clear Console" to clear output.

Notes:

- The runner iframe uses `sandbox="allow-scripts allow-same-origin ..."` so it has access to DOM, cookies, `localStorage`, `fetch`, etc., similar to the browser console, while still being isolated from the parent page DOM.
- For external imports, reference CDN URLs (e.g. `https://esm.sh/lodash-es`) or add an import map inside the runner if needed.
