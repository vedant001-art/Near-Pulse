import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Share2,
  ArrowRight,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { amenitiesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ContactProviderModal from '../components/ContactProviderModal';
import ReviewModal from '../components/ReviewModal';

export default function AmenityDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [amenity, setAmenity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAmenityDetails();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchAmenityDetails = async () => {
    setLoading(true);
    try {
      const res = await amenitiesApi.getAmenityById(id);
      if (res.data.success) {
        setAmenity(res.data.amenity);
        setIsSaved(res.data.amenity.isSaved);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await amenitiesApi.toggleSave(id);
      setIsSaved(res.data.saved);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading amenity details...</p>
        </div>
      </div>
    );
  }

  if (!amenity) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">Amenity Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">This listing may have been unlisted or removed.</p>
          <Link
            to="/explore"
            className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const images = amenity.images && amenity.images.length > 0
    ? amenity.images.map((img) => img.url)
    : ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/explore" className="hover:text-slate-900">Explore</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-900 truncate">{amenity.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Title and Top Actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                {amenity.category.replace('_', ' ')}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Partner
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  amenity.isAvailable !== false
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {amenity.isAvailable !== false ? '● Available for Immediate Joining' : '● Currently Full'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {amenity.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                {amenity.totalReviews > 0 ? (
                  <>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-900">{amenity.averageRating}</span>
                    <span className="text-slate-400">({amenity.totalReviews} {amenity.totalReviews === 1 ? 'review' : 'reviews'})</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    ★ New • No reviews yet
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{amenity.address}, {amenity.locality}, {amenity.city}</span>
              </div>
            </div>
          </div>

          {/* Action buttons: Save & Share */}
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={handleToggleSave}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                isSaved
                  ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700 flex items-center gap-1.5 text-xs font-semibold"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Gallery Section */}
        <div className={`grid grid-cols-1 ${images.length > 1 ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-4 mb-10`}>
          <div className={`${images.length > 1 ? 'lg:col-span-2' : 'lg:col-span-1'} h-[340px] sm:h-[440px] rounded-2xl overflow-hidden bg-slate-100 shadow-md relative`}>
            <img
              src={images[activeImage] || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000'}
              alt={amenity.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000';
              }}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 h-[160px] lg:h-[440px]">
              {images.slice(0, 3).map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition ${
                    activeImage === idx ? 'border-brand-600 ring-2 ring-brand-500/20' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Two Column Layout: Left Content & Right Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (8 columns) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Description Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-3">About This Amenity</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {amenity.description}
              </p>

              {/* Operating Hours */}
              {amenity.operatingHours && (
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
                  <Clock className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800">Operating Hours: </span>
                    <span>{amenity.operatingHours}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Perks & Features */}
            {amenity.perks && amenity.perks.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Included Perks & Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenity.perks.map((perk, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Subscription Plans (The core engine for the prompt!) */}
            <div id="plans" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Choose a Subscription Plan</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a plan that suits your schedule. Cancel or pause anytime.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                  Direct Provider Pricing
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {amenity.subscriptionPlans && amenity.subscriptionPlans.map((plan) => {
                  const formatPlanDuration = (days) => {
                    if (days === 30) return '1 Month (30d)';
                    if (days === 60) return '2 Months (60d)';
                    if (days === 90) return '3 Months (90d)';
                    if (days === 180) return '6 Months (180d)';
                    if (days === 365) return '12 Months (1 Year)';
                    if (days % 30 === 0) return `${days / 30} Months (${days}d)`;
                    return `${days} Days`;
                  };

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                        plan.isPopular
                          ? 'border-brand-500 bg-gradient-to-b from-brand-50/50 to-white shadow-md ring-1 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-3 right-4 bg-brand-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                          Most Popular
                        </span>
                      )}

                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900 text-base leading-snug">{plan.name}</h3>
                          <span className="text-[11px] bg-brand-50 border border-brand-200 font-bold text-brand-700 px-2 py-0.5 rounded-lg shrink-0">
                            {formatPlanDuration(plan.durationDays)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-2xl font-black text-slate-900">
                            ₹{plan.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            for {plan.durationDays} days
                          </span>
                          {plan.durationDays > 30 && (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              ≈ ₹{Math.round(plan.price / (plan.durationDays / 30)).toLocaleString('en-IN')}/mo
                            </span>
                          )}
                        </div>

                        <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                          {plan.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 pt-3">
                        <Link
                          to={`/checkout?amenityId=${amenity.id}&planId=${plan.id}`}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            plan.isPopular
                              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>Subscribe with This Plan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Customer Ratings & Reviews</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authentic feedback from verified students and residents.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (!isAuthenticated) navigate('/login');
                    else setShowReviewModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Write a Review
                </button>
              </div>

              {/* Rating summary */}
              <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
                <div className="text-center shrink-0">
                  <div className="text-3xl font-black text-slate-900">
                    {amenity.totalReviews > 0 ? amenity.averageRating : '0.0'}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(amenity.averageRating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Based on {amenity.totalReviews || 0} {amenity.totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                </div>

                <div className="flex-1 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Community Verdict:</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    {amenity.totalReviews > 0
                      ? `Rated ${amenity.averageRating}/5 across ${amenity.totalReviews} verified subscriber ${amenity.totalReviews === 1 ? 'review' : 'reviews'}.`
                      : 'No reviews yet. Be the first subscriber to rate this service!'}
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 divide-y divide-slate-100">
                {amenity.reviews && amenity.reviews.length > 0 ? (
                  amenity.reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rev.user?.name || 'User'}`}
                            alt={rev.user?.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-slate-900">{rev.user?.name || 'Verified User'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{rev.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pl-9">
                        {rev.comment}
                      </p>

                      {/* Provider Official Response */}
                      {rev.providerReply && (
                        <div className="mt-2.5 ml-9 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <p className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                            Host Response:
                          </p>
                          <p className="text-slate-600 text-[11px] mt-0.5">{rev.providerReply}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No reviews submitted yet. Be the first to review!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 columns, Sticky Quick Contact & Location) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Host / Provider Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-28">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Listed by Verified Host
              </span>

              <div className="flex items-center gap-3 mt-3 pb-4 border-b border-slate-100">
                <img
                  src={amenity.provider?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${amenity.provider?.name || 'Host'}`}
                  alt={amenity.provider?.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/20"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{amenity.provider?.name}</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {amenity.provider?.bio || 'Verified Local Service Operator'}
                  </p>
                </div>
              </div>

              <div className="py-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>{amenity.contactPhone || amenity.provider?.phone || '+91 98201 12233'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="truncate">{amenity.contactEmail || amenity.provider?.email || 'contact@nearpulse.com'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contact Host / Inquire</span>
              </button>

              {/* Map Directions Box */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-2">Location & Directions</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  {amenity.address}, {amenity.locality}
                </p>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${amenity.latitude},${amenity.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-brand-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContactProviderModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        provider={amenity.provider}
        amenityName={amenity.name}
      />

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        amenityId={amenity.id}
        amenityName={amenity.name}
        onReviewSubmitted={() => fetchAmenityDetails()}
      />
    </div>
  );
}
