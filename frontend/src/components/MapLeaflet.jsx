/**
 * MapLeaflet.jsx
 * Pure Leaflet map — NO API KEY REQUIRED.
 * Uses OpenStreetMap tiles (free, public, no key).
 * Includes live GPS watchPosition tracking with accuracy circle.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';

/* ── Fix default broken marker icons in Vite ──────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Category pin colours ─────────────────────────────────────── */
const CAT = {
  MESS_TIFFIN:      { color: '#f59e0b', emoji: '🍲' },
  PG_ACCOMMODATION: { color: '#3b82f6', emoji: '🏠' },
  HOSTEL:           { color: '#6366f1', emoji: '🏢' },
  GYM_FITNESS:      { color: '#a855f7', emoji: '💪' },
  HOSPITAL_CLINIC:  { color: '#10b981', emoji: '🏥' },
  OTHER:            { color: '#64748b', emoji: '📍' },
};

function amenityIcon(category, highlighted) {
  const { color, emoji } = CAT[category] || CAT.OTHER;
  const s = highlighted ? 46 : 36;
  return L.divIcon({
    className: '',
    iconSize:   [s, s],
    iconAnchor: [s / 2, s],
    popupAnchor:[0, -s],
    html: `<div style="width:${s}px;height:${s}px;background:#fff;border:3px solid ${color};
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      box-shadow:0 4px 12px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:${highlighted?19:14}px;line-height:1;">${emoji}</span>
    </div>`,
  });
}

function userDotIcon() {
  return L.divIcon({
    className: '',
    iconSize:   [24, 24],
    iconAnchor: [12, 12],
    html: `<div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,.18);
        animation:np-pulse 1.8s ease-out infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;width:12px;height:12px;border-radius:50%;
        background:#2563eb;border:2.5px solid #fff;transform:translate(-50%,-50%);
        box-shadow:0 0 0 2px rgba(37,99,235,.4);"></div>
    </div>`,
  });
}

/* Inject pulse animation once */
(function injectPulse() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('np-map-styles')) return;
  const el = document.createElement('style');
  el.id = 'np-map-styles';
  el.textContent = `
    @keyframes np-pulse {
      0%   { transform:scale(.5); opacity:1; }
      80%,100% { transform:scale(2.6); opacity:0; }
    }
    .np-map-container .leaflet-popup-content-wrapper {
      border-radius:14px!important;padding:0!important;overflow:hidden;
      box-shadow:0 8px 24px rgba(0,0,0,.14)!important;
    }
    .np-map-container .leaflet-popup-content { margin:0!important; }
  `;
  document.head.appendChild(el);
})();

