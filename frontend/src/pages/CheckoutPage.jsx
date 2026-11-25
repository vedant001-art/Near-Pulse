import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { amenitiesApi, subscriptionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const amenityId = searchParams.get('amenityId');
  const planId = searchParams.get('planId');

  const [amenity, setAmenity] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [loading, setLoading] = useState(true);

  // Checkout process states
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingSubId, setPendingSubId] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [pricingBreakdown, setPricingBreakdown] = useState(null);

  // Final states
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/checkout?amenityId=${amenityId}%26planId=${planId}`);
      return;
    }
    loadData();
  }, [amenityId, planId, isAuthenticated]);

  const loadData = async () => {
    try {
      if (!amenityId || !planId) {
        navigate('/explore');
        return;
      }

      const res = await amenitiesApi.getAmenityById(amenityId);
      if (res.data.success) {
        setAmenity(res.data.amenity);
        const plan = res.data.amenity.subscriptionPlans?.find((p) => p.id === planId);
        if (plan) {
          setSelectedPlan(plan);
        } else {
          navigate(`/amenities/${amenityId}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate pricing breakdown
  const basePrice = selectedPlan?.price || 0;
  const platformFee = 49;
  const gst = Math.round(basePrice * 0.05); // 5% GST
  const totalAmount = basePrice + platformFee + gst;

  // Calculate expiry date based on selected start date and plan duration
  const calculateExpiry = () => {
    if (!startDate || !selectedPlan) return '';
    const start = new Date(startDate);
    const expiry = new Date(start.getTime() + selectedPlan.durationDays * 24 * 60 * 60 * 1000);
    return expiry.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleInitiatePayment = async () => {
    setIsCreatingOrder(true);
    setPaymentError('');

    try {
      const res = await subscriptionsApi.createSubscription({
        amenityId,
        planId,
        startDate: new Date(startDate).toISOString(),
        autoRenewal
      });

      if (res.data.success) {
        setPendingSubId(res.data.subscriptionId);
        setOrderData(res.data.order);
        setPricingBreakdown(res.data.pricing);
        setShowPaymentModal(true);
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to initiate order.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  // Success Screen
  if (paymentSuccessData) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Subscription Activated
          </span>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-3">
            Payment & Activation Successful!
          </h2>

          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Your subscription to <strong className="text-slate-800">{amenity?.name}</strong> is now live. A receipt has been saved to your account.
          </p>

          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 mt-6 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Selected Plan:</span>
              <span className="font-bold text-slate-900">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Valid Until:</span>
              <span className="font-bold text-emerald-600">{calculateExpiry()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono text-[11px] text-slate-600">{paymentSuccessData.paymentId}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition text-center"
            >
              View in My Dashboard
            </Link>
            <Link
              to="/explore"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition text-center"
            >
              Explore More Amenities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to={`/amenities/${amenityId}`} className="hover:text-slate-900">{amenity?.name}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold text-slate-900">Subscription Checkout</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="text-left mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Review & Confirm Subscription</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete your order with verified instant activation and payment security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Details Column (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            {/* Amenity Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Amenity Details
              </span>
              <div className="flex items-start gap-3.5 mt-3">
                <img
                  src={amenity?.images?.[0]?.url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800'}
                  alt={amenity?.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{amenity?.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{amenity?.locality}, {amenity?.city}</p>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Host: {amenity?.provider?.name || 'Local Partner'}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Plan & Duration Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Plan & Validity Dates
              </span>

              <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedPlan?.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Duration: {selectedPlan?.durationDays} Days</p>
                </div>
                <span className="text-lg font-black text-slate-900">
                  ₹{selectedPlan?.price.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Start Date Picker */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subscription Activation Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">
                    Expires on: <strong className="text-slate-800">{calculateExpiry()}</strong>
                  </span>
                </div>
              </div>

              {/* Auto Renewal Toggle */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Auto-Renewal Reminder</p>
                  <p className="text-[11px] text-slate-500">
                    Receive alert 7 days prior to expiry. You won't be charged without manual confirmation.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoRenewal}
                  onChange={(e) => setAutoRenewal(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            {/* Subscriber Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Subscriber Information
              </span>
              <div className="mt-2 text-xs text-slate-600 space-y-1">
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Contact:</strong> {user?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Right Price Breakdown & Action Column (5 cols) */}
          <div className="md:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-24">
              <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
                Payment Summary
              </h3>

              <div className="py-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Base Plan Fee:</span>
                  <span className="font-semibold text-slate-800">₹{basePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform & Security Fee:</span>
                  <span className="font-semibold text-slate-800">₹{platformFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5% Essential Services):</span>
                  <span className="font-semibold text-slate-800">₹{gst}</span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Payable:</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {paymentError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isCreatingOrder}
                onClick={handleInitiatePayment}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/20 hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreatingOrder ? (
                  <span>Generating Order...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Proceed to Pay ₹{totalAmount.toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Secure Checkout with Razorpay Sandbox</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Realistic Payment Gateway Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        subscriptionId={pendingSubId}
        orderData={orderData}
        totalAmount={totalAmount}
        amenityName={amenity?.name}
        planName={selectedPlan?.name}
        onSuccess={(data) => {
          setShowPaymentModal(false);
          setPaymentSuccessData(data);
        }}
        onFailure={(msg) => {
          setPaymentError(msg);
        }}
      />
    </div>
  );
}
