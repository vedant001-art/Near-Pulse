import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Send, CheckCircle2, X } from 'lucide-react';

export default function ContactProviderModal({ isOpen, onClose, provider, amenityName }) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!isOpen || !provider) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setMessage('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-400">
              Verified Service Provider
            </span>
            <h3 className="text-base font-bold text-white">Contact Host</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition text-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Provider Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
            <img
              src={provider.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.name}`}
              alt={provider.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/20"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{provider.name}</h4>
              <p className="text-xs text-slate-500">Host for {amenityName}</p>
            </div>
          </div>

          {/* Quick Direct Contacts */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <a
              href={`tel:${provider.phone || '+919876543210'}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold border border-brand-200 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Now</span>
            </a>
            <a
              href={`https://wa.me/${(provider.phone || '919876543210').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Inquiry Message Form */}
          {sent ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-800">Message Dispatched!</p>
              <p className="text-[11px] text-emerald-600 mt-1">
                {provider.name} will contact you shortly regarding your inquiry.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ask a Question or Request a Visit
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi ${provider.name}, I am interested in ${amenityName}. Is it available starting next week?`}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message to Provider</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
