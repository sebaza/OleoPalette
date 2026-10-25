# OleoPalette

A mobile-first, browser-local assistant for exploring oil-paint color mixes. The interface is in Chilean Spanish; technical documentation is in English.

## Run locally

```sh
npm ci
npm run dev
```

Open the Vite URL under `/OleoPalette/`. Run `npm test -- --run`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e` for checks.

## Current workflow

1. Add representative digital colors for the paints you own under **Mis pinturas**.
2. In **Crear mezcla**, choose or capture a photo and tap a color. Images stay in memory and are downscaled to at most 2048 pixels on the longest side; they are not uploaded or saved.
3. Choose available paints only or a broad reference palette. Inspect estimated alternatives, adjust proportions and volume, then save a recipe snapshot.
4. Export a local JSON backup under **Configuración**. Importing can combine by identifier or replace after confirmation. Backups exclude photos.

Data is stored in this browser's IndexedDB and can be lost if site data is cleared. No account, backend, analytics, or third-party font request is used.

## Scope and limitations

The current digital mixing model is an **uncalibrated heuristic**, not a physically accurate simulation of oil paint. Reference colors are illustrative hand-selected display swatches, **not measured manufacturer data**. See [the model notes](docs/color-model.md). There is no measured spectral dataset; the spectral path reports insufficient calibration data. There is not yet an empirical calibration assistant, photo-based paint swatch inventory entry, full recipe history/favorites, accessibility audit, or scientifically calibrated mixing.

GitHub Pages deployment is configured for a future push to `main`, but no publication is performed by local development. The Vite base path is `/OleoPalette/`.
