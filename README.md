# AgriFeed & Rice Supply — Store Operations System

A lightweight browser-based point-of-sale and inventory system for store operations.

## Features

- Point of Sale (POS)
- Product and inventory management
- Open-sack / per-kilo stock tracking
- Customer credit ledger
- Sales reports
- Cash-out and expense records
- Local browser storage
- Offline application caching after the first successful load

## Run locally

Open `index.html` in a modern browser. The core application uses local browser storage and does not require a server for normal use. Service-worker installation is available when served from `localhost` or HTTPS.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload all project files in this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Open the published HTTPS URL once while online. The service worker caches the application shell for subsequent offline use.

## Offline notes

The app has no required runtime CDN, remote font, or external API dependency. Data is stored in the browser's local storage on the device and browser profile being used. For offline use on a hosted site, open the site online once so the service worker can cache the files. Browser storage is device-specific; it is not automatically synchronized between devices.

## Project files

- `index.html` — application interface
- `styles.css` — locally bundled interface styles
- `app.js` — application logic
- `service-worker.js` — offline cache
- `manifest.json` — installable web-app metadata
