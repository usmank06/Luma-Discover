// components.jsx — UI components for Discover

const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

// ── Icons (thin-line, custom) ────────────────────────────────
function Icon({ name, size = 16, ...rest }) {
  const s = size;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round",
    strokeLinejoin: "round", ...rest };
  switch (name) {
    case "search":  return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case "sliders": return <svg {...props}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2" fill="currentColor"/></svg>;
    case "chevdown":return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case "chevleft": return <svg {...props}><path d="m15 18-6-6 6-6"/></svg>;
    case "chevright":return <svg {...props}><path d="m9 18 6-6-6-6"/></svg>;
    case "check":   return <svg {...props}><path d="m5 12 5 5 9-11"/></svg>;
    case "sun":     return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>;
    case "moon":    return <svg {...props}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/></svg>;
    case "x":       return <svg {...props}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case "map":     return <svg {...props}><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v16M15 6v16"/></svg>;
    case "pin":     return <svg {...props}><path d="M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case "bookmark":return <svg {...props}><path d="M6 3h12v18l-6-4-6 4z"/></svg>;
    case "calendar":return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case "clock":   return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "users":   return <svg {...props}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M21.5 18a4.5 4.5 0 0 0-5-4.4"/></svg>;
    case "globe":   return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case "list":    return <svg {...props}><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>;
    case "external":return <svg {...props}><path d="M14 4h6v6M20 4l-9 9M19 13v7H4V5h7"/></svg>;
    case "alert":   return <svg {...props}><path d="M12 3 2 21h20zM12 10v5M12 18h.01"/></svg>;
    case "refresh": return <svg {...props}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>;
    case "target":  return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></svg>;
    case "spark":   return <svg {...props}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/></svg>;
    case "github":  return <svg {...props}><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>;
    default: return null;
  }
}

// ── Filter bar ───────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: "soonest",  label: "Soonest first" },
  { id: "latest",   label: "Latest first" },
  { id: "relevance",label: "Most relevant" },
  { id: "nearest",  label: "Nearest to map center" },
  { id: "capacity", label: "Most spots open" },
  { id: "alpha",    label: "Alphabetical" },
];

