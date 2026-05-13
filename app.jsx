// app.jsx — Discover root + state + API client
// Loaded after React, ReactDOM, Babel, tweaks-panel.jsx, components.jsx

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ── Categories (fixed set, with simple emoji marks) ──────────
const CATEGORIES = [
  { slug: "",         label: "All",        emoji: "✦" },
  { slug: "tech",     label: "Tech",       emoji: "⌨" },
  { slug: "food",     label: "Food",       emoji: "✻" },
  { slug: "ai",       label: "AI",         emoji: "✦" },
  { slug: "arts",     label: "Arts",       emoji: "✺" },
  { slug: "climate",  label: "Climate",    emoji: "◐" },
  { slug: "fitness",  label: "Fitness",    emoji: "↟" },
  { slug: "wellness", label: "Wellness",   emoji: "❀" },
  { slug: "crypto",   label: "Crypto",     emoji: "◆" },
];

const SORT_OPTIONS = [
  { id: "soonest",  label: "Soonest first" },
  { id: "latest",   label: "Latest first" },
  { id: "relevance",label: "Most relevant" },
  { id: "nearest",  label: "Nearest to map center" },
  { id: "capacity", label: "Most spots open" },
  { id: "alpha",    label: "Alphabetical" },
];

// Default bbox — Dallas area, matching the API example
const DEFAULT_BBOX = {
  west:  -97.454,
  east:  -96.516,
  south: 32.61704984,
  north: 33.21840836,
};

// ── Rate-aware fetch ─────────────────────────────────────────
// Luma's response carries x-ratelimit-* headers. We track them so the client
// can: (1) cap concurrency, (2) pre-emptively pause when remaining is low,
// (3) auto-retry once on 403/429 by waiting until x-ratelimit-reset.

const MAX_CONCURRENT_REQUESTS = 2;
const RATE_SAFE_BUFFER = 2;   // pause until reset if remaining drops to this
const MAX_RATE_RETRIES = 2;

const rate = {
  limit: 60,
  remaining: 60,
  reset: 0,        // ms epoch
  inflight: 0,
  waitingUntil: 0, // for UI: ms epoch we're currently sleeping toward
  listeners: new Set(),
};

function rateSubscribe(fn) {
  rate.listeners.add(fn);
  return () => rate.listeners.delete(fn);
}
function rateNotify() {
  rate.listeners.forEach(fn => { try { fn(rateSnapshot()); } catch {} });
}
function rateSnapshot() {
  return {
    limit: rate.limit,
    remaining: rate.remaining,
    reset: rate.reset,
    waitingUntil: rate.waitingUntil,
  };
}

const sleep = (ms) => new Promise(r => setTimeout(r, Math.max(0, ms)));

