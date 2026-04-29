# Extension App

This directory contains the browser extension side of git-reflow.

Current test loop:

1. Start the backend from `web/BE` with `npm run dev`.
2. Start the frontend from `web/FE` with `npm run dev`.
3. Open the template editor and click `Sync to Extension`.
4. In Chrome, open `chrome://extensions`, enable developer mode, and load this folder as an unpacked extension.
5. Open `https://github.com/`.
6. Use the `Git Reflow Preview` controller in the bottom-right corner to refresh or reset the applied template.
7. Drag the right edge of GitHub's left sidebar to resize it directly on the page.

The extension currently reads `http://localhost:8787/api/templates/github-home/latest` and applies:

- left sidebar width
- direct left sidebar resize on GitHub, persisted in extension storage
- feed one-column/two-column variation