function FilterBar({ keywords, onKeywords,
                     categories, selectedSlugs, categoryMenuOpen, onToggleCategoryMenu,
                     onToggleSlug, onClearSlugs,
                     onOpenAdvanced, activeFilterCount, onSearch, loading,
                     showPinnedOnly, onTogglePinned, pinnedCount,
                     theme, onToggleTheme }) {
  const selected = (selectedSlugs || []).filter(s => s);
  const categoryLabel = selected.length === 0
    ? "All"
    : selected.length === 1
      ? (categories.find(c => c.slug === selected[0])?.label || selected[0])
      : `${selected.length} selected`;
  return (
    <div className="filterbar">
      <div className="fb-row fb-row-top">
        <div className="brand" data-tooltip="Not affiliated with Luma">Discover</div>
        <div className="search-wrap">
          <Icon name="search" size={15} />
          <input
            className="search-input"
            type="text"
            value={keywords}
            onChange={e => onKeywords(e.target.value)}
            placeholder="Search events, hosts, keywords…"
            onKeyDown={e => { if (e.key === "Enter") onSearch(); }}
          />
          {!keywords && <span className="search-kbd">/</span>}
        </div>
        <div className="fb-actions">
          <button className="btn btn-ghost btn-icon" onClick={onToggleTheme} title="Toggle theme (T)">
            <Icon name={theme === "light" ? "moon" : "sun"} size={15} />
          </button>
          <a className="btn btn-ghost btn-icon" href="https://github.com/usmank06/Luma-Discover" target="_blank" rel="noopener noreferrer" title="View on GitHub">
            <Icon name="github" size={15} />
          </a>
        </div>
      </div>

      <div className="fb-row fb-row-controls">
        <div className="fb-chips">
          <div className="menu-rel">
            <button className="chip" onClick={onToggleCategoryMenu}>
              <span className="chip-label">Category: {categoryLabel}</span>
              {selected.length > 0 && <span className="chip-count">{selected.length}</span>}
              <Icon name="chevdown" size={13} />
            </button>
            {categoryMenuOpen && (
              <div className="menu menu-multi" onMouseLeave={onToggleCategoryMenu}>
                <button data-active={selected.length === 0} onClick={onClearSlugs}>
                  <span className="menu-row-main">
                    <span className="cat-chip-emoji">✦</span>
                    All
                  </span>
                  {selected.length === 0 && <span className="check"><Icon name="check" size={13} /></span>}
                </button>
                <div className="menu-sep" />
                {categories.filter(c => c.slug).map(c => {
                  const on = selected.includes(c.slug);
                  return (
                    <button key={c.slug} data-active={on} onClick={() => onToggleSlug(c.slug)}>
                      <span className="menu-row-main">
                        <span className="cat-chip-emoji">{c.emoji}</span>
                        {c.label}
                      </span>
                      {on && <span className="check"><Icon name="check" size={13} /></span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button className="chip" onClick={onOpenAdvanced} title="Advanced filters (F)">
            <Icon name="sliders" size={14} />
            Filters
            {activeFilterCount > 0 && <span className="chip-count">{activeFilterCount}</span>}
          </button>

          {pinnedCount > 0 && (
            <button className="chip" data-active={showPinnedOnly} onClick={onTogglePinned}>
              <Icon name="bookmark" size={13} />
              Saved
              <span className="chip-count">{pinnedCount}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Results header ───────────────────────────────────────────
function ResultsHeader({ count, total, loading, sortId, sortMenuOpen, onToggleSortMenu, onSelectSort, rangeStart, rangeEnd }) {
  const headline = `${count} ${count === 1 ? "event" : "events"}`;
  const filteredOut = total - count;
  const sortLabel = SORT_OPTIONS.find(s => s.id === sortId)?.label || "";
  // Only surface the range when the list is actually paginated.
  const paginated = count > 0 && (rangeStart > 1 || rangeEnd < count);

  return (
    <div className="results-header">
      <div className="results-headline">
        <h2 className="results-count">
          {headline}
          {filteredOut > 0 && <em> · {filteredOut} filtered</em>}
        </h2>
        {paginated && (
          <div className="results-range">Showing {rangeStart}–{rangeEnd}</div>
        )}
      </div>
      <div className="results-meta">
        {loading && <span className="dot-pulse">Loading</span>}
        {loading && <span className="meta-sep">·</span>}
        <div className="menu-rel">
          <button className="chip chip-ghost" onClick={onToggleSortMenu}>
            {sortLabel}
            <Icon name="chevdown" size={13} />
          </button>
          {sortMenuOpen && (
            <div className="menu" onMouseLeave={onToggleSortMenu}>
              {SORT_OPTIONS.map(o => (
                <button key={o.id} data-active={o.id === sortId} onClick={() => onSelectSort(o.id)}>
                  {o.label}
                  {o.id === sortId && <span className="check"><Icon name="check" size={13} /></span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pagination ───────────────────────────────────────────────
// Builds a compact page list: 1 … 4 5 6 … 20 (current ± 1 neighbours).
function buildPageList(page, total) {
  const nums = new Set([1, total, page, page - 1, page + 1]);
  const sorted = [...nums].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const items = buildPageList(page, totalPages);
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn page-nav" disabled={page <= 1}
        onClick={() => onPage(page - 1)} aria-label="Previous page">
        <Icon name="chevleft" size={15} />
        <span className="page-nav-label">Prev</span>
      </button>
      <div className="page-nums">
        {items.map((it, i) => it === "…"
          ? <span key={"e" + i} className="page-ellipsis">…</span>
          : <button key={it} className="page-btn" data-active={it === page}
              aria-current={it === page ? "page" : undefined}
              onClick={() => onPage(it)}>{it}</button>
        )}
      </div>
      <button className="page-btn page-nav" disabled={page >= totalPages}
        onClick={() => onPage(page + 1)} aria-label="Next page">
        <span className="page-nav-label">Next</span>
        <Icon name="chevright" size={15} />
      </button>
    </nav>
  );
}

// ── Event card ───────────────────────────────────────────────
function formatTimeRange(startISO, endISO, tz) {
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : null;
  const optsDate = { weekday: "short", month: "short", day: "numeric" };
  const optsTime = { hour: "numeric", minute: "2-digit" };
  const dateStr = start.toLocaleDateString(undefined, optsDate);
  const timeStr = start.toLocaleTimeString(undefined, optsTime);
  let endStr = "";
  if (end && end - start < 24 * 3600 * 1000) {
    endStr = " – " + end.toLocaleTimeString(undefined, optsTime);
  }
  return `${dateStr} · ${timeStr}${endStr}`;
}

function EventCard({ entry, density, hovered, onHover, onLeave, pinned, onTogglePin }) {
  const e = entry.event;
  const cover = e.cover_url;
  const tz = e.timezone;
  const time = formatTimeRange(entry.start_at, e.end_at, tz);
  const past = new Date(entry.start_at) < new Date();
  const city = e.geo_address_info?.city_state || e.geo_address_info?.city || (e.location_type === "online" ? "Online" : "—");
  const venue = e.geo_address_info?.address || e.geo_address_info?.sublocality;
  const host = entry.hosts?.[0];
  const calName = entry.calendar?.name;
  const url = `https://lu.ma/${e.url}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="event-card"
      data-density={density}
      data-hovered={hovered ? "true" : "false"}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="cover">
        {cover
          ? <img src={cover} alt="" loading="lazy" onError={(ev) => { ev.target.style.display = 'none'; }} />
          : <div className="cover-fallback">[ event cover ]</div>}
      </div>
      <div className="card-body">
        <div className={"card-time " + (past ? "past" : "")}>
          <span className="dot"></span>
          {time}
        </div>
        <h3 className="card-title">{e.name}</h3>
        <div className="card-meta">
          <div className="card-meta-row">
            <Icon name={e.location_type === "online" ? "globe" : "pin"} size={12} />
            <span>{venue ? `${venue}, ${city}` : city}</span>
          </div>
          {host && (
            <div className="card-host">
              {host.avatar_url
                ? <span className="host-avatar" style={{ backgroundImage: `url(${host.avatar_url})` }}></span>
                : <span className="host-avatar"></span>}
              <span>by {calName || host.name}</span>
            </div>
          )}
        </div>
        <div className="card-tags">
          {entry.ticket_info?.is_free && <span className="tag accent">Free</span>}
          {entry.ticket_info?.require_approval && <span className="tag">Approval</span>}
          {entry.ticket_info?.spots_remaining > 0 && entry.ticket_info?.spots_remaining < 10 &&
            <span className="tag accent">{entry.ticket_info.spots_remaining} spots left</span>}
          {entry.waitlist_active && <span className="tag info">Waitlist</span>}
          {e.location_type === "online" && <span className="tag info">Online</span>}
        </div>
      </div>
      <button
        className="pin-btn"
        data-pinned={pinned ? "true" : "false"}
        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); onTogglePin(); }}
        title={pinned ? "Unsave" : "Save"}
      >
        <Icon name="bookmark" size={13} />
      </button>
    </a>
  );
}

// ── Skeleton ─────────────────────────────────────────────────
function SkeletonList({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="skeleton-card">
      <div className="skel skel-img"></div>
      <div>
        <div className="skel skel-line" style={{ width: "30%" }}></div>
        <div className="skel skel-line" style={{ width: "85%", height: 16 }}></div>
        <div className="skel skel-line" style={{ width: "55%" }}></div>
        <div className="skel skel-line" style={{ width: "40%" }}></div>
      </div>
    </div>
  ));
}

// ── Map ──────────────────────────────────────────────────────
// The basemap is OpenFreeMap's vector tiles (free: no API key, sign-up, or
// usage limits), drawn with MapLibre GL. Event pins and cluster bubbles are
// plain DOM markers so they follow the theme's CSS variables; Supercluster
// does the grouping.
const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark:  "https://tiles.openfreemap.org/styles/dark",
};
// MapLibre draws 512px tiles, so its zoom levels sit one below Leaflet's.
const MAP_MIN_ZOOM = 4;          // prevent zooming out beyond a regional view
const MAP_MAX_ZOOM = 17;
const MAP_FIT_PADDING = 20;
const MAP_CLUSTER_RADIUS = 55;   // px
// Keeps popups clear of the "Search this area" pill and the map's edges.
const MAP_POPUP_PADDING = { top: 56, right: 8, bottom: 8, left: 8 };

const MAP_PIN_SVG = `<svg viewBox="0 0 24 32" width="24" height="32" aria-hidden="true">
  <path class="map-pin-shape" d="M12 1c5.5 0 10 4.3 10 9.7 0 7.3-10 20.3-10 20.3S2 18 2 10.7C2 5.3 6.5 1 12 1z"/>
  <circle class="map-pin-dot" cx="12" cy="11" r="3.2"/>
</svg>`;

function mapBounds(b) {
  return [[b.west, b.south], [b.east, b.north]];
}

// Popup offsets for every anchor MapLibre may flip to near an edge, keeping the
// popup clear of a marker that reaches `up`px above its point, `down`px below
// it, and `side`px to either side.
function mapPopupOffsets(up, down, side) {
  return {
    "top": [0, down], "top-left": [0, down], "top-right": [0, down],
    "bottom": [0, -up], "bottom-left": [0, -up], "bottom-right": [0, -up],
    "left": [side, (down - up) / 2], "right": [-side, (down - up) / 2],
  };
}

function mapEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

// Cover image as a background, so a missing or broken image just leaves the
// placeholder tint behind.
function mapThumb(url, className) {
  const el = mapEl("div", className);
  if (url) el.style.backgroundImage = `url(${JSON.stringify(url)})`;
  return el;
}

// "Sep 28" (or "Sep 28, 7:00 PM") in the event's own time zone.
function mapWhen(entry, withTime) {
  const opts = withTime
    ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric" };
  const start = new Date(entry.start_at);
  try {
    return start.toLocaleString(undefined, { ...opts, timeZone: entry.event.timezone || undefined });
  } catch {
    return start.toLocaleString(undefined, opts); // unrecognised time zone
  }
}

// Owns the event markers and popups on a map. Only markers in and around the
// viewport exist at any time, so dense result sets stay fast.
function createEventLayer(map, { onHover }) {
  // Touch has no hover, so a tap previews an event and tapping the preview
  // opens it. Going by the last pointer used keeps hybrid devices right: a
  // mouse click opens straight away, a tap previews first.
  let lastPointer = window.matchMedia?.("(hover: none)").matches ? "touch" : "mouse";
  const trackPointer = (ev) => { lastPointer = ev.pointerType; };

  let events = new Map();   // event id → { entry, lngLat }
  let signature = null;
  let index = null;         // Supercluster over the current events
  let pins = new Map();     // event id → pin marker (built lazily, then reused)
  let shown = new Map();    // "p<event id>" / "c<cluster id>" → marker on the map
  let owner = new Map();    // event id → key of the marker (pin or cluster) showing it
  let covered = null;       // [w, s, e, n] the shown markers were computed for
  let coveredZoom = null;
  let frame = 0;
  let hoveredId = null;
  let hoveredEl = null;

  const popupOptions = {
    closeButton: false, closeOnClick: false, focusAfterOpen: false,
    maxWidth: "none", padding: MAP_POPUP_PADDING,
  };
  // Previews clear the pin (38px tall while enlarged) by a small gap.
  const tip = new maplibregl.Popup({ ...popupOptions, className: "map-tip-popup",
    offset: mapPopupOffsets(44, 6, 20) });
  const list = new maplibregl.Popup({ ...popupOptions, className: "map-list-popup",
    offset: mapPopupOffsets(32, 32, 32) });
  let tipId = null;
  let listKey = null;

  const eventUrl = (id) => `https://lu.ma/${events.get(id).entry.event.url}`;
  const openEvent = (id) => {
    if (events.has(id)) window.open(eventUrl(id), "_blank", "noopener");
  };

  function showTip(id, tapped) {
    const { entry, lngLat } = events.get(id);
    const body = mapEl("div", "map-tip-body");
    body.append(mapEl("div", "map-tip-title", entry.event.name || "Untitled"),
                mapEl("div", "map-tip-date", mapWhen(entry)));
    const content = mapEl("div", "map-tip");
    content.append(mapThumb(entry.event.cover_url, "map-tip-thumb"), body);
    // On touch the preview itself is the tap target that opens the event.
    if (tapped) content.addEventListener("click", () => openEvent(id));
    tip.setLngLat(lngLat).setDOMContent(content);
    if (!tip.isOpen()) tip.addTo(map);
    tip.getElement().classList.toggle("map-tip-tappable", tapped);
    tipId = id;
  }

  function hideTip() {
    tip.remove();
    tipId = null;
  }

  // Events at the same venue can't be split apart by zooming in, so their
  // cluster lists them instead.
  function showList(key, focusFirst) {
    const entries = index.getLeaves(Number(key.slice(1)), Infinity)
      .map(f => events.get(f.properties.id).entry)
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    const rows = mapEl("div", "map-list-rows");
    for (const entry of entries) {
      const id = entry.event.api_id;
      const row = mapEl("a", "map-list-row");
      row.href = eventUrl(id);
      row.target = "_blank";
      row.rel = "noopener noreferrer";
      const body = mapEl("div", "map-list-body");
      body.append(mapEl("div", "map-list-title", entry.event.name || "Untitled"),
                  mapEl("div", "map-list-date", mapWhen(entry, true)));
      row.append(mapThumb(entry.event.cover_url, "map-list-thumb"), body);
      row.addEventListener("pointerenter", (ev) => { if (ev.pointerType === "mouse") onHover(id); });
      row.addEventListener("pointerleave", (ev) => { if (ev.pointerType === "mouse") onHover(null); });
      row.addEventListener("focus", () => onHover(id));
      row.addEventListener("blur", () => onHover(null));
      rows.append(row);
    }
    const content = mapEl("div", "map-list");
    content.append(mapEl("div", "map-list-head", `${entries.length} events here`), rows);
    hideTip();
    list.setLngLat(shown.get(key).getLngLat()).setDOMContent(content);
    if (!list.isOpen()) list.addTo(map);
    listKey = key;
    if (focusFirst) rows.firstChild.focus();
  }

  function hideList() {
    list.remove();
    listKey = null;
  }

  function dismiss() {
    hideTip();
    hideList();
    onHover(null);
  }

  // Pointer hover (desktop) and keyboard focus preview a pin.
  function preview(id) {
    showTip(id, false);
    onHover(id);
  }

  function unpreview(id) {
    if (tipId === id) hideTip();
    onHover(null);
  }

  function activatePin(id) {
    if (lastPointer === "mouse") {
      openEvent(id);
      return;
    }
    // Touch: tapping a pin only previews it; tapping the preview opens it.
    hideList();
    showTip(id, true);
    onHover(id);
  }

  function activateCluster(key, fromKeyboard) {
    const center = shown.get(key).getLngLat();
    const zoom = index.getClusterExpansionZoom(Number(key.slice(1)));
    dismiss();
    if (zoom > map.getMaxZoom()) showList(key, fromKeyboard);
    else map.easeTo({ center, zoom });
  }

  const onActivateKey = (activate) => (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    ev.preventDefault();
    activate();
  };

  function pinFor(id) {
    if (pins.has(id)) return pins.get(id);
    const { entry, lngLat } = events.get(id);
    const el = mapEl("div", "map-marker");
    el.innerHTML = `<div class="map-pin">${MAP_PIN_SVG}</div>`;
    el.dataset.id = id;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${entry.event.name || "Untitled"}, ${mapWhen(entry)}`);
    el.addEventListener("pointerenter", (ev) => { if (ev.pointerType === "mouse") preview(id); });
    el.addEventListener("pointerleave", (ev) => { if (ev.pointerType === "mouse") unpreview(id); });
    el.addEventListener("focus", () => { if (el.matches(":focus-visible")) preview(id); });
    el.addEventListener("blur", () => unpreview(id));
    el.addEventListener("keydown", onActivateKey(() => openEvent(id)));
    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat(lngLat);
    pins.set(id, marker);
    return marker;
  }

  function clusterFor(key, count, lngLat) {
    const bubble = mapEl("div", "map-cluster");
    bubble.dataset.size = count < 10 ? "s" : count < 50 ? "m" : "l";
    bubble.append(mapEl("span", null, String(count)));
    const el = mapEl("div", "map-marker");
    el.append(bubble);
    el.dataset.cluster = key;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${count} events`);
    el.addEventListener("keydown", onActivateKey(() => activateCluster(key, true)));
    return new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(lngLat);
  }

  // Clicks on markers bubble up as map clicks, which MapLibre already drops
  // when the pointer moved, so dragging the map from a pin doesn't open it.
  const onClick = (e) => {
    const target = e.originalEvent.target;
    const el = target instanceof Element ? target.closest(".map-marker") : null;
    if (el?.dataset.id) activatePin(el.dataset.id);
    else if (el?.dataset.cluster) activateCluster(el.dataset.cluster, false);
    else dismiss(); // tapping the empty map dismisses any open preview
  };
  const onKeyDown = (ev) => { if (ev.key === "Escape") dismiss(); };

  // Brings the markers on the map in line with the clusters for the view.
  function update() {
    frame = 0;
    if (!index) return;
    const zoom = Math.round(map.getZoom());
    const b = map.getBounds();
    // Cover half a screen past each edge so short pans never reveal gaps.
    const dx = (b.getEast() - b.getWest()) / 2;
    const dy = (b.getNorth() - b.getSouth()) / 2;
    covered = [b.getWest() - dx, b.getSouth() - dy, b.getEast() + dx, b.getNorth() + dy];
    coveredZoom = zoom;

    const next = new Map();
    owner = new Map();
    for (const f of index.getClusters(covered, zoom)) {
      const p = f.properties;
      if (p.cluster) {
        const key = "c" + p.cluster_id;
        next.set(key, shown.get(key) || clusterFor(key, p.point_count, f.geometry.coordinates));
        for (const leaf of index.getLeaves(p.cluster_id, Infinity)) owner.set(leaf.properties.id, key);
      } else {
        const key = "p" + p.id;
        next.set(key, shown.get(key) || pinFor(p.id));
        owner.set(p.id, key);
      }
    }
    shown.forEach((marker, key) => { if (!next.has(key)) marker.remove(); });
    next.forEach((marker, key) => { if (!shown.has(key)) marker.addTo(map); });
    shown = next;

    // Close popups whose marker merged into a cluster or left the area.
    if (tipId && !shown.has("p" + tipId)) hideTip();
    if (listKey && !shown.has(listKey)) hideList();
    paintHover();
    syncTabStops();
  }

  // Only markers actually on screen are Tab stops; the rest sit in the margin
  // kept around the view for smooth panning.
  function syncTabStops() {
    const { clientWidth: w, clientHeight: h } = map.getContainer();
    shown.forEach((marker) => {
      const { x, y } = map.project(marker.getLngLat());
      marker.getElement().tabIndex = x >= 0 && y >= 0 && x <= w && y <= h ? 0 : -1;
    });
  }

  const onMove = () => {
    if (frame || !index) return;
    const b = map.getBounds();
    const inside = coveredZoom === Math.round(map.getZoom()) &&
      b.getWest() >= covered[0] && b.getSouth() >= covered[1] &&
      b.getEast() <= covered[2] && b.getNorth() <= covered[3];
    if (!inside) frame = requestAnimationFrame(update);
  };

  // Highlights the hovered event's pin, or the cluster it's hidden in.
  function paintHover() {
    const key = hoveredId && owner.get(hoveredId);
    const el = key ? shown.get(key).getElement() : null;
    if (el === hoveredEl) return;
    if (hoveredEl) delete hoveredEl.dataset.hovered;
    if (el) el.dataset.hovered = "true";
    hoveredEl = el;
  }

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    shown.forEach(marker => marker.remove());
    shown = new Map();
    owner = new Map();
    pins = new Map();
    covered = coveredZoom = null;
    hoveredEl = null;
    hideTip();
    hideList();
  }

  function setEntries(entries) {
    const next = new Map();
    for (const entry of entries) {
      const id = entry?.event?.api_id;
      const c = entry?.event?.coordinate;
      const lngLat = [parseFloat(c?.longitude), parseFloat(c?.latitude)];
      if (id && lngLat.every(Number.isFinite)) next.set(id, { entry, lngLat });
    }
    events = next;
    // Re-sorting or saving an event hands back the same events: keep the
    // markers (and any open popup) rather than rebuilding them.
    const ids = [...next.keys()].sort();
    const sig = ids.map(id => `${id}@${next.get(id).lngLat}`).join("|");
    if (sig === signature) return;
    signature = sig;
    clear();
    index = new Supercluster({ radius: MAP_CLUSTER_RADIUS, maxZoom: MAP_MAX_ZOOM }).load(
      ids.map(id => ({
        type: "Feature",
        properties: { id },
        geometry: { type: "Point", coordinates: next.get(id).lngLat },
      }))
    );
    update();
  }

  const canvas = map.getCanvasContainer();
  canvas.addEventListener("pointerdown", trackPointer, true);
  map.getContainer().addEventListener("keydown", onKeyDown);
  map.on("move", onMove);
  map.on("moveend", syncTabStops);
  map.on("click", onClick);

  return {
    setEntries,
    setHovered(id) {
      hoveredId = id;
      paintHover();
    },
    destroy() {
      clear();
      index = null;
      canvas.removeEventListener("pointerdown", trackPointer, true);
      map.getContainer().removeEventListener("keydown", onKeyDown);
      map.off("move", onMove);
      map.off("moveend", syncTabStops);
      map.off("click", onClick);
    },
  };
}

function MapView({ entries, bbox, onChange, hoveredId, onHover, loading, theme }) {
  const containerRef = useR(null);
  const mapRef = useR(null);
  const layerRef = useR(null);
  const styleRef = useR(null);
  const moveTimer = useR(null);
  const bboxRef = useR(bbox);
  const onHoverRef = useR(onHover);
  bboxRef.current = bbox;
  onHoverRef.current = onHover;
  const [pendingArea, setPendingArea] = useS(false);
  const [failed, setFailed] = useS(false);

  // Init map once
  useE(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    const b = bboxRef.current;
    const style = MAP_STYLES[theme] || MAP_STYLES.light;
    // On mobile the map can be initialised while its pane is hidden (list view),
    // so the container has no size and fitting the bbox would be meaningless.
    // Only fit now if we have real dimensions; otherwise fit once it's shown.
    const hasSize = container.clientWidth > 0 && container.clientHeight > 0;
    let map;
    try {
      if (typeof maplibregl === "undefined" || typeof Supercluster === "undefined") {
        throw new Error("map scripts failed to load");
      }
      map = new maplibregl.Map({
        container,
        style,
        ...(hasSize
          ? { bounds: mapBounds(b), fitBoundsOptions: { padding: MAP_FIT_PADDING } }
          : { center: [(b.east + b.west) / 2, (b.north + b.south) / 2], zoom: 8 }),
        minZoom: MAP_MIN_ZOOM,
        maxZoom: MAP_MAX_ZOOM,
        // Flat and north-up: no rotating or tilting.
        dragRotate: false,
        touchPitch: false,
        maxPitch: 0,
        attributionControl: {
          customAttribution: '<a href="https://maplibre.org/" target="_blank">MapLibre</a>',
        },
      });
    } catch (err) {
      // No WebGL, or the scripts were blocked: the list still works without it.
      console.error("Map unavailable:", err);
      setFailed(true);
      return;
    }
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;
    styleRef.current = style;
    layerRef.current = createEventLayer(map, { onHover: (id) => onHoverRef.current(id) });

    // "Search this area" is for moves the user makes, not our own fits or the
    // container resizing (e.g. switching between list and map on mobile).
    let resizing = false;
    const handleResize = () => {
      resizing = true;
      Promise.resolve().then(() => { resizing = false; });
    };
    const handleMoveEnd = (e) => {
      if (e.programmatic || resizing) return;
      clearTimeout(moveTimer.current);
      moveTimer.current = setTimeout(() => setPendingArea(true), 250);
    };
    map.on("resize", handleResize);
    map.on("moveend", handleMoveEnd);

    // Run the deferred initial fit once a hidden container gets a size.
    const sizeObserver = new ResizeObserver(() => {
      if (!container.clientWidth || !container.clientHeight) return;
      sizeObserver.disconnect();
      map.resize();
      map.fitBounds(mapBounds(bboxRef.current),
        { padding: MAP_FIT_PADDING, animate: false }, { programmatic: true });
    });
    if (!hasSize) sizeObserver.observe(container);

    return () => {
      sizeObserver.disconnect();
      clearTimeout(moveTimer.current);
      layerRef.current.destroy();
      layerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line
  }, []);

  // Follow the app theme. Both styles share their tiles, so MapLibre diffs the
  // style in place rather than reloading the map.
  useE(() => {
    const map = mapRef.current;
    const style = MAP_STYLES[theme] || MAP_STYLES.light;
    if (!map || styleRef.current === style) return;
    styleRef.current = style;
    map.setStyle(style);
  }, [theme]);

  // Update markers when entries change
  useE(() => { layerRef.current?.setEntries(entries); }, [entries]);

  // Update hover state on existing markers (without rebuilding)
  useE(() => { layerRef.current?.setHovered(hoveredId); }, [hoveredId]);

  // When the parent commits a new bbox (after a search), hide the pending button.
  useE(() => { setPendingArea(false); }, [bbox]);

  const searchThisArea = () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    // After panning across the date line MapLibre reports longitudes past ±180;
    // shift everything back by the same whole turns as the center.
    const c = map.getCenter();
    const center = c.wrap();
    const shift = center.lng - c.lng;
    setPendingArea(false);
    onChange({
      west:  b.getWest() + shift,
      east:  b.getEast() + shift,
      south: b.getSouth(),
      north: b.getNorth(),
    }, { lat: center.lat, lng: center.lng });
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12 });
    });
  };

  return (
    <>
      <div ref={containerRef} id="map"></div>
      {failed && (
        <div className="map-fallback">
          <div className="state">
            <div className="state-icon"><Icon name="map" size={18} /></div>
            <div className="state-title">Map unavailable</div>
            <div>This browser couldn't start the map. The event list still works.</div>
          </div>
        </div>
      )}
      {pendingArea && (
        <button className="map-search-area" onClick={searchThisArea} disabled={loading}>
          <Icon name="search" size={13} />
          {loading ? "Searching…" : "Search this area"}
        </button>
      )}
      {!failed && (
        <div className="map-controls">
          <button className="map-btn" title="Find my location" aria-label="Find my location" onClick={locate}>
            <Icon name="target" size={16} />
          </button>
        </div>
      )}
    </>
  );
}

// ── Advanced filters sheet ───────────────────────────────────
function AdvancedFilters({ filters, defaults, onChange, onClose, onReset }) {
  const [local, setLocal] = useS(filters);
  const set = (k, v) => setLocal(f => ({ ...f, [k]: v }));

  const apply = () => { onChange(local); onClose(); };

  return (
    <div className="adv-backdrop" onClick={onClose}>
      <div className="adv-sheet" onClick={e => e.stopPropagation()}>
        <div className="adv-head">
          <div className="adv-title">Advanced filters</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="adv-body">
          <div className="adv-row span2">
            <label>Keywords (all must match)</label>
            <input className="adv-input" type="text" value={local.keywords}
              onChange={e => set("keywords", e.target.value)}
              placeholder="e.g. founder dinner" />
          </div>
          <div className="adv-row span2">
            <label>Exclude keywords (comma or space separated)</label>
            <input className="adv-input" type="text" value={local.excludeKeywords}
              onChange={e => set("excludeKeywords", e.target.value)}
              placeholder="e.g. webinar, virtual" />
          </div>

          <div className="adv-row">
            <label>Date from</label>
            <input className="adv-input" type="date" value={local.dateFrom}
              onChange={e => set("dateFrom", e.target.value)} />
          </div>
          <div className="adv-row">
            <label>Date to</label>
            <input className="adv-input" type="date" value={local.dateTo}
              onChange={e => set("dateTo", e.target.value)} />
          </div>

          <div className="adv-row">
            <label>Location type</label>
            <div className="seg">
              {[["any","Any"],["offline","In-person"],["online","Online"]].map(([v,l]) => (
                <button key={v} data-active={local.locationType === v}
                  onClick={() => set("locationType", v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="adv-row">
            <label>Price</label>
            <div className="seg">
              {[["any","Any"],["free","Free"],["paid","Paid"]].map(([v,l]) => (
                <button key={v} data-active={local.priceMode === v}
                  onClick={() => set("priceMode", v)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="adv-row">
            <label>City contains</label>
            <input className="adv-input" type="text" value={local.cityContains}
              onChange={e => set("cityContains", e.target.value)}
              placeholder="e.g. Austin" />
          </div>
          <div className="adv-row">
            <label>Time of day</label>
            <div className="seg">
              {[["any","Any"],["morning","AM"],["afternoon","Noon"],["evening","PM"]].map(([v,l]) => (
                <button key={v} data-active={local.timeOfDay === v}
                  onClick={() => set("timeOfDay", v)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="adv-row">
            <label>Approval required</label>
            <div className="seg">
              {[["any","Any"],["yes","Yes"],["no","No"]].map(([v,l]) => (
                <button key={v} data-active={local.approval === v}
                  onClick={() => set("approval", v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="adv-row">
            <label>Other</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, textTransform: "none", letterSpacing: 0, color: "var(--text)", fontWeight: 400 }}>
                <input type="checkbox" checked={local.hasSpots}
                  onChange={e => set("hasSpots", e.target.checked)} />
                Has spots remaining
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, textTransform: "none", letterSpacing: 0, color: "var(--text)", fontWeight: 400 }}>
                <input type="checkbox" checked={local.verifiedOnly}
                  onChange={e => set("verifiedOnly", e.target.checked)} />
                Verified hosts only
              </label>
            </div>
          </div>
        </div>
        <div className="adv-foot">
          <div className="left">
            <button className="btn btn-ghost btn-sm" onClick={() => setLocal(defaults)}>
              Reset
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={apply}>Apply filters</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tweaks panel ─────────────────────────────────────────────
function DiscoverTweaks({ tweaks, setTweak, theme, setTheme }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme" />
      <TweakRadio label="Mode" value={theme}
        options={[{value:"light",label:"Light"},{value:"dark",label:"Dark"}]}
        onChange={v => setTheme(v)} />
      <TweakRadio label="Accent" value={tweaks.accent}
        options={[{value:"warm",label:"Warm"},{value:"cool",label:"Cool"},{value:"green",label:"Green"}]}
        onChange={v => {
          setTweak('accent', v);
          const map = { warm: 38, cool: 230, green: 145 };
          document.documentElement.style.setProperty('--accent', `oklch(62% 0.14 ${map[v]})`);
          document.documentElement.style.setProperty('--accent-soft', `oklch(94% 0.04 ${map[v]})`);
          document.documentElement.style.setProperty('--accent-fg', `oklch(28% 0.08 ${map[v]})`);
        }} />

      <TweakSection label="Layout" />
      <TweakRadio label="Map side" value={tweaks.layout}
        options={[{value:"map-right",label:"Right"},{value:"map-left",label:"Left"}]}
        onChange={v => setTweak('layout', v)} />
      <TweakToggle label="Show map" value={tweaks.showMap}
        onChange={v => setTweak('showMap', v)} />

      <TweakSection label="Cards" />
      <TweakRadio label="Density" value={tweaks.density}
        options={[{value:"compact",label:"Compact"},{value:"medium",label:"Medium"},{value:"large",label:"Large"}]}
        onChange={v => setTweak('density', v)} />
      <TweakSlider label="Corner radius" value={tweaks.radius} min={0} max={24} unit="px"
        onChange={v => {
          setTweak('radius', v);
          document.documentElement.style.setProperty('--r-lg', `${v}px`);
          document.documentElement.style.setProperty('--r-md', `${Math.max(0, v-4)}px`);
        }} />

      <TweakSection label="Type" />
      <TweakRadio label="Font" value={tweaks.fontPair}
        options={[{value:"inter",label:"Inter"},{value:"sohne",label:"Mono"}]}
        onChange={v => {
          setTweak('fontPair', v);
          if (v === "sohne") {
            document.documentElement.style.setProperty('--font-display', '"JetBrains Mono", ui-monospace, monospace');
          } else {
            document.documentElement.style.setProperty('--font-display', '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif');
          }
        }} />
    </TweaksPanel>
  );
}

Object.assign(window, { Icon, FilterBar, ResultsHeader, Pagination,
  EventCard, SkeletonList, MapView, AdvancedFilters, DiscoverTweaks,
  SORT_OPTIONS });