function readRateHeaders(headers) {
  const num = (k) => {
    const v = headers.get(k);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const lim = num("x-ratelimit-limit");
  const rem = num("x-ratelimit-remaining");
  const rst = num("x-ratelimit-reset");
  let changed = false;
  if (lim != null && lim !== rate.limit) { rate.limit = lim; changed = true; }
  if (rem != null && rem !== rate.remaining) { rate.remaining = rem; changed = true; }
  if (rst != null && rst !== rate.reset) { rate.reset = rst; changed = true; }
  if (changed) rateNotify();
}

async function acquireBudget() {
  // 1) Concurrency cap.
  while (rate.inflight >= MAX_CONCURRENT_REQUESTS) {
    await sleep(40);
  }
  // 2) Pre-emptive pause: if remaining is critically low and the window
  //    hasn't reset yet, sleep until reset.
  if (rate.remaining <= RATE_SAFE_BUFFER && rate.reset > Date.now()) {
    rate.waitingUntil = rate.reset + 100;
    rateNotify();
    await sleep(rate.waitingUntil - Date.now());
    rate.waitingUntil = 0;
    // Assume the window reset; remaining will be refreshed by the next response.
    rate.remaining = rate.limit;
    rateNotify();
  }
}

async function rateAwareJSON(url) {
  for (let attempt = 0; attempt <= MAX_RATE_RETRIES; attempt++) {
    await acquireBudget();
    rate.inflight++;
    let res;
    try {
      res = await fetch(url);
    } catch (err) {
      rate.inflight--;
      throw err;
    }
    rate.inflight--;
    readRateHeaders(res.headers);

    if (res.status === 429 || res.status === 403) {
      // Treat as rate limited; wait until reset and retry.
      const resetAt = rate.reset && rate.reset > Date.now() ? rate.reset : Date.now() + 5000;
      const waitMs = (resetAt - Date.now()) + 200;
      if (attempt < MAX_RATE_RETRIES) {
        rate.waitingUntil = Date.now() + waitMs;
        rateNotify();
        await sleep(waitMs);
        rate.waitingUntil = 0;
        rate.remaining = rate.limit;
        rateNotify();
        continue;
      }
      throw new Error(`Rate limited (HTTP ${res.status}). Try again in ~${Math.ceil(waitMs / 1000)}s.`);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

// ── API ──────────────────────────────────────────────────────
async function fetchOne({ bbox, slug, cursor, limit = 50 }) {
  const params = new URLSearchParams({
    east:  String(bbox.east),
    north: String(bbox.north),
    south: String(bbox.south),
    west:  String(bbox.west),
    pagination_limit: String(limit),
  });
  if (slug) params.set("slug", slug);
  if (cursor) params.set("pagination_cursor", cursor);
  const url = `https://proxy.corsfix.com/?https://api2.luma.com/discover/get-paginated-events?${params}`;
  return rateAwareJSON(url);
}

async function fetchEvents({ bbox, slugs, cursor, limit = 50 }) {
  const list = Array.isArray(slugs) ? slugs : (slugs ? [slugs] : []);
  // Empty or single category → single API call (cursor pagination supported).
  if (list.length <= 1) {
    return fetchOne({ bbox, slug: list[0] || "", cursor, limit });
  }
  // Multi-category → fetch each in parallel, merge + dedupe. No cursor pagination.
  const results = await Promise.all(list.map(s => fetchOne({ bbox, slug: s, limit })));
  const seen = new Set();
  const entries = [];
  for (const r of results) {
    for (const e of (r.entries || [])) {
      const id = e?.event?.api_id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      entries.push(e);
    }
  }
  return { entries, next_cursor: null, has_more: false };
}

// ── Filter / sort utilities ──────────────────────────────────
function eventMatchesFilters(entry, F) {
  const e = entry.event;
  const title = (e.name || "").toLowerCase();
  const desc  = "";
  const haystack = title + " " + (entry.hosts || []).map(h => (h.name||"").toLowerCase()).join(" ");

  // Keywords (all must match if AND, any if OR — we'll do AND on whitespace-split)
  if (F.keywords.trim()) {
    const terms = F.keywords.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.every(t => haystack.includes(t))) return false;
  }
  // Excluded keywords (any match → reject)
  if (F.excludeKeywords.trim()) {
    const exTerms = F.excludeKeywords.toLowerCase().split(/[,\s]+/).filter(Boolean);
    if (exTerms.some(t => haystack.includes(t))) return false;
  }
  // Date range
  const start = new Date(entry.start_at);
  if (F.dateFrom && start < new Date(F.dateFrom)) return false;
  if (F.dateTo) {
    const end = new Date(F.dateTo);
    end.setHours(23, 59, 59);
    if (start > end) return false;
  }
  // Online / in-person
  if (F.locationType !== "any") {
    if (F.locationType === "online" && e.location_type !== "online") return false;
    if (F.locationType === "offline" && e.location_type !== "offline") return false;
  }
  // City contains
  if (F.cityContains.trim()) {
    const city = (e.geo_address_info?.city_state || e.geo_address_info?.city || "").toLowerCase();
    if (!city.includes(F.cityContains.toLowerCase())) return false;
  }
  // Has spots remaining
  if (F.hasSpots && !(entry.ticket_info?.spots_remaining > 0)) return false;
  // Approval
  if (F.approval !== "any") {
    const req = !!entry.ticket_info?.require_approval;
    if (F.approval === "yes" && !req) return false;
    if (F.approval === "no" && req) return false;
  }
  // Free / paid
  if (F.priceMode !== "any") {
    const isFree = !!entry.ticket_info?.is_free;
    if (F.priceMode === "free" && !isFree) return false;
    if (F.priceMode === "paid" && isFree) return false;
  }
  // Verified hosts only
  if (F.verifiedOnly) {
    const anyVerified = (entry.hosts || []).some(h => h.is_verified) || !!entry.calendar?.verified_at;
    if (!anyVerified) return false;
  }
  // Time of day
  if (F.timeOfDay !== "any") {
    const h = start.getHours();
    if (F.timeOfDay === "morning"   && !(h >= 5  && h < 12)) return false;
    if (F.timeOfDay === "afternoon" && !(h >= 12 && h < 17)) return false;
    if (F.timeOfDay === "evening"   && !(h >= 17 || h < 5))  return false;
  }
  return true;
}

function sortEvents(arr, sortId, mapCenter) {
  const a = [...arr];
  switch (sortId) {
    case "soonest":   a.sort((x, y) => new Date(x.start_at) - new Date(y.start_at)); break;
    case "latest":    a.sort((x, y) => new Date(y.start_at) - new Date(x.start_at)); break;
    case "relevance": a.sort((x, y) => (y.score || 0) - (x.score || 0)); break;
    case "alpha":     a.sort((x, y) => (x.event.name || "").localeCompare(y.event.name || "")); break;
    case "capacity":  a.sort((x, y) => (y.ticket_info?.spots_remaining || 0) - (x.ticket_info?.spots_remaining || 0)); break;
    case "nearest":
      if (!mapCenter) break;
      a.sort((x, y) => {
        const dx = haversine(x.event.coordinate, mapCenter);
        const dy = haversine(y.event.coordinate, mapCenter);
        return dx - dy;
      });
      break;
  }
  return a;
}

function haversine(c, center) {
  if (!c || !center) return Infinity;
  const dlat = (c.latitude  - center.lat);
  const dlng = (c.longitude - center.lng);
  return dlat * dlat + dlng * dlng; // squared, fine for sort
}

// ── Default tweaks ───────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "warm",
  "density": "medium",
  "layout": "map-right",
  "showMap": true,
  "radius": 14,
  "fontPair": "inter"
}/*EDITMODE-END*/;

// ── Filter state default ─────────────────────────────────────
const FILTER_DEFAULTS = {
  keywords: "",
  excludeKeywords: "",
  dateFrom: "",
  dateTo: "",
  locationType: "any",  // any | online | offline
  cityContains: "",
  hasSpots: false,
  approval: "any",      // any | yes | no
  priceMode: "any",     // any | free | paid
  verifiedOnly: false,
  timeOfDay: "any",     // any | morning | afternoon | evening
};

// ── Main App ─────────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [theme, setTheme] = useState("light");
  const [bbox, setBbox] = useState(DEFAULT_BBOX);
  const [mapCenter, setMapCenter] = useState({ lat: 32.92, lng: -96.98 });
  const [slugs, setSlugs] = useState([]);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [sortId, setSortId] = useState("soonest");
  const [advOpen, setAdvOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [pinned, setPinned] = useState(() => {
    try { return JSON.parse(localStorage.getItem("discover.pinned") || "[]"); }
    catch { return []; }
  });
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [toast, setToast] = useState(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Persist pinned
  useEffect(() => {
    localStorage.setItem("discover.pinned", JSON.stringify(pinned));
  }, [pinned]);

  // Search: paginates through every page of results internally and commits state
  // once at the end, so the UI shows a single "Loading" state instead of flickering
  // as each page arrives.
  const search = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const seen = new Set();
      const accumulated = [];
      let cursor = null;

      while (true) {
        const data = await fetchEvents({
          bbox: opts.bbox || bbox,
          slugs: opts.slugs !== undefined ? opts.slugs : slugs,
          cursor,
          limit: 50,
        });
        for (const e of (data.entries || [])) {
          const id = e?.event?.api_id;
          if (!id || seen.has(id)) continue;
          seen.add(id);
          accumulated.push(e);
        }
        cursor = data.next_cursor || null;
        if (!cursor) break;
      }

      setEntries(accumulated);
    } catch (err) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [bbox, slugs]);

  // Initial load
  useEffect(() => {
    search();
  // eslint-disable-next-line
  }, []);

  // Re-search on category change
  useEffect(() => {
    search({ slugs });
  // eslint-disable-next-line
  }, [slugs]);

  const toggleSlug = (s) => {
    setSlugs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  // Filtered + sorted
  const visible = useMemo(() => {
    let arr = entries.filter(e => eventMatchesFilters(e, filters));
    if (showPinnedOnly) arr = arr.filter(e => pinned.includes(e.event.api_id));
    arr = sortEvents(arr, sortId, mapCenter);
    return arr;
  }, [entries, filters, sortId, mapCenter, showPinnedOnly, pinned]);

  // Active filter count (for badge on Filters button)
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.keywords) n++;
    if (filters.excludeKeywords) n++;
    if (filters.dateFrom || filters.dateTo) n++;
    if (filters.locationType !== "any") n++;
    if (filters.cityContains) n++;
    if (filters.hasSpots) n++;
    if (filters.approval !== "any") n++;
    if (filters.priceMode !== "any") n++;
    if (filters.verifiedOnly) n++;
    if (filters.timeOfDay !== "any") n++;
    return n;
  }, [filters]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches("input, textarea")) return;
      if (e.key === "/") {
        e.preventDefault();
        document.querySelector(".search-input")?.focus();
      } else if (e.key === "f" && !e.metaKey && !e.ctrlKey) {
        setAdvOpen(v => !v);
      } else if (e.key === "t") {
        setTheme(t => t === "light" ? "dark" : "light");
      } else if (e.key === "Escape") {
        setAdvOpen(false);
        setSortMenuOpen(false);
        setCategoryMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const togglePin = (apiId) => {
    setPinned(prev => {
      const has = prev.includes(apiId);
      setToast(has ? "Removed from saved" : "Saved");
      setTimeout(() => setToast(null), 1400);
      return has ? prev.filter(x => x !== apiId) : [...prev, apiId];
    });
  };

  const onSearchArea = (newBbox, center) => {
    setBbox(newBbox);
    setMapCenter(center);
    search({ bbox: newBbox });
  };

  const layout = !tweaks.showMap ? "hide-map" : (tweaks.layout === "map-left" ? "map-left" : "map-right");

  return (
    <>
      <div className="app-bg" />
      <FilterBar
        keywords={filters.keywords}
        onKeywords={v => setFilters(f => ({ ...f, keywords: v }))}
        categories={CATEGORIES}
        selectedSlugs={slugs}
        categoryMenuOpen={categoryMenuOpen}
        onToggleCategoryMenu={() => setCategoryMenuOpen(v => !v)}
        onToggleSlug={toggleSlug}
        onClearSlugs={() => setSlugs([])}
        onOpenAdvanced={() => setAdvOpen(true)}
        activeFilterCount={activeFilterCount}
        onSearch={() => search()}
        loading={loading}
        showPinnedOnly={showPinnedOnly}
        onTogglePinned={() => setShowPinnedOnly(v => !v)}
        pinnedCount={pinned.length}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
      />
      <div className="split" data-layout={layout}>
        <div className="results-pane">
          <ResultsHeader
            count={visible.length}
            total={entries.length}
            loading={loading}
            sortId={sortId}
            sortMenuOpen={sortMenuOpen}
            onToggleSortMenu={() => setSortMenuOpen(v => !v)}
            onSelectSort={id => { setSortId(id); setSortMenuOpen(false); }}
          />
          {error && (
            <div className="state">
              <div className="state-icon"><Icon name="alert" size={20} /></div>
              <div className="state-title">Couldn't load events</div>
              <div>{error}</div>
              <button className="btn btn-sm" onClick={() => search()}>Retry</button>
            </div>
          )}
          {loading && entries.length === 0 && (
            <SkeletonList count={4} />
          )}
          {!loading && !error && visible.length === 0 && entries.length > 0 && (
            <div className="state">
              <div className="state-icon"><Icon name="search" size={18} /></div>
              <div className="state-title">No matches</div>
              <div>Try clearing some filters or expanding your map area.</div>
            </div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div className="state">
              <div className="state-icon"><Icon name="map" size={18} /></div>
              <div className="state-title">Nothing here yet</div>
              <div>Pan the map or change category to find events.</div>
            </div>
          )}
          {visible.map(entry => (
            <EventCard
              key={entry.event.api_id}
              entry={entry}
              density={tweaks.density}
              hovered={hoveredId === entry.event.api_id}
              onHover={() => setHoveredId(entry.event.api_id)}
              onLeave={() => setHoveredId(null)}
              pinned={pinned.includes(entry.event.api_id)}
              onTogglePin={() => togglePin(entry.event.api_id)}
            />
          ))}
        </div>
        {tweaks.showMap && (
          <div className="map-pane">
            <MapView
              entries={visible}
              bbox={bbox}
              onChange={onSearchArea}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              loading={loading}
              theme={theme}
            />
          </div>
        )}
      </div>

      {advOpen && (
        <AdvancedFilters
          filters={filters}
          onChange={setFilters}
          onClose={() => setAdvOpen(false)}
          onReset={() => setFilters(FILTER_DEFAULTS)}
        />
      )}

      <DiscoverTweaks tweaks={tweaks} setTweak={setTweak} theme={theme} setTheme={setTheme} />

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
