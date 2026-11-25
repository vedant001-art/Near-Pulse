import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Heart, CheckCircle2, ArrowRight } from 'lucide-react';
import { amenitiesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORY_MAP = {
  MESS_TIFFIN: { label: 'Mess & Tiffin', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  PG_ACCOMMODATION: { label: 'PG & Coliving', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  HOSTEL: { label: 'Hostel', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  GYM_FITNESS: { label: 'Gym & Fitness', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  HOSPITAL_CLINIC: { label: 'Clinic & Medical', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  OTHER: { label: 'Essential Service', bg: 'bg-slate-100 text-slate-800 border-slate-200' }
};

export default function AmenityCard({
  amenity,
  isHighlighted = false,
  onHover = () => {},
  onLeave = () => {}
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(amenity.isSaved || false);
  const [saving, setSaving] = useState(false);

  const categoryInfo = CATEGORY_MAP[amenity.category] || CATEGORY_MAP.OTHER;

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setSaving(true);
      const res = await amenitiesApi.toggleSave(amenity.id);
      setIsSaved(res.data.saved);
    } catch (err) {
      console.error('Failed to toggle save:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onMouseEnter={() => onHover(amenity.id)}
      onMouseLeave={() => onLeave(amenity.id)}
      className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col ${
        isHighlighted
          ? 'border-brand-500 shadow-xl ring-2 ring-brand-500/20 translate-y-[-2px]'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-lg'
      }`}
    >
      {/* Image Thumbnail Container */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={amenity.coverImage || (amenity.images && amenity.images[0]) || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800'}
          alt={amenity.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md shadow-sm ${categoryInfo.bg}`}
          >
            {categoryInfo.label}
          </span>

          <button
            onClick={handleToggleSave}
            disabled={saving}
            className={`p-2 rounded-full backdrop-blur-md transition ${
              isSaved
                ? 'bg-rose-500 text-white shadow'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-rose-500'
            }`}
            aria-label="Save listing"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Bottom Distance & Verified Badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verified
            </span>
          </div>

          {amenity.distanceKm !== null && amenity.distanceKm !== undefined && (
            <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md font-medium text-slate-200 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-brand-400" />
              {amenity.distanceKm} km away
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating & Reviews */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1 text-xs">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{amenity.totalReviews > 0 ? amenity.averageRating : 'New'}</span>
              </div>
              <span className="text-slate-400 text-[11px]">
                ({amenity.totalReviews ?? 0} {amenity.totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                amenity.isAvailable !== false
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {amenity.isAvailable !== false ? '● Available' : '● Full / Waitlist'}
            </span>
          </div>

          {/* Title */}
          <Link to={`/amenities/${amenity.id}`} className="block">
            <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition line-clamp-1 text-base">
              {amenity.name}
            </h3>
          </Link>

          {/* Locality */}
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{amenity.locality || amenity.address}</span>
          </p>

          {/* Perks Tags */}
          {amenity.perks && amenity.perks.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {amenity.perks.slice(0, 3).map((perk, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                >
                  {perk}
                </span>
              ))}
              {amenity.perks.length > 3 && (
                <span className="text-[10px] text-slate-400 px-1 py-0.5 font-medium">
                  +{amenity.perks.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing and Action Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-slate-900">
                ₹{amenity.startingPrice?.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                /{amenity.billingPeriod === 'monthly' ? 'mo' : amenity.billingPeriod}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/amenities/${amenity.id}`}
              className="px-3 py-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition"
            >
              Details
            </Link>
            <Link
              to={`/amenities/${amenity.id}#plans`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
            >
              Subscribe
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
