# Discover

A third-party browser for events on [Luma](https://lu.ma). List view on the left, map view on the right. Filter by category, keywords, date, price, online/in-person, and more. Pan the map and hit "Search this area" to refresh results for a new region.

Live at [luma.usmankhan.io](https://luma.usmankhan.io).

Not affiliated with Luma — it just hits their public discover endpoint.

## Stack

No build step. Everything is loaded directly in the browser:

- `index.html` — entry point; pulls in React 18, MapLibre GL, Supercluster, and Babel Standalone from CDNs
- `app.jsx` — root component, state, and API client
- `components.jsx` — `FilterBar`, `ResultsHeader`, `EventCard`, `MapView`, `AdvancedFilters`, etc.
- `tweaks-panel.jsx` — dev/preview panel for tweaking density, layout, and theme
- `styles.css` — all styling, including light/dark themes and the map's pins and popups

Babel compiles the JSX on page load, so editing any `.jsx` file and refreshing is the full feedback loop.

## Map

The basemap is [OpenFreeMap](https://openfreemap.org)'s free vector tiles (no API key, sign-up, or usage limits), drawn with [MapLibre GL JS](https://maplibre.org). Light mode uses the Positron style and dark mode the Dark style; both URLs live in `MAP_STYLES` in [`components.jsx`](components.jsx). Nearby pins are grouped with [Supercluster](https://github.com/mapbox/supercluster), and events that share a venue open as a list.

MapLibre is pinned to 5.x: 6.x ships only ES modules and fetches its worker from the CDN at runtime, which this no-build, SRI-pinned setup can't load the same way.

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, © [OpenMapTiles](https://openmaptiles.org).

## Running locally

Any static file server works. With Python:

```sh
python3 -m http.server 5500
```

Then open `http://localhost:5500`.

The included `corsfix.com` / Cloudflare Worker proxy (see below) handles CORS for the Luma API, so no further setup is needed.

## API proxy

Luma's discover API doesn't send CORS headers for arbitrary origins, so requests go through a tiny Cloudflare Worker that forwards the request and re-emits the response with `access-control-allow-origin: *`. The Worker is just:

```js
export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "*",
        },
      });
    }
    const url = new URL(request.url);
    const upstream = await fetch("https://api2.luma.com" + url.pathname + url.search);
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=30",
      },
    });
  },
};
```

The proxy URL lives in [`app.jsx`](app.jsx) inside `fetchOne` — swap it for your own Worker if you fork this.

## Rate limiting

Luma's API returns `x-ratelimit-*` headers. The client tracks them and:

1. Caps concurrent requests at 2
2. Pauses pre-emptively when remaining drops to 2 (waits until the window resets)
3. Retries 403/429 responses after the reset time

So fetches that span many pages stay polite without the user needing to think about it.

## Deployment

Pushed to `main` and served from GitHub Pages via a `CNAME` file pointing at `luma.usmankhan.io`.

## License

MIT.
