import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../services/api';
import { reverseGeocode } from '../utils/locationAndMedia';
import {
  MapPin,
  Search,
  Bell,
  User,
  Shield,
  Briefcase,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Sparkles,
  Bookmark,
  BellRing,
  Navigation
} from 'lucide-react';

/* ── Live GPS badge shown in navbar ── */
function LiveLocationBadge() {
  const [label, setLabel] = useState('Locating…');
  const [live,  setLive]  = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setLabel('No GPS'); return; }
    let lastKey = '';
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        setLive(true);
        const key = `${pos.coords.latitude.toFixed(3)},${pos.coords.longitude.toFixed(3)}`;
        if (key !== lastKey) {
          lastKey = key;
          const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (geo?.shortLabel) {
            setLabel(geo.shortLabel);
            return;
          }
        }
        setLabel((prev) =>
          prev === 'Locating…'
            ? `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`
            : prev
        );
      },
      () => { setLabel('Location unavailable'); setLive(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
      ${live ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
      <Navigation className={`w-3 h-3 ${live ? 'text-emerald-500' : 'text-slate-400'}`} />
      {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
      <span className="max-w-[160px] truncate">{label}</span>
    </div>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isStudent, isProvider, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      // Poll every 30 seconds for alerts/reminders
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications);
        const unread = res.data.notifications.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & City */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition">
                  Near<span className="text-brand-600">Pulse</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium -mt-1 tracking-wider uppercase">
                  Amenities & Subscriptions
                </span>
              </div>
            </Link>

            {/* Live Location Badge */}
            <LiveLocationBadge />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {(!isProvider || isAdmin) && (
              <Link
                to="/explore"
                className={`flex items-center gap-1.5 transition ${
                  location.pathname === '/explore' ? 'text-brand-600 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                <Search className="w-4 h-4" />
                Explore Amenities
              </Link>
            )}

            {isAuthenticated && isStudent && (
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 transition ${
                  location.pathname === '/dashboard' ? 'text-brand-600 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                My Subscriptions
              </Link>
            )}

            {isAuthenticated && isProvider && (
              <Link
                to="/provider"
                className={`flex items-center gap-1.5 transition ${
                  location.pathname.startsWith('/provider') ? 'text-amber-600 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4 text-amber-500" />
                Provider Portal
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 transition ${
                  location.pathname.startsWith('/admin') ? 'text-purple-600 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-600" />
                Admin Console
              </Link>
            )}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowProfileMenu(false);
                    }}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-xs bg-brand-50 text-brand-600 font-semibold px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 py-6 text-center">No notifications yet.</p>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item.id}
                              className={`py-3 px-2 rounded-lg transition ${
                                !item.isRead ? 'bg-brand-50/40' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                {item.type === 'RENEWAL_REMINDER' ? (
                                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 mt-0.5 shrink-0">
                                    <BellRing className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="p-1.5 rounded-lg bg-brand-100 text-brand-700 mt-0.5 shrink-0">
                                    <Sparkles className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="flex-1 text-xs">
                                  <p className="font-semibold text-slate-900">{item.title}</p>
                                  <p className="text-slate-600 mt-0.5 line-clamp-2">{item.message}</p>
                                  <span className="text-[10px] text-slate-400 mt-1 block">
                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
                  >
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/20"
                    />
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-900 leading-tight">
                        {user?.name?.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {user?.role === 'STUDENT_PROFESSIONAL'
                          ? 'Student'
                          : user?.role === 'SERVICE_PROVIDER'
                          ? 'Provider'
                          : 'Admin'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1 text-xs">
                        {isStudent && (
                          <>
                            <Link
                              to="/dashboard"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                            >
                              <LayoutDashboard className="w-4 h-4 text-brand-600" />
                              User Dashboard
                            </Link>
                            <Link
                              to="/dashboard?tab=saved"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                            >
                              <Bookmark className="w-4 h-4 text-rose-500" />
                              Saved Amenities
                            </Link>
                          </>
                        )}

                        {isProvider && (
                          <Link
                            to="/provider"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Briefcase className="w-4 h-4 text-amber-500" />
                            Provider Dashboard
                          </Link>
                        )}

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Shield className="w-4 h-4 text-purple-600" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1 text-xs">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm hover:shadow transition"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
