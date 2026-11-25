import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Heart,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
  FileText,
  ExternalLink,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  MapPin,
  X,
  BellRing
} from 'lucide-react';
import { subscriptionsApi, paymentsApi, amenitiesApi, notificationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'subscriptions';

  const { user, updateProfile } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [savedAmenities, setSavedAmenities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Invoice Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Cancel Confirmation Modal state
  const [cancelModalSub, setCancelModalSub] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [subRes, payRes, savedRes, notifRes] = await Promise.all([
        subscriptionsApi.getUserSubscriptions(),
        paymentsApi.getPaymentHistory(),
        amenitiesApi.getSavedAmenities(),
        notificationsApi.getNotifications()
      ]);

      if (subRes.data.success) setSubscriptions(subRes.data.subscriptions);
      if (payRes.data.success) setPayments(payRes.data.payments);
      if (savedRes.data.success) setSavedAmenities(savedRes.data.amenities);
      if (notifRes.data.success) setNotifications(notifRes.data.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelModalSub) return;
    setCancelling(true);
    try {
      const res = await subscriptionsApi.cancelSubscription(cancelModalSub.id);
      if (res.data.success) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === cancelModalSub.id ? { ...s, status: 'CANCELLED' } : s))
        );
        setCancelModalSub(null);
      }
    } catch (e) {
      alert('Failed to cancel subscription: ' + (e.response?.data?.message || e.message));
    } finally {
      setCancelling(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    const res = await updateProfile(profileForm);
    if (res.success) {
      setProfileMsg('Profile information updated successfully!');
    } else {
      setProfileMsg(res.message || 'Failed to update profile.');
    }
    setProfileSaving(false);
  };

  const handleRemoveSaved = async (id) => {
    try {
      await amenitiesApi.toggleSave(id);
      setSavedAmenities((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const expiringSoonCount = subscriptions.filter((s) => s.isExpiringSoon).length;
  const totalSpent = payments
    .filter((p) => p.paymentStatus === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500/30 shadow-md"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  Student & Professional Portal
                </span>
                <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email} • {user?.phone || 'No phone added'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/explore"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white shadow transition"
              >
                + Discover New Amenity
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Active Subscriptions</span>
              <p className="text-xl font-extrabold text-white mt-1">{activeCount}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Renewals Due (7 Days)</span>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{expiringSoonCount}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Spent</span>
              <p className="text-xl font-extrabold text-white mt-1">₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Saved Bookmarks</span>
              <p className="text-xl font-extrabold text-white mt-1">{savedAmenities.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-3 mb-6 no-scrollbar">
          {[
            { id: 'subscriptions', label: 'My Subscriptions', icon: LayoutDashboard, count: subscriptions.length },
            { id: 'renewals', label: 'Renewals & Alerts', icon: BellRing, count: expiringSoonCount },
            { id: 'payments', label: 'Payment History', icon: CreditCard, count: payments.length },
            { id: 'saved', label: 'Saved Amenities', icon: Heart, count: savedAmenities.length },
            { id: 'profile', label: 'Profile Settings', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: My Subscriptions */}
        {currentTab === 'subscriptions' && (
          <div className="space-y-4">
            {expiringSoonCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-amber-900">
                    You have {expiringSoonCount} subscription(s) expiring within the next 7 days!
                  </h4>
                  <p className="text-amber-700 mt-0.5">
                    Renew now to avoid disruption in your daily mess meals, gym access, or PG accommodation.
                  </p>
                </div>
              </div>
            )}

            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 text-base">No Active Subscriptions</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  You haven't subscribed to any local mess, PG, or gym service yet. Browse verified listings near you!
                </p>
                <Link
                  to="/explore"
                  className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                >
                  Explore Amenities
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {subscriptions.map((sub) => {
                  const isExpiring = sub.isExpiringSoon;
                  const isActive = sub.status === 'ACTIVE';

                  return (
                    <div
                      key={sub.id}
                      className={`bg-white rounded-2xl border p-5 transition flex flex-col justify-between ${
                        isExpiring
                          ? 'border-amber-300 ring-2 ring-amber-300/20 shadow-md'
                          : 'border-slate-200 shadow-sm'
                      }`}
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              sub.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sub.status === 'PENDING_PAYMENT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            ● {sub.status.replace('_', ' ')}
                          </span>

                          {isExpiring && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <BellRing className="w-3 h-3 text-amber-600" />
                              Expires in {sub.daysLeft} days
                            </span>
                          )}
                        </div>

                        {/* Amenity Info */}
                        <div className="flex items-start gap-3.5">
                          <img
                            src={sub.coverImage}
                            alt={sub.amenity.name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                          <div>
                            <Link to={`/amenities/${sub.amenityId}`}>
                              <h3 className="font-bold text-slate-900 text-sm hover:text-brand-600 transition line-clamp-1">
                                {sub.amenity.name}
                              </h3>
                            </Link>
                            <p className="text-xs text-brand-600 font-semibold mt-0.5">{sub.plan.name}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{sub.amenity.locality}</span>
                            </p>
                          </div>
                        </div>

                        {/* Validity Progress Bar */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                            <span className="text-[11px]">Validity Progress</span>
                            <span className="font-bold text-slate-800">
                              {sub.daysLeft} days remaining
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isExpiring ? 'bg-amber-500' : 'bg-brand-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, sub.progressPercent || 50))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>Started: {new Date(sub.startDate).toLocaleDateString()}</span>
                            <span>Expires: {new Date(sub.expiryDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <Link
                          to={`/amenities/${sub.amenityId}`}
                          className="text-xs font-semibold text-slate-600 hover:text-brand-600 transition"
                        >
                          View Listing Details
                        </Link>

                        <div className="flex items-center gap-2">
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => setCancelModalSub(sub)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          )}

                          <Link
                            to={`/checkout?amenityId=${sub.amenityId}&planId=${sub.planId}`}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
                          >
                            Renew Plan
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Renewals & Alerts */}
        {currentTab === 'renewals' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Renewal Reminders & Notification Logs</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated background alerts generated before subscription expiration.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No renewal alerts recorded yet.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="py-3 flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        n.type === 'RENEWAL_REMINDER'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-brand-100 text-brand-700'
                      }`}
                    >
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Payment History */}
        {currentTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Transaction & Billing History</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All completed, pending, and refunded transactions.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3.5 pl-5">Date</th>
                    <th className="p-3.5">Amenity & Plan</th>
                    <th className="p-3.5">Payment Ref ID</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 pl-5 text-slate-600">
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {p.subscription?.amenity?.name || 'Local Amenity'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {p.subscription?.plan?.name}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-600">
                          {p.gatewayReference || p.razorpayPaymentId || 'DEMO_REF'}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {p.paymentMethod || 'UPI / Online'}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.paymentStatus === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.paymentStatus === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 text-[11px] transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Saved Amenities */}
        {currentTab === 'saved' && (
          <div>
            {savedAmenities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 text-base">No Saved Amenities</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Click the heart icon on any amenity card to bookmark it for quick access later.
                </p>
                <Link
                  to="/explore"
                  className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                >
                  Explore Amenities
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {savedAmenities.map((amenity) => (
                  <div key={amenity.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="relative h-44 bg-slate-100">
                        <img src={amenity.coverImage} alt={amenity.name} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveSaved(amenity.id)}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 text-rose-600 hover:bg-white shadow transition"
                          title="Remove bookmark"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <span className="text-[10px] font-bold uppercase text-brand-600">
                          {amenity.category.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">{amenity.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{amenity.locality}</span>
                        </p>
                      </div>
                    </div>
                    <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        ₹{amenity.startingPrice?.toLocaleString('en-IN')}/mo
                      </span>
                      <Link
                        to={`/amenities/${amenity.id}`}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg transition"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Profile Settings */}
        {currentTab === 'profile' && (
          <div className="max-w-xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">Personal Profile Settings</h3>
            <p className="text-xs text-slate-500 mb-6">
              Update your contact details to receive accurate renewal reminders and invoices.
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (For WhatsApp Updates)</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bio / Notes</label>
                <textarea
                  rows={2}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="e.g. Final year CS Student at Christ University, living in Koramangala"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                />
              </div>

              {profileMsg && (
                <p className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {profileMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={profileSaving}
                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow transition"
              >
                {profileSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Invoice Digital Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-900 text-sm">Tax Invoice & Digital Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-mono font-bold text-slate-900">INV-{selectedReceipt.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-800">{new Date(selectedReceipt.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.subscription?.amenity?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="text-slate-800">{selectedReceipt.subscription?.plan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Ref:</span>
                <span className="font-mono text-slate-600">{selectedReceipt.gatewayReference}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Total Paid:</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition"
              >
                Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {cancelModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Cancel Subscription?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to cancel your subscription to <strong>{cancelModalSub.amenity?.name}</strong>? You will continue to have access until {new Date(cancelModalSub.expiryDate).toLocaleDateString()}.
            </p>

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setCancelModalSub(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelSubscription}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
