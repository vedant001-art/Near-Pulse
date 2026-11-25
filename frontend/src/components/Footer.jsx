import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-sky-400 flex items-center justify-center text-white shadow-md">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Near<span className="text-brand-400">Pulse</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The modern discovery and subscription platform connecting students and working professionals with verified mess services, PGs, gyms, clinics, and local essentials.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Partner Network</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                <span>Bengaluru Region</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore Amenities
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/explore?category=MESS_TIFFIN" className="hover:text-white transition">
                  Mess & Tiffin Services
                </Link>
              </li>
              <li>
                <Link to="/explore?category=PG_ACCOMMODATION" className="hover:text-white transition">
                  PG & Co-Living Spaces
                </Link>
              </li>
              <li>
                <Link to="/explore?category=HOSTEL" className="hover:text-white transition">
                  Student Hostels
                </Link>
              </li>
              <li>
                <Link to="/explore?category=GYM_FITNESS" className="hover:text-white transition">
                  Gyms & Fitness Centers
                </Link>
              </li>
              <li>
                <Link to="/explore?category=HOSPITAL_CLINIC" className="hover:text-white transition">
                  Clinics & 24/7 Medical
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Platform & Tools
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/explore" className="hover:text-white transition">
                  Interactive Map View
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  Subscriber Dashboard
                </Link>
              </li>
              <li>
                <Link to="/provider" className="hover:text-white transition">
                  List Your Service (Provider)
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition">
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Contact & Support
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400" />
                <span>support@nearpulse.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400" />
                <span>+91 80 4912 3456</span>
              </li>
              <li className="text-xs text-slate-500 pt-2">
                Koramangala, Bengaluru, Karnataka 560034
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Demo Notice */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} NearPulse Technologies Inc. Built for Students & Urban Professionals.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-amber-400 border border-amber-900/40">
              ⚠️ Demo Sandbox: Includes Realistic Test Data & Simulated Razorpay Payments
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
