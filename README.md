# online-cv

Astro-based resume site for Aleksandre Ghvineria, using the slick.ge visual system.
Content lives in `src/data/content.json` and is published at `/en/`.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:8080>

## Build

```bash
npm run build
```

Static output goes to `dist/`.

The GitHub Pages workflow also renders `/en/print/` with Playwright and adds a fresh English PDF to the deployed artifact.

## Configuration

English is the only published locale.
