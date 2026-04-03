# Scouting America Camp Mapper

Interactive map of Scouting America council camps and high adventure bases, built with [Leaflet](https://leafletjs.com/) and OpenStreetMap.

## Run Locally

A local HTTP server is required (`fetch` doesn't work over `file://`):

```bash
python3 -m http.server
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

- `type` must be `"council_camp"` or `"high_adventure"`
- `council`, `city`, `website`, and `description` are optional
- Coordinates are `[longitude, latitude]` (GeoJSON standard)

## Deploy to GitHub Pages

1. Go to the repo's **Settings > Pages**
2. Set source to **Deploy from a branch**, branch **main**, folder **/ (root)**
3. The site will be live at `https://<username>.github.io/camp-mapper/`

## Attribution

Map tiles by [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
