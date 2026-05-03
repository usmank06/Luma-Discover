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

// ── API ──────────────────────────────────────────────────────
async function fetchEvents({ bbox, slug, cursor, limit = 50 }) {
  const params = new URLSearchParams({
    east:  String(bbox.east),
    north: String(bbox.north),
    south: String(bbox.south),
    west:  String(bbox.west),
    pagination_limit: String(limit),
  });
  if (slug) params.set("slug", slug);
  if (cursor) params.set("pagination_cursor", cursor);
  const url = `https://api2.luma.com/discover/get-paginated-events?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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
  const [slug, setSlug] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

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
  const [autoSearchOnPan, setAutoSearchOnPan] = useState(false);
  const [toast, setToast] = useState(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Persist pinned
  useEffect(() => {
    localStorage.setItem("discover.pinned", JSON.stringify(pinned));
  }, [pinned]);

  // Search
  const search = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents({
        bbox: opts.bbox || bbox,
        slug: opts.slug !== undefined ? opts.slug : slug,
        cursor: opts.append ? nextCursor : null,
        limit: 50,
      });
      const newEntries = data.entries || [];
      setEntries(prev => opts.append ? [...prev, ...newEntries] : newEntries);
      setNextCursor(data.next_cursor || null);
      setHasMore(!!data.has_more);
    } catch (err) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [bbox, slug, nextCursor]);

  // Initial load
  useEffect(() => {
    search();
  // eslint-disable-next-line
  }, []);

  // Re-search on slug change
  useEffect(() => {
    search({ slug });
  // eslint-disable-next-line
  }, [slug]);

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

  const onMapMove = (newBbox, center) => {
    setBbox(newBbox);
    setMapCenter(center);
    if (autoSearchOnPan) search({ bbox: newBbox });
  };

  const layout = !tweaks.showMap ? "hide-map" : (tweaks.layout === "map-left" ? "map-left" : "map-right");

  return (
    <>
      <div className="app-bg" />
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
      />
      <FilterBar
        keywords={filters.keywords}
        onKeywords={v => setFilters(f => ({ ...f, keywords: v }))}
        sortId={sortId}
        sortMenuOpen={sortMenuOpen}
        onToggleSortMenu={() => setSortMenuOpen(v => !v)}
        onSelectSort={id => { setSortId(id); setSortMenuOpen(false); }}
        onOpenAdvanced={() => setAdvOpen(true)}
        activeFilterCount={activeFilterCount}
        onSearch={() => search()}
        loading={loading}
        showPinnedOnly={showPinnedOnly}
        onTogglePinned={() => setShowPinnedOnly(v => !v)}
        pinnedCount={pinned.length}
      />
      <CategoryStrip
        categories={CATEGORIES}
        active={slug}
        onSelect={setSlug}
      />
      <div className="split" data-layout={layout}>
        <div className="results-pane">
          <ResultsHeader
            count={visible.length}
            total={entries.length}
            loading={loading}
            sortLabel={SORT_OPTIONS.find(s => s.id === sortId)?.label}
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
          {hasMore && entries.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <button className="btn" onClick={() => search({ append: true })} disabled={loading}>
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
        {tweaks.showMap && (
          <div className="map-pane">
            <MapView
              entries={visible}
              bbox={bbox}
              onChange={onMapMove}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              autoSearchOnPan={autoSearchOnPan}
              onToggleAutoSearch={() => setAutoSearchOnPan(v => !v)}
              onSearchHere={() => search()}
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
