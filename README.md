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
3. Choose available paints only or a broad reference palette. Inspect estimated alternatives, adjust proportions and volume, then save a recipe snapshot. A real mix can be photographed and recorded as a separate observation; only the same pigment combination and proportions will show that previous observation later.
4. Export a local JSON backup under **Configuración**. Importing can combine by identifier or replace after confirmation. Backups include paints, recipes and observations but exclude photos. Version 1 backups migrate to version 2.

Data is stored in this browser's IndexedDB and can be lost if site data is cleared. No account, backend, analytics, or third-party font request is used.

## Scope and limitations

The current digital mixing model is an **uncalibrated heuristic**, not a physically accurate simulation of oil paint. Reference colors are illustrative hand-selected display swatches, **not measured manufacturer data**. See [the model notes](docs/color-model.md). There is no measured spectral dataset; the UI reports insufficient calibration data. The separate spectral module accepts explicit measured K/S and viewing arrays, but is not used by the UI without validated data. Observations are shown as historical evidence, not extrapolated corrections. Photo-based paint swatch inventory entry, full history/favorites, comprehensive accessibility audit, and scientifically calibrated mixing remain unfinished.

GitHub Pages deployment is configured for a future push to `main`, but no publication is performed by local development. The Vite base path is `/OleoPalette/`.
