import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Navigation,
  List,
  Map as MapIcon,
} from 'lucide-react';
import { amenitiesApi } from '../services/api';
import AmenityCard from '../components/AmenityCard';
import MapLeaflet from '../components/MapLeaflet';
import { reverseGeocode } from '../utils/locationAndMedia';

const CATEGORIES = [
  { id: 'ALL',              label: 'All Services' },
  { id: 'MESS_TIFFIN',     label: '🍲 Mess & Tiffins' },
  { id: 'PG_ACCOMMODATION',label: '🏠 PG & Co-Living' },
  { id: 'HOSTEL',          label: '🏢 Hostels' },
  { id: 'GYM_FITNESS',     label: '💪 Gyms & Fitness' },
  { id: 'HOSPITAL_CLINIC', label: '🏥 Clinics & Medical' },
];

export default function ExplorePage() {
  const [searchParams] = useSearchParams();

  // ── Filters ───────────────────────────────────────────────────
  const [search,      setSearch]      = useState(searchParams.get('search')   || '');
  const [category,    setCategory]    = useState(searchParams.get('category') || 'ALL');
  const [maxPrice,    setMaxPrice]    = useState(searchParams.get('maxPrice') || '');
  const [minRating,   setMinRating]   = useState(searchParams.get('minRating')|| '');
  const [maxDistance, setMaxDistance] = useState(searchParams.get('maxDistance')||'');
  const [isAvailable, setIsAvailable] = useState(searchParams.get('isAvailable') === 'true');
  const [sortBy,      setSortBy]      = useState(searchParams.get('sortBy')   || 'nearest');

  // ── Live GPS ───────────────────────────────────────────────────
  const [userCoords, setUserCoords]   = useState(null);   // { lat, lng }
  const [locating,   setLocating]     = useState(false);
  const [locLabel,   setLocLabel]     = useState('Waiting for location…');
  const watchRef                      = useRef(null);

  // ── Results & UI ───────────────────────────────────────────────
  const [amenities,     setAmenities]     = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);

  // ── Start live GPS on mount ────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocLabel('Geolocation not supported');
      return;
    }
    setLocating(true);
    let lastGeoKey = '';
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setLocating(false);

        const geoKey = `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`;
        if (geoKey !== lastGeoKey) {
          lastGeoKey = geoKey;
          const geo = await reverseGeocode(coords.lat, coords.lng);
          if (geo?.shortLabel) {
            setLocLabel(geo.shortLabel);
            return;
          }
        }
        setLocLabel((prev) =>
          prev === 'Waiting for location…'
            ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
            : prev
        );
      },
      err => {
        setLocating(false);
        if (err.code === 1) setLocLabel('Location denied – allow it in browser');
        else                setLocLabel('Location unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  // ── Re-fetch when coords or filters change ─────────────────────
  useEffect(() => {
    if (!userCoords) return;   // wait for first GPS fix before fetching
    fetchAmenities();
  }, [userCoords, category, maxPrice, minRating, maxDistance, isAvailable, sortBy]);

  const fetchAmenities = async () => {
    if (!userCoords) return;
    setLoading(true);
    try {
      const res = await amenitiesApi.getAmenities({
        category:    category !== 'ALL' ? category : undefined,
        search:      search.trim() || undefined,
        maxPrice:    maxPrice    || undefined,
        minRating:   minRating   || undefined,
        maxDistance: maxDistance || undefined,
        isAvailable: isAvailable ? 'true' : undefined,
        sortBy,
        userLat:     userCoords.lat,
        userLng:     userCoords.lng,
      });
      if (res.data.success) setAmenities(res.data.amenities);
    } catch (e) {
      console.error('Failed to fetch amenities:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = e => { e.preventDefault(); fetchAmenities(); };

  const handleResetFilters = () => {
    setSearch(''); setCategory('ALL'); setMaxPrice('');
    setMinRating(''); setMaxDistance(''); setIsAvailable(false);
    setSortBy('nearest');
  };

  // Called by MapLeaflet when it gets a live fix (keeps both in sync)
  const handleUserLocated = coords => setUserCoords(coords);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Sticky top bar ── */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

          {/* Search row */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">

            {/* Live location pill */}
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 border
              ${locating
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : userCoords
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50  border-rose-200  text-rose-600'}`}>
              <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline max-w-[180px] truncate">{locLabel}</span>
              <span className="sm:hidden">{userCoords ? '📍 Live' : locating ? '…' : '✕'}</span>
            </div>

            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search mess, PG, gym, hostel, clinic…"
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="hidden sm:block px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none cursor-pointer shrink-0"
            >
              <option value="nearest">📍 Nearest First</option>
              <option value="rating_desc">★ Highest Rated</option>
              <option value="price_asc">₹ Low to High</option>
              <option value="price_desc">₹ High to Low</option>
            </select>

            {/* Filters toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                showFilters ? 'bg-brand-50 border-brand-500 text-brand-600' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {/* Map toggle (mobile) */}
            <button
              type="button"
              onClick={() => setShowMobileMap(!showMobileMap)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 flex items-center gap-1.5 shrink-0"
            >
              {showMobileMap ? <List className="w-3.5 h-3.5" /> : <MapIcon className="w-3.5 h-3.5" />}
              <span>{showMobileMap ? 'List' : 'Map'}</span>
            </button>
          </form>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-100 mt-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  category === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Collapsible filters */}
          {showFilters && (
            <div className="pt-3 pb-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Price (₹/mo)</label>
                <input type="number" placeholder="e.g. 5000" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Within Radius</label>
                <select value={maxDistance} onChange={e => setMaxDistance(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white cursor-pointer">
                  <option value="">Any Distance</option>
                  <option value="2">Within 2 km</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rating</label>
                <select value={minRating} onChange={e => setMinRating(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white cursor-pointer">
                  <option value="">All Ratings</option>
                  <option value="4.5">★ 4.5 & Above</option>
                  <option value="4.0">★ 4.0 & Above</option>
                  <option value="3.5">★ 3.5 & Above</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={isAvailable}
                    onChange={e => setIsAvailable(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500" />
                  <span className="font-semibold text-slate-700">Available Now</span>
                </label>
                <button onClick={handleResetFilters}
                  className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 text-xs">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── No location yet banner ── */}
      {!userCoords && !locating && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-xs text-amber-800 font-medium">
          ⚠️ Location permission is required to show amenities near you.
          Please allow location access in your browser and reload.
        </div>
      )}
      {locating && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 text-center text-xs text-blue-700 font-medium flex items-center justify-center gap-2">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75"/>
          </svg>
          Getting your live location…
        </div>
      )}

      {/* ── Main Split ── */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

          {/* Left: cards */}
          <div className={`lg:col-span-7 flex flex-col ${showMobileMap ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500">
                {loading ? 'Searching…' : (
                  <>Found <strong className="text-slate-900">{amenities.length}</strong> amenities near your location</>
                )}
              </span>
              {(category !== 'ALL' || maxPrice || minRating || isAvailable) && (
                <button onClick={handleResetFilters} className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
                  Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-72 bg-slate-200 animate-pulse rounded-2xl" />)}
              </div>
            ) : !userCoords ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Navigation className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900">Waiting for your location</h3>
                <p className="text-xs text-slate-500 mt-1">Allow location access to discover amenities near you.</p>
              </div>
            ) : amenities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900">No Amenities Found Nearby</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  No listings match your filters in this area. Try expanding the distance or resetting filters.
                </p>
                <button onClick={handleResetFilters}
                  className="mt-5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition">
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                {amenities.map(item => (
                  <AmenityCard
                    key={item.id}
                    amenity={item}
                    isHighlighted={highlightedId === item.id}
                    onHover={id => setHighlightedId(id)}
                    onLeave={() => setHighlightedId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: map */}
          <div className={`lg:col-span-5 h-[500px] lg:h-[calc(100vh-140px)] sticky top-36 ${
            showMobileMap ? 'block' : 'hidden lg:block'
          }`}>
            <MapLeaflet
              amenities={amenities}
              highlightedId={highlightedId}
              onSelectAmenity={id => setHighlightedId(id)}
              center={userCoords ? [userCoords.lat, userCoords.lng] : [20.5937, 78.9629]}
              zoom={userCoords ? 14 : 5}
              userCoords={userCoords}
              onUserLocated={handleUserLocated}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