/* ── Popup HTML builder ───────────────────────────────────────── */
function popupHtml(item) {
  const img    = item.coverImage || (Array.isArray(item.images) && item.images[0]) ||
                 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format';
  const price  = item.startingPrice ? `₹${Number(item.startingPrice).toLocaleString('en-IN')}` : '—';
  const rating = item.totalReviews > 0 && item.averageRating ? Number(item.averageRating).toFixed(1) : 'New';
  return `
    <div style="width:220px;font-family:Inter,system-ui,sans-serif;font-size:13px;">
      <img src="${img}" alt="${item.name}"
           style="width:100%;height:108px;object-fit:cover;display:block;"
           onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'"/>
      <div style="padding:10px 12px;">
        <div style="font-size:10px;font-weight:700;color:#0284c7;text-transform:uppercase;letter-spacing:.5px;">
          ${(item.category||'').replace(/_/g,' ')}
        </div>
        <div style="font-size:13px;font-weight:800;color:#0f172a;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${item.name}
        </div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">📍 ${item.locality||item.city||''}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9;">
          <div><span style="font-size:14px;font-weight:800;color:#0f172a;">${price}</span>
               <span style="font-size:10px;color:#64748b;">/mo</span></div>
          <div style="font-size:11px;font-weight:700;color:#b45309;background:#fef3c7;padding:2px 7px;border-radius:6px;">★ ${rating}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;">
          <a href="/amenities/${item.id}"
             style="flex:1;text-align:center;background:#0284c7;color:#fff;padding:7px 0;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none;">
            View Details
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}"
             target="_blank" rel="noreferrer"
             style="background:#f1f5f9;color:#334155;padding:7px 10px;border-radius:8px;font-size:12px;text-decoration:none;" title="Directions">
            🗺️
          </a>
        </div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */
export default function MapLeaflet({
  amenities    = [],
  highlightedId = null,
  onSelectAmenity = () => {},
  center       = [12.9352, 77.6245],  // Koramangala fallback
  zoom         = 13,
  userCoords   = null,                 // { lat, lng } from locality hub
  onUserLocated = () => {},            // callback when live GPS arrives
}) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const markersRef      = useRef({});
  const userMarkerRef   = useRef(null);
  const accuracyRef     = useRef(null);
  const watchRef        = useRef(null);
  const firstFixRef     = useRef(false);

  const [tracking, setTracking]   = useState(false);   // watchPosition active
  const [locating, setLocating]   = useState(false);   // waiting for first fix
  const [gpsInfo,  setGpsInfo]    = useState(null);    // { lat, lng, acc }
  const [gpsError, setGpsError]   = useState('');

  /* ── 1. Init map (once) ─────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    /* OpenStreetMap — completely FREE, no API key */
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    mapRef.current = map;

    return () => {
      stopTracking();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line

  /* ── 2. Move map when locality hub changes ──────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userCoords) return;
    if (!tracking) {
      map.setView([userCoords.lat, userCoords.lng], map.getZoom(), { animate: true });
    }
  }, [userCoords]); // eslint-disable-line

  /* ── 3. Amenity markers ─────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const latlngs = [];

    amenities.forEach(item => {
      if (item.latitude == null || item.longitude == null) return;
      const ll = [Number(item.latitude), Number(item.longitude)];
      latlngs.push(ll);

      const marker = L.marker(ll, {
        icon: amenityIcon(item.category, item.id === highlightedId),
      }).addTo(map);

      marker.bindPopup(popupHtml(item), { maxWidth: 240, closeButton: true });
      marker.on('click', () => { onSelectAmenity(item.id); marker.openPopup(); });
      markersRef.current[item.id] = marker;
    });

    if (latlngs.length > 0 && !highlightedId) {
      map.fitBounds(latlngs, { padding: [50, 50], maxZoom: 15 });
    }
  }, [amenities]); // eslint-disable-line

  /* ── 4. Fly to highlighted card ─────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !highlightedId) return;
    const m = markersRef.current[highlightedId];
    if (m) {
      map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.7 });
      m.openPopup();
    }
  }, [highlightedId]); // eslint-disable-line

  /* ── Live GPS helpers ────────────────────────────────────────── */
  const stopTracking = useCallback(() => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    userMarkerRef.current?.remove();  userMarkerRef.current = null;
    accuracyRef.current?.remove();    accuracyRef.current   = null;
    firstFixRef.current = false;
    setTracking(false);
    setLocating(false);
    setGpsInfo(null);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Your browser does not support Geolocation.');
      return;
    }
    setGpsError('');
    setLocating(true);

    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
        const map = mapRef.current;
        if (!map) return;

        setLocating(false);
        setTracking(true);
        setGpsInfo({ lat, lng, acc: Math.round(acc) });

        /* User dot */
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker([lat, lng], {
            icon: userDotIcon(),
            zIndexOffset: 9999,
          }).addTo(map).bindPopup('<b>📍 You are here</b>', { closeButton: false });
        } else {
          userMarkerRef.current.setLatLng([lat, lng]);
        }

        /* Accuracy ring */
        if (!accuracyRef.current) {
          accuracyRef.current = L.circle([lat, lng], {
            radius: acc,
            color: '#2563eb', fillColor: '#2563eb',
            fillOpacity: 0.1, weight: 1.5,
          }).addTo(map);
        } else {
          accuracyRef.current.setLatLng([lat, lng]);
          accuracyRef.current.setRadius(acc);
        }

        onUserLocated({ lat, lng });

        /* Fly once on first fix */
        if (!firstFixRef.current) {
          firstFixRef.current = true;
          map.flyTo([lat, lng], 16, { duration: 1.4 });
        }
      },
      err => {
        setLocating(false);
        stopTracking();
        if (err.code === 1) {
          setGpsError('Location access denied. Please allow it in your browser settings then try again.');
        } else if (err.code === 2) {
          setGpsError('Location unavailable. Make sure GPS/Location is enabled on your device.');
        } else {
          setGpsError('Location request timed out. Try again.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  }, [stopTracking, onUserLocated]);

  const toggleTracking = () => tracking || locating ? stopTracking() : startTracking();

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="np-map-container relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">

      {/* Map canvas — must have explicit height */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />

      {/* ── Locate-Me button (sits above zoom controls) ── */}
      <div className="absolute bottom-24 right-3 z-[500] flex flex-col items-end gap-1.5">
        <button
          onClick={toggleTracking}
          title={tracking ? 'Stop live tracking' : 'Track my live location'}
          className={`w-9 h-9 rounded-full shadow-lg border flex items-center justify-center transition-all
            ${tracking
              ? 'bg-blue-600 border-blue-500 text-white'
              : locating
              ? 'bg-blue-50  border-blue-300 text-blue-500'
              : 'bg-white    border-slate-300 text-slate-600 hover:bg-slate-50'}`}
        >
          {locating ? (
            /* Spinner */
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75"/>
            </svg>
          ) : (
            /* Crosshair */
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" fill={tracking ? 'white' : 'none'}/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
              <circle cx="12" cy="12" r="8" strokeDasharray="3 2"/>
            </svg>
          )}
        </button>

        {tracking && (
          <span className="bg-blue-600 text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full shadow flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"/>LIVE
          </span>
        )}
      </div>

      {/* GPS info pill — shows real coordinates */}
      {gpsInfo && (
        <div className="absolute top-3 left-3 z-[500] bg-blue-600 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"/>
          <span>
            {gpsInfo.lat.toFixed(5)}, {gpsInfo.lng.toFixed(5)}
            <span className="ml-1.5 opacity-75">±{gpsInfo.acc}m</span>
          </span>
        </div>
      )}

      {/* Error banner */}
      {gpsError && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] max-w-xs w-[90%]
            bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg text-center">
          {gpsError}
          <button className="ml-2 underline opacity-80 hover:opacity-100 text-xs" onClick={() => setGpsError('')}>✕</button>
        </div>
      )}

      {/* Loading banner */}
      {locating && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600]
            bg-white border border-blue-200 text-blue-700 text-xs font-semibold px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75"/>
          </svg>
          Getting your location…
        </div>
      )}

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow border border-slate-200/80 text-[11px] hidden sm:flex items-center gap-3 flex-wrap">
        <span className="font-semibold text-slate-600">Legend:</span>
        <span className="text-amber-700 font-medium">🍲 Mess</span>
        <span className="text-blue-700 font-medium">🏠 PG</span>
        <span className="text-indigo-700 font-medium">🏢 Hostel</span>
        <span className="text-purple-700 font-medium">💪 Gym</span>
        <span className="text-emerald-700 font-medium">🏥 Clinic</span>
        {tracking && <span className="text-blue-600 font-semibold border-l border-slate-200 pl-3">🔵 You (live)</span>}
      </div>
    </div>
  );
}
