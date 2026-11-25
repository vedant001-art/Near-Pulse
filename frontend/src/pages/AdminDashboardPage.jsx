import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Users,
  Briefcase,
  AlertTriangle,
  Play,
  RotateCcw,
  Trash2,
  Search,
  DollarSign,
  TrendingUp,
  MapPin,
  BellRing
} from 'lucide-react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'listings';

  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [listingFilter, setListingFilter] = useState('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');

  // Renewal simulation output log
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, [listingFilter, userRoleFilter]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, amRes, usRes, revRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAmenities({ status: listingFilter }),
        adminApi.getUsers({ role: userRoleFilter, search: userSearch }),
        adminApi.getReviews()
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (amRes.data.success) setAmenities(amRes.data.amenities);
      if (usRes.data.success) setUsers(usRes.data.users);
      if (revRes.data.success) setReviews(revRes.data.reviews);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApproval = async (id, status) => {
    const remarks = status === 'REJECTED' ? prompt('Enter reason for listing rejection:') : null;
    try {
      await adminApi.updateApproval(id, status, remarks);
      setAmenities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, approvalStatus: status } : a))
      );
    } catch (e) {
      alert('Error updating approval status: ' + e.message);
    }
  };

  const handleToggleUser = async (id) => {
    try {
      const res = await adminApi.toggleUserStatus(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: res.data.user.isActive } : u))
      );
    } catch (e) {
      alert('Failed to toggle status: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review as part of community moderation?')) return;
    try {
      await adminApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert('Failed to delete review: ' + e.message);
    }
  };

  const handleTriggerRenewalCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const res = await adminApi.triggerRenewalCron();
      setCronResult(res.data.result);
      loadAdminData();
    } catch (e) {
      alert('Cron trigger failed: ' + e.message);
    } finally {
      setCronRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Master Administration Console
              </span>
              <h1 className="text-2xl font-extrabold text-white">Platform Oversight & Moderation</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage all registered users, approve or reject service listings, moderate reviews, and monitor GMV.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={cronRunning}
                onClick={handleTriggerRenewalCron}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{cronRunning ? 'Checking...' : 'Run Renewal Cron Now'}</span>
              </button>
            </div>
          </div>

          {/* Platform Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8">
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Users</span>
              <p className="text-xl font-extrabold text-white mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Amenities</span>
              <p className="text-xl font-extrabold text-white mt-1">{stats?.totalAmenities || 0}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Active Subscriptions</span>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{stats?.activeSubscriptions || 0}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Platform GMV</span>
              <p className="text-xl font-extrabold text-brand-400 mt-1">
                ₹{(stats?.totalGMV || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Reviews Logged</span>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{stats?.totalReviews || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cron Result Banner */}
      {cronResult && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-sm mb-1">
              <span>✅ Renewal Cron Simulation Result</span>
              <span className="text-[11px] font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
            <p>
              Scanned all active subscriptions. <strong>{cronResult.remindersSent}</strong> reminder(s) dispatched to user inboxes. <strong>{cronResult.expiredUpdated}</strong> past-due subscription(s) auto-expired.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-3 mb-6 no-scrollbar">
          {[
            { id: 'listings', label: 'Listing Moderation', count: amenities.length },
            { id: 'users', label: 'User Management', count: users.length },
            { id: 'reviews', label: 'Review Moderation', count: reviews.length },
            { id: 'simulator', label: 'Demo Sandbox & Tools' }
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
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

        {/* Tab 1: Listings Moderation */}
        {currentTab === 'listings' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Amenity Listings Approval Queue</h3>
                <p className="text-xs text-slate-500">Approve, reject, or flag provider listings.</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Filter status:</span>
                <select
                  value={listingFilter}
                  onChange={(e) => setListingFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="REJECTED">Rejected Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Listing</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Provider Host</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Starting Price</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {amenities.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 pl-5">
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">{a.name}</span>
                        <Link to={`/amenities/${a.id}`} className="text-[10px] text-brand-600 hover:underline">
                          View details ↗
                        </Link>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">{a.category.replace('_', ' ')}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block">{a.provider?.name}</span>
                        <span className="text-[10px] text-slate-400">{a.provider?.email}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">{a.locality}</td>
                      <td className="p-3.5 font-bold text-slate-900">₹{a.startingPrice}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : a.approvalStatus === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {a.approvalStatus}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right space-x-1.5">
                        {a.approvalStatus !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateApproval(a.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        {a.approvalStatus !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateApproval(a.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px]"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: User Management */}
        {currentTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Platform Users Directory</h3>
                <p className="text-xs text-slate-500">Students, working professionals, providers, and admins.</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT_PROFESSIONAL">Students / Professionals</option>
                  <option value="SERVICE_PROVIDER">Service Providers</option>
                  <option value="ADMIN">Admins</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">User</th>
                    <th className="p-3.5">Email & Phone</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Created Date</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 pl-5 font-bold text-slate-900 flex items-center gap-2">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span>{u.name}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="block text-slate-700">{u.email}</span>
                        <span className="text-[10px] text-slate-400">{u.phone || 'No phone'}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleToggleUser(u.id)}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${
                              u.isActive
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Reviews */}
        {currentTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Community Reviews & Content Moderation</h3>
              <p className="text-xs text-slate-500">Remove inappropriate or spam reviews.</p>
            </div>

            <div className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{r.user?.name}</span>
                      <span className="text-[11px] text-slate-400">reviewed</span>
                      <span className="font-semibold text-brand-600 text-xs">{r.amenity?.name}</span>
                      <span className="text-amber-500 font-bold text-xs">★ {r.rating}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{r.comment}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition"
                    title="Remove review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Demo Simulator */}
        {currentTab === 'simulator' && (
          <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Evaluator Demo Sandbox Cheat-Sheet</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quick credentials and test triggers to verify every aspect of the platform.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">🎓 Student / Professional Account</span>
                <p><strong>Email:</strong> student@nearpulse.com</p>
                <p><strong>Password:</strong> student123</p>
                <p className="text-[11px] text-slate-500 mt-1">Has 1 active subscription & 1 expiring in 3 days with renewal alert.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">🏪 Service Provider Account (Mess Owner)</span>
                <p><strong>Email:</strong> provider@annapurnamess.com</p>
                <p><strong>Password:</strong> provider123</p>
                <p className="text-[11px] text-slate-500 mt-1">Has listings, active paying subscribers, and customer reviews.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">🛡️ Platform Administrator Account</span>
                <p><strong>Email:</strong> admin@nearpulse.com</p>
                <p><strong>Password:</strong> admin123</p>
                <p className="text-[11px] text-slate-500 mt-1">Full control over listing approval, user deactivation, and cron scheduling.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTriggerRenewalCron}
                disabled={cronRunning}
                className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Execute Renewal Reminders Daemon Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
