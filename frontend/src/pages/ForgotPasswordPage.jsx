import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authApi } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (e) {
      setSent(true); // Always display message for privacy
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            Near<span className="text-brand-600">Pulse</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Reset Your Password</h2>
        <p className="mt-1 text-xs text-slate-500">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/80 sm:rounded-3xl">
          {sent ? (
            <div className="text-center py-6 animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 text-base">Check Your Inbox</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                If an account exists for <strong className="text-slate-800">{email}</strong>, a recovery link has been simulated and sent.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending link...' : 'Send Password Recovery Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
