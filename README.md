# Scouting America Camp Mapper

Interactive map of Scouting America council camps and high adventure bases, built with [Leaflet](https://leafletjs.com/) and OpenStreetMap.

## Run Locally

A local HTTP server is required (`fetch` doesn't work over `file://`):

```bash
npm start
```

Then open [http://localhost:8000](http://localhost:8000).

## Adding a Camp

Add a new feature to `data/camps.geojson`:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-longitude, latitude]
  },
  "properties": {
    "name": "Camp Name",
    "type": "council_camp",
    "council": "Council Name",
    "city": "City",
    "state": "ST",
    "website": "https://example.com",
    "description": "Short description of the camp."
  }
}
```

- `type` must be `"council_camp"`, `"high_adventure"`, or `"council_high_adventure"`
- `council`, `city`, `website`, and `description` are optional
- Coordinates are `[longitude, latitude]` (GeoJSON standard)

## Deploy to GitHub Pages

The site automatically deploys to GitHub Pages on every push to `main` via GitHub Actions.

Live at: [https://jasondaihl.github.io/camp-mapper/](https://jasondaihl.github.io/camp-mapper/)

## Attribution

Map tiles by [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
