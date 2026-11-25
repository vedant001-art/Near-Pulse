import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Utensils,
  Home,
  Building,
  Dumbbell,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  CreditCard,
  BellRing,
  ArrowRight,
  Star,
  Users,
  CheckCircle,
  Clock,
  Compass,
  Briefcase,
  Plus,
  DollarSign,
  Navigation,
  TrendingUp
} from 'lucide-react';
import { amenitiesApi } from '../services/api';
import AmenityCard from '../components/AmenityCard';
import { useAuth } from '../context/AuthContext';
import { reverseGeocode } from '../utils/locationAndMedia';

const CATEGORIES = [
  {
    id: 'MESS_TIFFIN',
    name: 'Mess & Tiffin',
    icon: Utensils,
    count: '15+ Providers',
    color: 'from-amber-500 to-orange-500',
    desc: 'Homestyle pure veg & non-veg daily hot meals delivered'
  },
  {
    id: 'PG_ACCOMMODATION',
    name: 'PG & Co-Living',
    icon: Home,
    count: '24+ Properties',
    color: 'from-blue-500 to-cyan-500',
    desc: 'Fully furnished AC rooms, 300 Mbps WiFi & daily food'
  },
  {
    id: 'HOSTEL',
    name: 'Student Hostels',
    icon: Building,
    count: '12+ Campuses',
    color: 'from-indigo-500 to-violet-500',
    desc: 'Affordable twin & triple sharing with soundproof study hubs'
  },
  {
    id: 'GYM_FITNESS',
    name: 'Gym & Fitness',
    icon: Dumbbell,
    count: '18+ Centers',
    color: 'from-purple-500 to-pink-500',
    desc: '24/7 access, CrossFit, CrossFit rigs & certified coaches'
  },
  {
    id: 'HOSPITAL_CLINIC',
    name: 'Clinics & Medical',
    icon: HeartPulse,
    count: '10+ Clinics',
    color: 'from-emerald-500 to-teal-500',
    desc: '24/7 emergency triage, student OPD covers & diagnostic labs'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isProvider, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [liveLocationLabel, setLiveLocationLabel] = useState('Detecting live location…');
  const [featuredAmenities, setFeaturedAmenities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isProvider && !isAdmin) return;
    loadFeatured();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setLiveLocationLabel(
            geo?.shortLabel || `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`
          );
        },
        () => setLiveLocationLabel('Use Live GPS'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLiveLocationLabel('Live GPS');
    }
  }, [isProvider, isAdmin]);

  const loadFeatured = async () => {
    try {
      const res = await amenitiesApi.getAmenities({ sortBy: 'rating_desc' });
      if (res.data.success) {
        setFeaturedAmenities(res.data.amenities.slice(0, 4));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append('search', searchTerm.trim());
    navigate(`/explore?${params.toString()}`);
  };

  if (isProvider && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Provider Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white pt-20 pb-28">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-25">
            <div className="absolute -top-40 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
            <div className="absolute top-20 right-1/4 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md mb-6">
              <Briefcase className="w-4 h-4 text-amber-400" />
              <span>Service Provider Workspace • {user?.name}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
              Manage Your Services, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200">
                Subscribers &amp; Payouts.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Publish your mess, PG, hostel, gym, or clinic with live GPS coordinates, track active customer subscriptions, and monitor revenue in real time.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/provider"
                className="px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                <span>Open Provider Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/provider?tab=subscribers"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 backdrop-blur-md transition flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-amber-300" />
                <span>View Subscribers</span>
              </Link>
              <Link
                to="/provider?tab=payments"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 backdrop-blur-md transition flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Payment Records</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Provider Quick Action Cards */}
        <section className="relative -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: 'My Service Listings',
                desc: 'Add new amenities with live GPS & local photos, or update existing plans.',
                icon: Plus,
                color: 'from-amber-500 to-orange-500',
                to: '/provider?tab=listings',
                cta: 'Manage Listings'
              },
              {
                title: 'Customer Subscriptions',
                desc: 'See active and past subscribers, plan validity dates, and contact details.',
                icon: Users,
                color: 'from-blue-500 to-cyan-500',
                to: '/provider?tab=subscribers',
                cta: 'View Subscribers'
              },
              {
                title: 'Revenue & Payouts',
                desc: 'Track gross earnings, gateway references, and customer payment history.',
                icon: TrendingUp,
                color: 'from-emerald-500 to-teal-500',
                to: '/provider?tab=payments',
                cta: 'View Payments'
              },
              {
                title: 'Availability Control',
                desc: 'Instantly switch any listing between Available and Full / Waitlist.',
                icon: Clock,
                color: 'from-purple-500 to-indigo-500',
                to: '/provider?tab=listings',
                cta: 'Update Status'
              }
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.to}
                  className="group p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-600">{card.cta}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* How It Works For Providers */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Provider Workflow
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
            Built to Grow Your Local Business
          </h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto mt-2">
            Everything you need to list your facility, onboard subscribers, and manage recurring plans without middlemen.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {[
              {
                step: 'Step 01',
                title: 'Pin Live Location',
                desc: 'Auto-detect your street, locality, and GPS coordinates when creating a listing.',
                icon: Navigation,
                bg: 'bg-amber-50 text-amber-600'
              },
              {
                step: 'Step 02',
                title: 'Upload Photos & Plans',
                desc: 'Add photos directly from your device and set weekly or monthly pricing.',
                icon: Briefcase,
                bg: 'bg-blue-50 text-blue-600'
              },
              {
                step: 'Step 03',
                title: 'Onboard Subscribers',
                desc: 'Students and professionals subscribe online with instant digital receipts.',
                icon: Users,
                bg: 'bg-emerald-50 text-emerald-600'
              },
              {
                step: 'Step 04',
                title: 'Track Revenue',
                desc: 'Monitor active plans, expiry dates, and payouts from your Provider Portal.',
                icon: CreditCard,
                bg: 'bg-purple-50 text-purple-600'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 text-left relative">
                  <span className="absolute -top-3.5 left-6 bg-slate-900 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
                    {item.step}
                  </span>
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-slate-900 to-slate-900 text-white pt-20 pb-28">
        {/* Glow and Pattern Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -top-40 left-1/4 w-96 h-96 bg-brand-500 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/15 border border-brand-400/30 text-brand-300 text-xs font-semibold backdrop-blur-md mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Discover • Compare • Subscribe to Everyday Local Essentials</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Find Your Everyday Essentials, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-sky-300 to-teal-300">
              Right Near You.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            From hygienic daily tiffin mess to verified PGs, 24/7 fitness gyms, and student clinics. Discover, compare plans, and subscribe seamlessly.
          </p>

          {/* Prominent Search and Location Bar */}
          <div className="mt-10 max-w-3xl mx-auto bg-white/95 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-white/20">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
              {/* Live Location Pill */}
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 rounded-xl w-full sm:w-auto text-slate-700 text-xs font-semibold shrink-0">
                <Navigation className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="truncate max-w-[200px]">{liveLocationLabel}</span>
              </div>

              {/* Keyword Search Input */}
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 w-full">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search 'Homestyle Veg Mess', 'AC Studio PG', 'CrossFit Gym'..."
                  className="w-full bg-transparent text-slate-900 text-sm focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/30 hover:shadow-lg transition flex items-center justify-center gap-2 shrink-0"
              >
                <span>Find Services</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Live GPS hint */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Navigation className="w-3.5 h-3.5 text-brand-400" />
            <span>Results automatically match your live GPS location</span>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="relative -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/explore?category=${cat.id}`}
                className="group p-5 bg-white rounded-2xl shadow-lg border border-slate-100 hover:border-brand-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-brand-600">{cat.count}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Amenities Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
              <Star className="w-4 h-4 fill-brand-600" />
              <span>Highly Rated & Verified</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Featured Neighborhood Amenities
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Top curated listings preferred by Bengaluru students and tech professionals.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 hover:gap-2 transition-all self-start sm:self-auto"
          >
            <span>View All Amenities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredAmenities.map((amenity) => (
              <AmenityCard key={amenity.id} amenity={amenity} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-100 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
            How NearPulse Works For You
          </h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto mt-2">
            Eliminating broker middlemen and uncertain quality with verified listings, digital plans, and automatic reminders.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 text-left relative">
              <span className="absolute -top-3.5 left-6 bg-brand-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
                Step 01
              </span>
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Search by Location</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Enter your college, PG, or office locality or use GPS to see verified services within 1 to 5 km.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 text-left relative">
              <span className="absolute -top-3.5 left-6 bg-brand-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
                Step 02
              </span>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Compare Plans & Reviews</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Review transparent pricing tiers, real photos, included perks, and genuine peer reviews.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 text-left relative">
              <span className="absolute -top-3.5 left-6 bg-brand-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
                Step 03
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Subscribe & Pay Securely</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Select your weekly, monthly, or semester pass and activate instantly with UPI or card payments.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 text-left relative">
              <span className="absolute -top-3.5 left-6 bg-brand-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
                Step 04
              </span>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Manage & Never Miss Renewals</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Track valid days remaining, get proactive 7-day renewal alerts, and pause or cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Students & Working Professionals */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Why Urban Dwellers Choose NearPulse
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 leading-tight">
              Say Goodbye to Shady Brokers & Cold Meals.
            </h2>
            <p className="text-slate-600 text-sm mt-4 leading-relaxed">
              Moving to a new city for university or a tech job is challenging enough. We eliminate the frustration of finding safe food, reliable accommodation, and daily necessities.
            </p>

            <div className="space-y-4 mt-6">
              {[
                { title: 'Zero Brokerage & Transparent Rates', desc: 'Direct provider pricing without middleman markups.' },
                { title: 'Hygienic, Inspected Facilities', desc: 'Every listed mess and PG undergoes physical verification.' },
                { title: 'Flexible Trial & Monthly Plans', desc: 'Test a mess for 7 days before committing to full semester board.' },
                { title: 'Smart Expiry Alerts & Digital Invoices', desc: 'Automated renewal notifications prevent unexpected service disruptions.' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <Link
                to="/explore"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                <span>Start Exploring Map</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&auto=format&fit=crop&q=80"
                alt="Students studying and living together"
                className="w-full h-[450px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="px-2.5 py-1 rounded-md bg-brand-500 text-white text-[11px] font-bold">
                  Bengaluru Student Hub
                </span>
                <h4 className="text-lg font-bold mt-2">
                  "Found my PG and daily tiffin within 2 days of landing in Koramangala."
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  — Aditya Verma, CS Undergrad & Early NearPulse Subscriber
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Students */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                  For Students & Techies
                </span>
                <h3 className="text-2xl font-bold mt-2">Need a Reliable Service Today?</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Join thousands of residents who discover, compare, and manage their daily subscriptions with zero hassle.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to="/register?role=STUDENT_PROFESSIONAL"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-sm shadow transition"
                >
                  Create Student / Professional Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* For Service Providers */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-950/50 to-slate-900 border border-amber-900/40 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  For Business & Amenity Owners
                </span>
                <h3 className="text-2xl font-bold mt-2">Are You a Local Service Provider?</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  List your mess, PG, gym, or clinic. Gain paying subscribers with automated billing, digital receipts, and subscriber analytics.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to="/register?role=SERVICE_PROVIDER"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow transition"
                >
                  Register as Service Provider
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
