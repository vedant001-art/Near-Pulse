import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Users,
  DollarSign,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Trash2,
  Edit,
  MessageSquare,
  X,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { providerApi, amenitiesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { reverseGeocode, compressImageFile } from '../utils/locationAndMedia';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800';

export default function ProviderDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'listings';

  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Amenity Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'MESS_TIFFIN',
    description: '',
    address: '',
    locality: '',
    city: '',
    latitude: '',
    longitude: '',
    startingPrice: 3500,
    operatingHours: '8:00 AM - 10:00 PM',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    perksString: 'WiFi, Daily Housekeeping, RO Water',
    imageUrl: ''
  });
  const [modalPlans, setModalPlans] = useState([
    {
      name: '1 Month Standard Plan',
      durationDays: 30,
      price: 3500,
      features: 'Daily Lunch & Dinner, Free Delivery',
      isPopular: true
    },
    {
      name: '3 Months Value Board',
      durationDays: 90,
      price: 9999,
      features: 'Daily Meals, Free Delivery, 5% Cashback',
      isPopular: false
    }
  ]);
  const [managePlansAmenity, setManagePlansAmenity] = useState(null);
  const [newPlanData, setNewPlanData] = useState({
    name: '3 Months Value Pack',
    durationDays: 90,
    price: 9999,
    features: 'Standard access, Priority support, Free delivery',
    isPopular: false
  });
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [gpsLocating, setGpsLocating] = useState(false);
  const [gpsStatus,   setGpsStatus]   = useState('');   // success/error message
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  // Review Reply State
  const [replyText, setReplyText] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    setLoading(true);
    try {
      const [statsRes, listRes, subsRes, payRes] = await Promise.all([
        providerApi.getStats(),
        providerApi.getListings(),
        providerApi.getSubscriptions(),
        providerApi.getPayments()
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (listRes.data.success) setListings(listRes.data.listings);
      if (subsRes.data.success) setSubscriptions(subsRes.data.subscriptions);
      if (payRes.data.success) setPayments(payRes.data.payments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      const res = await providerApi.toggleAvailability(id);
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isAvailable: res.data.isAvailable } : l))
      );
    } catch (e) {
      alert('Failed to update availability: ' + e.message);
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this amenity listing?')) return;
    try {
      await amenitiesApi.deleteAmenity(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      alert('Failed to delete listing: ' + e.message);
    }
  };

  const handleAddPresetPlanToModal = (days, label) => {
    const base = parseFloat(formData.startingPrice) || 3500;
    const months = days / 30;
    const calcPrice = Math.round(base * months * (months > 1 ? 0.95 : 1));
    setModalPlans((prev) => [
      ...prev,
      {
        name: label || (days === 365 ? '12 Months Annual Pass' : `${Math.round(days / 30)} Months Plan`),
        durationDays: days,
        price: calcPrice,
        features: 'All amenities included, Dedicated customer support',
        isPopular: false
      }
    ]);
  };

  const handleUpdateModalPlan = (index, field, value) => {
    setModalPlans((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  const handleRemoveModalPlan = (index) => {
    if (modalPlans.length <= 1) return;
    setModalPlans((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOpenManagePlans = (amenity) => {
    setManagePlansAmenity(amenity);
    setPlanError('');
    setNewPlanData({
      name: '3 Months Value Pack',
      durationDays: 90,
      price: Math.round((amenity.startingPrice || 3500) * 2.85),
      features: 'Standard access, Priority customer support',
      isPopular: false
    });
  };

  const handleCreatePlanForAmenity = async (e) => {
    e.preventDefault();
    if (!managePlansAmenity) return;
    setPlanSubmitting(true);
    setPlanError('');

    try {
      const res = await providerApi.addPlan(managePlansAmenity.id, {
        name: newPlanData.name,
        durationDays: parseInt(newPlanData.durationDays, 10) || 30,
        price: parseFloat(newPlanData.price),
        features: newPlanData.features,
        isPopular: newPlanData.isPopular
      });

      if (res.data.success) {
        setListings((prev) =>
          prev.map((item) =>
            item.id === managePlansAmenity.id
              ? {
                  ...item,
                  subscriptionPlans: [...(item.subscriptionPlans || []), res.data.plan]
                }
              : item
          )
        );
        setManagePlansAmenity((prev) => ({
          ...prev,
          subscriptionPlans: [...(prev.subscriptionPlans || []), res.data.plan]
        }));
        setNewPlanData({
          name: '',
          durationDays: 30,
          price: managePlansAmenity.startingPrice || 3500,
          features: 'Standard access, Customer support',
          isPopular: false
        });
      }
    } catch (err) {
      setPlanError(err.response?.data?.message || 'Failed to add plan');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleDeletePlanForAmenity = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await providerApi.deletePlan(planId);
      setListings((prev) =>
        prev.map((item) =>
          item.id === managePlansAmenity.id
            ? {
                ...item,
                subscriptionPlans: (item.subscriptionPlans || []).filter((p) => p.id !== planId)
              }
            : item
        )
      );
      setManagePlansAmenity((prev) => ({
        ...prev,
        subscriptionPlans: (prev.subscriptionPlans || []).filter((p) => p.id !== planId)
      }));
    } catch (err) {
      alert('Failed to delete plan: ' + err.message);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const perks = formData.perksString
        ? formData.perksString.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const formattedPlans = modalPlans.map((p) => ({
        name: p.name.trim() || `${p.durationDays} Days Plan`,
        durationDays: parseInt(p.durationDays, 10) || 30,
        price: parseFloat(p.price) || 0,
        features: p.features
          ? (typeof p.features === 'string' ? p.features.split(',').map((s) => s.trim()).filter(Boolean) : p.features)
          : ['Standard access'],
        isPopular: Boolean(p.isPopular)
      }));

      const minPrice = formattedPlans.length > 0
        ? Math.min(...formattedPlans.map((p) => p.price))
        : parseFloat(formData.startingPrice);

      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        address: formData.address,
        locality: formData.locality,
        city: formData.city || 'India',
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        startingPrice: minPrice,
        operatingHours: formData.operatingHours,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        perks,
        images: formData.imageUrl ? [formData.imageUrl] : [FALLBACK_IMAGE],
        subscriptionPlans: formattedPlans
      };

      if (Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
        setFormError('Please capture your live GPS location before publishing.');
        setSubmitting(false);
        return;
      }

      const res = await amenitiesApi.createAmenity(payload);
      if (res.data.success) {
        setShowAddModal(false);
        loadProviderData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error:Geolocation not supported by this browser.');
      return;
    }
    setGpsLocating(true);
    setGpsStatus('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        const geo = await reverseGeocode(lat, lng);
        if (geo) {
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: geo.address || prev.address,
            locality: geo.locality || prev.locality,
            city: geo.city || prev.city,
          }));
          setGpsStatus(`ok:Detected: ${geo.shortLabel || `${lat.toFixed(5)}, ${lng.toFixed(5)}`} (you can edit the address fields below)`);
        } else {
          setGpsStatus(`ok:Captured: ${lat.toFixed(5)}, ${lng.toFixed(5)} ±${Math.round(pos.coords.accuracy)}m`);
        }
        setGpsLocating(false);
      },
      (err) => {
        setGpsLocating(false);
        setGpsStatus(err.code === 1
          ? 'error:Location permission denied. Please allow it in your browser.'
          : 'error:Could not get location. Try again.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    if (!formData.latitude || !formData.longitude) {
      handleGetGpsLocation();
    }
  };

  const handleLocalImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageProcessing(true);
    setFormError('');
    try {
      const dataUrl = await compressImageFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      setFormError(err.message || 'Could not process selected image.');
    } finally {
      setImageProcessing(false);
    }
  };

  const handleSendReply = async (reviewId) => {
    const text = replyText[reviewId];
    if (!text || !text.trim()) return;

    setReplyingId(reviewId);
    try {
      await providerApi.replyReview(reviewId, text);
      alert('Reply posted successfully!');
      loadProviderData();
      setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
    } catch (e) {
      alert('Failed to post reply: ' + e.message);
    } finally {
      setReplyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Service Provider Management Center
              </span>
              <h1 className="text-2xl font-extrabold text-white">{user?.name}’s Business Hub</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your mess, PG, gym, or medical clinic listings and subscriber revenue.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>List New Amenity</span>
            </button>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">My Listings</span>
              <p className="text-xl font-extrabold text-white mt-1">{stats?.totalListings || 0}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Active Subscribers</span>
              <p className="text-xl font-extrabold text-brand-400 mt-1">{stats?.activeSubscribersCount || 0}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Revenue Earned</span>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">
                ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Average Rating</span>
              <p className="text-xl font-extrabold text-amber-400 mt-1">
                {stats?.totalReviews > 0 ? (
                  <>★ {stats.averageRating} <span className="text-xs font-medium text-slate-400">({stats.totalReviews})</span></>
                ) : (
                  <span className="text-sm font-bold text-slate-400">No reviews yet</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-3 mb-6 no-scrollbar">
          {[
            { id: 'listings', label: 'My Listings', icon: Briefcase, count: listings.length },
            { id: 'subscribers', label: 'Customer Subscriptions', icon: Users, count: subscriptions.length },
            { id: 'payments', label: 'Payment Records', icon: DollarSign, count: payments.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                      isActive ? 'bg-black/10 text-slate-950' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Listings */}
        {currentTab === 'listings' && (
          <div className="space-y-4">
            {listings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 text-base">No Listings Created Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Start by adding your mess or PG details to accept subscriptions.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold"
                >
                  Create First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {listings.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="relative h-44 bg-slate-100">
                        <img
                          src={item.images?.[0]?.url || FALLBACK_IMAGE}
                          alt={item.name}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-slate-900 shadow">
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={() => handleToggleAvailability(item.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow transition ${
                              item.isAvailable
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {item.isAvailable ? '● Available' : '● Full'}
                          </button>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.address}, {item.locality}</span>
                        </p>

                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Subscribers</span>
                            <span className="font-bold text-slate-900">{item._count?.subscriptions || 0}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Plans</span>
                            <span className="font-bold text-slate-900">{item.subscriptionPlans?.length || 1}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Base Price</span>
                            <span className="font-bold text-slate-900">₹{item.startingPrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                      <Link
                        to={`/amenities/${item.id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Public View ↗
                      </Link>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenManagePlans(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 flex items-center gap-1.5 transition shadow-sm"
                          title="Add or Manage Subscription Plans"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Plans ({item.subscriptionPlans?.length || 0})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(item.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Subscribers */}
        {currentTab === 'subscribers' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Active & Past Subscribers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customers currently subscribed to your services.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Customer</th>
                    <th className="p-3.5">Service Listing</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5">Start Date</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5 pr-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No customer subscriptions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 pl-5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={s.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${s.user?.name}`}
                              alt={s.user?.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{s.user?.name}</span>
                              <span className="text-[10px] text-slate-400">{s.user?.phone || s.user?.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">{s.amenity?.name}</td>
                        <td className="p-3.5 text-slate-600">{s.plan?.name}</td>
                        <td className="p-3.5 text-slate-600">{new Date(s.startDate).toLocaleDateString()}</td>
                        <td className="p-3.5 text-slate-600">{new Date(s.expiryDate).toLocaleDateString()}</td>
                        <td className="p-3.5 pr-5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Payments */}
        {currentTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Customer Payouts & Receipts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Gross revenue received from customer subscriptions.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Date</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Listing</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5">Gateway Reference</th>
                    <th className="p-3.5 pr-5 text-right">Gross Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 pl-5 text-slate-600">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="p-3.5 font-bold text-slate-900">{p.user?.name}</td>
                        <td className="p-3.5 text-slate-700">{p.subscription?.amenity?.name}</td>
                        <td className="p-3.5 text-slate-500">{p.subscription?.plan?.name}</td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-600">{p.gatewayReference}</td>
                        <td className="p-3.5 pr-5 text-right font-extrabold text-emerald-600">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add New Amenity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Amenity Listing</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service / Amenity Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Balaji Royal Tiffin & Meals"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="MESS_TIFFIN">Mess & Tiffin Services</option>
                    <option value="PG_ACCOMMODATION">Paying Guest (PG) & Coliving</option>
                    <option value="HOSTEL">Student Hostel</option>
                    <option value="GYM_FITNESS">Gym & Fitness Center</option>
                    <option value="HOSPITAL_CLINIC">Hospital / Medical Clinic</option>
                    <option value="OTHER">Other Essential Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Key Highlights</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your facilities, hygiene standards, food menu, equipment, or medical specializations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>

              {/* GPS location picker — prefills Street, Locality, City & Coordinates */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">📍 Live Location & Address Auto-Fill</span>
                    <span className="text-[11px] text-slate-500">Prefills street, locality, city &amp; GPS (editable below)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetGpsLocation}
                    disabled={gpsLocating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition disabled:opacity-60 shrink-0"
                  >
                    {gpsLocating ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                          <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75"/>
                        </svg>
                        Detecting…
                      </>
                    ) : '📡 Detect Live Location'}
                  </button>
                </div>
                {gpsStatus && (
                  <p className={`text-[11px] font-medium ${gpsStatus.startsWith('ok:') ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {gpsStatus.startsWith('ok:') ? '✓ ' : '✕ '}{gpsStatus.split(':').slice(1).join(':')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street / Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Street / Building / Landmark"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Locality / Area</label>
                  <input
                    type="text"
                    required
                    placeholder="Area / Neighbourhood"
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Price (₹/mo)</label>
                  <input
                    type="number"
                    required
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Latitude</label>
                  <input type="number" step="any" placeholder="Latitude" value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Longitude</label>
                  <input type="number" step="any" placeholder="Longitude" value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Cover Photo</label>
                  <button
                    type="button"
                    onClick={() => setUseUrlInput(!useUrlInput)}
                    className="text-[11px] text-brand-600 hover:underline font-medium"
                  >
                    {useUrlInput ? 'Upload from device instead' : 'Or paste image URL'}
                  </button>
                </div>

                {useUrlInput ? (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-4 cursor-pointer bg-slate-50 hover:bg-amber-50/30 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLocalImageSelect}
                      className="hidden"
                    />
                    {imageProcessing ? (
                      <span className="text-xs font-medium text-slate-600">Compressing photo…</span>
                    ) : formData.imageUrl ? (
                      <div className="w-full flex items-center gap-3">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-20 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="text-left">
                          <p className="text-xs font-semibold text-emerald-700">Photo ready to upload</p>
                          <p className="text-[11px] text-slate-500">Click to choose a different photo from device</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-700">Click to upload photo from your device</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WEBP supported (saved in DB for deployment)</p>
                      </div>
                    )}
                  </label>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perks (Comma Separated)</label>
                <input
                  type="text"
                  value={formData.perksString}
                  onChange={(e) => setFormData({ ...formData, perksString: e.target.value })}
                  placeholder="WiFi, AC, Daily Housekeeping, RO Water, PS5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Subscription Plans List */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">Subscription Plans ({modalPlans.length})</span>
                    <span className="text-[11px] text-slate-500">Provide multiple durations (1 month, 3 months, 6 months, 12 months) for students to choose.</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddPresetPlanToModal(30, '1 Month Standard Plan')}
                      className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-amber-500 text-[10px] font-bold text-slate-700 transition"
                    >
                      + 1 Month
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetPlanToModal(90, '3 Months Value Board')}
                      className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-amber-500 text-[10px] font-bold text-slate-700 transition"
                    >
                      + 3 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetPlanToModal(180, '6 Months Semester Pass')}
                      className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-amber-500 text-[10px] font-bold text-slate-700 transition"
                    >
                      + 6 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetPlanToModal(365, '12 Months Annual Pass')}
                      className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-amber-500 text-[10px] font-bold text-slate-700 transition"
                    >
                      + 12 Months
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mt-2">
                  {modalPlans.map((plan, idx) => (
                    <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-sm relative space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Option #{idx + 1} • {plan.durationDays} Days
                        </span>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={plan.isPopular}
                              onChange={(e) => handleUpdateModalPlan(idx, 'isPopular', e.target.checked)}
                              className="rounded text-amber-500 focus:ring-amber-400"
                            />
                            <span>Featured / Most Popular</span>
                          </label>

                          {modalPlans.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveModalPlan(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 text-xs"
                              title="Remove this plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Plan Title</label>
                          <input
                            type="text"
                            placeholder="e.g. 3 Months Value Pack"
                            value={plan.name}
                            onChange={(e) => handleUpdateModalPlan(idx, 'name', e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Duration (Days)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              placeholder="30"
                              value={plan.durationDays}
                              onChange={(e) => handleUpdateModalPlan(idx, 'durationDays', e.target.value)}
                              required
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                            />
                            <div className="flex gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateModalPlan(idx, 'durationDays', 30)}
                                className={`px-1.5 py-1 rounded text-[10px] font-bold ${plan.durationDays == 30 ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}
                              >
                                1M
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateModalPlan(idx, 'durationDays', 90)}
                                className={`px-1.5 py-1 rounded text-[10px] font-bold ${plan.durationDays == 90 ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}
                              >
                                3M
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateModalPlan(idx, 'durationDays', 180)}
                                className={`px-1.5 py-1 rounded text-[10px] font-bold ${plan.durationDays == 180 ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}
                              >
                                6M
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateModalPlan(idx, 'durationDays', 365)}
                                className={`px-1.5 py-1 rounded text-[10px] font-bold ${plan.durationDays == 365 ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}
                              >
                                12M
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Total Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="3500"
                            value={plan.price}
                            onChange={(e) => handleUpdateModalPlan(idx, 'price', e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Plan Features (Comma separated)</label>
                        <input
                          type="text"
                          placeholder="Daily Meals, Free Delivery, High Speed WiFi"
                          value={plan.features}
                          onChange={(e) => handleUpdateModalPlan(idx, 'features', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Plans Modal for Existing Listings */}
      {managePlansAmenity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Manage Subscription Plans</h3>
                <p className="text-xs text-slate-500">{managePlansAmenity.name} • Add 3-Month, 6-Month, 12-Month options</p>
              </div>
              <button
                onClick={() => setManagePlansAmenity(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Plans List */}
            <div className="space-y-2 mb-6 max-h-56 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Active Plans ({managePlansAmenity.subscriptionPlans?.length || 0})
              </span>
              {(!managePlansAmenity.subscriptionPlans || managePlansAmenity.subscriptionPlans.length === 0) ? (
                <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">No plans configured yet.</p>
              ) : (
                managePlansAmenity.subscriptionPlans.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                          {p.durationDays === 365 ? '12 Months (1 Year)' : p.durationDays % 30 === 0 ? `${p.durationDays / 30} Months (${p.durationDays}d)` : `${p.durationDays} Days`}
                        </span>
                        {p.isPopular && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                            ★ Popular
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        ₹{p.price.toLocaleString('en-IN')} for {p.durationDays} days • {p.features?.join(', ') || 'Standard access'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePlanForAmenity(p.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Plan Form */}
            <form onSubmit={handleCreatePlanForAmenity} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-600" />
                  Add Another Subscription Option
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNewPlanData({
                      name: '3 Months Value Board',
                      durationDays: 90,
                      price: Math.round((managePlansAmenity.startingPrice || 3500) * 2.85),
                      features: 'Daily Meals, Free Delivery, 5% Cashback',
                      isPopular: false
                    })}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-amber-300 text-amber-800 hover:bg-amber-100"
                  >
                    Preset: 3M
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPlanData({
                      name: '6 Months Semester Board',
                      durationDays: 180,
                      price: Math.round((managePlansAmenity.startingPrice || 3500) * 5.5),
                      features: 'Daily Meals, Free Delivery, Priority Support',
                      isPopular: false
                    })}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-amber-300 text-amber-800 hover:bg-amber-100"
                  >
                    Preset: 6M
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPlanData({
                      name: '12 Months Annual Pass',
                      durationDays: 365,
                      price: Math.round((managePlansAmenity.startingPrice || 3500) * 10.8),
                      features: 'Daily Meals, Free Delivery, Highest Priority, Zero Maintenance Fee',
                      isPopular: true
                    })}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-amber-300 text-amber-800 hover:bg-amber-100"
                  >
                    Preset: 12M
                  </button>
                </div>
              </div>

              {planError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">{planError}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Plan Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12 Months Annual Pass"
                    value={newPlanData.name}
                    onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Duration (Days)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="90"
                      value={newPlanData.durationDays}
                      onChange={(e) => setNewPlanData({ ...newPlanData, durationDays: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <div className="flex gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setNewPlanData({ ...newPlanData, durationDays: 30 })}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold ${newPlanData.durationDays == 30 ? 'bg-amber-500 text-slate-950' : 'bg-white border border-slate-200 text-slate-600'}`}
                      >
                        1M
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlanData({ ...newPlanData, durationDays: 90 })}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold ${newPlanData.durationDays == 90 ? 'bg-amber-500 text-slate-950' : 'bg-white border border-slate-200 text-slate-600'}`}
                      >
                        3M
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlanData({ ...newPlanData, durationDays: 180 })}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold ${newPlanData.durationDays == 180 ? 'bg-amber-500 text-slate-950' : 'bg-white border border-slate-200 text-slate-600'}`}
                      >
                        6M
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlanData({ ...newPlanData, durationDays: 365 })}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold ${newPlanData.durationDays == 365 ? 'bg-amber-500 text-slate-950' : 'bg-white border border-slate-200 text-slate-600'}`}
                      >
                        12M
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="9999"
                    value={newPlanData.price}
                    onChange={(e) => setNewPlanData({ ...newPlanData, price: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Features (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Daily meals, High Speed WiFi, Free Delivery"
                  value={newPlanData.features}
                  onChange={(e) => setNewPlanData({ ...newPlanData, features: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlanData.isPopular}
                    onChange={(e) => setNewPlanData({ ...newPlanData, isPopular: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Mark as Most Popular</span>
                </label>

                <button
                  type="submit"
                  disabled={planSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
                >
                  {planSubmitting ? 'Saving Plan…' : 'Add This Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
