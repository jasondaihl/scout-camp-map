# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive map of Scouting America council camps and high adventure bases. Static site using Leaflet.js with OpenStreetMap tiles — no build step, no framework.

## Development

```bash
npm start        # serves on http://localhost:8000 via `serve`
```

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`.
Live at: https://jasondaihl.github.io/camp-mapper/

## Architecture

- **`index.html`** — loads Leaflet from CDN, mounts the `#map` div
- **`js/app.js`** — single IIFE that initializes the Leaflet map, fetches camp data, renders circle markers with popups, and adds a legend
- **`css/style.css`** — full-viewport map layout, popup styling, legend styling
- **`data/camps.geojson`** — GeoJSON FeatureCollection; this is the sole data source

## Camp Data Format

Each camp is a GeoJSON Feature in `data/camps.geojson` with coordinates as `[longitude, latitude]`. Required properties: `name`, `type` (`"council_camp"`, `"high_adventure"`, or `"council_high_adventure"`). Optional: `council`, `city`, `state`, `website`, `description`.

## Marker Styles

- High adventure bases: gold (`#D4A017`), radius 10
- Council camps: green (`#2E7D32`), radius 7

These are defined in `markerStyles` in `js/app.js` and must stay in sync with the legend markup and CSS badge colors.
