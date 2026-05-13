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

function FilterBar({ keywords, onKeywords, sortId, sortMenuOpen, onToggleSortMenu, onSelectSort,
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

      <div className="menu-rel">
        <button className="chip" onClick={onToggleCategoryMenu}>
          Category: {categoryLabel}
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

      <div className="menu-rel">
        <button className="chip" onClick={onToggleSortMenu}>
          Sort: {SORT_OPTIONS.find(s => s.id === sortId)?.label.replace(" first", "")}
          <Icon name="chevdown" size={13} />
        </button>
        {sortMenuOpen && (
          <div className="menu" onMouseLeave={() => onToggleSortMenu()}>
            {SORT_OPTIONS.map(o => (
              <button key={o.id} data-active={o.id === sortId} onClick={() => onSelectSort(o.id)}>
                {o.label}
                {o.id === sortId && <span className="check"><Icon name="check" size={13} /></span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {pinnedCount > 0 && (
        <button className="chip" data-active={showPinnedOnly} onClick={onTogglePinned}>
          <Icon name="bookmark" size={13} />
          Saved
          <span className="chip-count">{pinnedCount}</span>
        </button>
      )}

      <div style={{ flex: 1 }} />

      <button className="btn" onClick={onSearch} disabled={loading}>
        <Icon name="refresh" size={13} />
        {loading ? "Searching…" : "Refresh"}
      </button>

      <button className="btn btn-ghost btn-icon" onClick={onToggleTheme} title="Toggle theme (T)">
        <Icon name={theme === "light" ? "moon" : "sun"} size={15} />
      </button>
      <a className="btn btn-ghost btn-icon" href="https://github.com/usmank06/Luma-Discover" target="_blank" rel="noopener noreferrer" title="View on GitHub">
        <Icon name="github" size={15} />
      </a>
    </div>
  );
}

// ── Results header ───────────────────────────────────────────
function ResultsHeader({ count, total, loading, sortLabel, hasMore, cap, fetchingAll, onFetchAll, rateState }) {
  const capped = hasMore && total >= (cap || Infinity);
  const headline = capped ? `${total}+ events` : `${count} ${count === 1 ? "event" : "events"}`;
  const filteredOut = total - count;

  const now = Date.now();
  const waiting = rateState && rateState.waitingUntil > now;
  const waitS = waiting ? Math.max(1, Math.ceil((rateState.waitingUntil - now) / 1000)) : 0;
  const lowBudget = rateState && rateState.limit > 0 && rateState.remaining <= 5 && !waiting;

  return (
    <div className="results-header">
      <h2 className="results-count">
        {headline}
        {!capped && filteredOut > 0 && <em> · {filteredOut} filtered</em>}
      </h2>
      <div className="results-meta">
        {hasMore && (
          <button
            className="btn btn-sm"
            onClick={onFetchAll}
            disabled={fetchingAll || loading || waiting}
            title="Page through every available event"
          >
            {fetchingAll ? "Fetching all…" : "Fetch all"}
          </button>
        )}
        {waiting && (
          <span className="rate-pill" title="Rate-limited by the upstream API; we'll resume automatically">
            <Icon name="alert" size={12} />
            Rate-limited · resuming in {waitS}s
          </span>
        )}
        {!waiting && lowBudget && (
          <span className="rate-pill rate-pill-soft" title={`${rateState.remaining}/${rateState.limit} requests left in this window`}>
            Slowing down · {rateState.remaining} left
          </span>
        )}
        {loading && !waiting && <span className="dot-pulse">Updating…</span>}
        <span style={{ opacity: 0.6 }}>·</span>
        <span>{sortLabel}</span>
      </div>
    </div>
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
function MapView({ entries, bbox, onChange, hoveredId, onHover, loading, theme }) {
  const containerRef = useR(null);
  const mapRef = useR(null);
  const markersRef = useR({});
  const moveTimer = useR(null);

  // Init map once
  useE(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).fitBounds([
      [bbox.south, bbox.west],
      [bbox.north, bbox.east],
    ], { padding: [20, 20] });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      attribution: '© OpenStreetMap, © CARTO',
    }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      pane: "shadowPane",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    const handleMove = () => {
      clearTimeout(moveTimer.current);
      moveTimer.current = setTimeout(() => {
        const b = map.getBounds();
        const newBbox = {
          west:  b.getWest(),
          east:  b.getEast(),
          south: b.getSouth(),
          north: b.getNorth(),
        };
        const c = map.getCenter();
        onChange(newBbox, { lat: c.lat, lng: c.lng });
      }, 250);
    };
    map.on("moveend", handleMove);
    map.on("zoomend", handleMove);

    return () => {
      map.off("moveend", handleMove);
      map.off("zoomend", handleMove);
    };
  // eslint-disable-next-line
  }, []);

  // Update markers when entries change
  useE(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

    entries.forEach((entry) => {
      const c = entry.event.coordinate;
      if (!c) return;
      const id = entry.event.api_id;
      const e = entry.event;
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-pin" data-id="${id}" data-hovered="${hoveredId === id}">
          <svg viewBox="0 0 24 32" width="24" height="32" aria-hidden="true">
            <path class="map-pin-shape" d="M12 1c5.5 0 10 4.3 10 9.7 0 7.3-10 20.3-10 20.3S2 18 2 10.7C2 5.3 6.5 1 12 1z"/>
            <circle class="map-pin-dot" cx="12" cy="11" r="3.2"/>
          </svg>
        </div>`,
        iconSize: [24, 32],
        iconAnchor: [12, 32],
      });

      const startDate = new Date(entry.start_at);
      const dateLabel = startDate.toLocaleDateString(undefined, {
        month: "short", day: "numeric",
        timeZone: e.timezone || undefined,
      });

      const tipHtml = `
        <div class="map-tip">
          ${e.cover_url ? `<div class="map-tip-thumb" style="background-image:url('${escapeHtml(e.cover_url)}')"></div>` : `<div class="map-tip-thumb map-tip-thumb-fallback"></div>`}
          <div class="map-tip-body">
            <div class="map-tip-title">${escapeHtml(e.name || "Untitled")}</div>
            <div class="map-tip-date">${escapeHtml(dateLabel)}</div>
          </div>
        </div>`;

      const marker = L.marker([c.latitude, c.longitude], { icon })
        .addTo(map)
        .bindTooltip(tipHtml, {
          direction: "top",
          offset: [0, -28],
          opacity: 1,
          className: "map-tip-tooltip",
          sticky: false,
        });
      marker.on("mouseover", () => onHover(id));
      marker.on("mouseout", () => onHover(null));
      marker.on("click", () => window.open(`https://lu.ma/${entry.event.url}`, "_blank"));
      markersRef.current[id] = marker;
    });
  }, [entries]);

  // Update hover state on existing pins (without rebuilding)
  useE(() => {
    document.querySelectorAll(".map-pin").forEach(el => {
      const id = el.dataset.id;
      el.dataset.hovered = (id === hoveredId) ? "true" : "false";
    });
  }, [hoveredId]);

  // Resize when layout changes
  useE(() => {
    setTimeout(() => mapRef.current?.invalidateSize(), 200);
  });

  return (
    <>
      <div ref={containerRef} id="map"></div>
      <div className="map-controls">
        <button className="map-btn" title="Find my location" onClick={() => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(pos => {
            mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 13);
          });
        }}>
          <Icon name="target" size={16} />
        </button>
      </div>
    </>
  );
}

// ── Advanced filters sheet ───────────────────────────────────
function AdvancedFilters({ filters, onChange, onClose, onReset }) {
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
            <button className="btn btn-ghost btn-sm" onClick={() => { setLocal(FILTER_DEFAULTS); }}>
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

Object.assign(window, { Icon, FilterBar, ResultsHeader,
  EventCard, SkeletonList, MapView, AdvancedFilters, DiscoverTweaks,
  SORT_OPTIONS, FILTER_DEFAULTS });
