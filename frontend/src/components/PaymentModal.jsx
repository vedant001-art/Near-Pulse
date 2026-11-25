import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, CreditCard, Smartphone, Building2, Wallet, AlertCircle, CheckCircle2, Lock, X } from 'lucide-react';
import { paymentsApi } from '../services/api';

export default function PaymentModal({
  isOpen,
  onClose,
  subscriptionId,
  orderData,
  totalAmount,
  amenityName,
  planName,
  onSuccess = () => {},
  onFailure = () => {}
}) {
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [bank, setBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handlePay = async (simulateSuccess = true) => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // Simulate realistic network latency for payment gateway
      await new Promise((r) => setTimeout(r, 1200));

      if (!simulateSuccess) {
        throw new Error('Payment was declined by issuing bank or customer cancelled in gateway.');
      }

      // Generate payment ID & signature for verification
      const paymentId = `pay_NP_${Date.now()}`;
      const signature = `sig_demo_${paymentId}`;

      const res = await paymentsApi.verifyPayment({
        subscriptionId,
        orderId: orderData?.id || `order_NP_${Date.now()}`,
        paymentId,
        signature,
        paymentMethod: selectedMethod === 'UPI' ? `UPI (${upiId})` : selectedMethod === 'CARD' ? `Card (•••• ${cardNumber.slice(-4)})` : selectedMethod
      });

      if (res.data.success) {
        triggerConfetti();
        onSuccess(res.data);
      } else {
        throw new Error(res.data.message || 'Payment verification failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment failed';
      setErrorMsg(msg);
      onFailure(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header with Razorpay-like branding */}
        <div className="bg-gradient-to-r from-blue-700 via-brand-700 to-indigo-800 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">
                  Razorpay Secured Gateway
                </span>
                <h3 className="text-base font-bold text-white">NearPulse Checkout</h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <div>
              <p className="text-blue-100 font-medium truncate max-w-[240px]">{amenityName}</p>
              <p className="text-[11px] text-blue-200">{planName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-blue-200 block uppercase">Amount Payable</span>
              <span className="text-xl font-extrabold text-white">
                ₹{totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Test Sandbox Mode:</strong> Real bank money will not be deducted. You can test both success and failure states.
          </span>
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSelectedMethod('UPI')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                selectedMethod === 'UPI'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-semibold">UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('CARD')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                selectedMethod === 'CARD'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-semibold">Card</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('NETBANKING')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                selectedMethod === 'NETBANKING'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-semibold">NetBanking</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('WALLET')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                selectedMethod === 'WALLET'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-semibold">Wallets</span>
            </button>
          </div>

          {/* Form based on selected method */}
          {selectedMethod === 'UPI' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UPI ID (Google Pay, PhonePe, Paytm, BHIM)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi"
                    className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setUpiId('student@oksbi')}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-600"
                  >
                    Use Demo UPI
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
                <span className="px-2 py-1 rounded bg-slate-100 font-medium">GPay</span>
                <span className="px-2 py-1 rounded bg-slate-100 font-medium">PhonePe</span>
                <span className="px-2 py-1 rounded bg-slate-100 font-medium">Paytm</span>
                <span className="px-2 py-1 rounded bg-slate-100 font-medium">BHIM</span>
              </div>
            </div>
          )}

          {selectedMethod === 'CARD' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'NETBANKING' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Select Your Bank</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBank(b)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition ${
                      bank === b ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedMethod === 'WALLET' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Select Wallet</label>
              <div className="space-y-2 text-xs">
                {['Paytm Wallet (Linked: +91 98765 43210)', 'Amazon Pay Balance', 'MobiKwik'].map((w) => (
                  <label key={w} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input type="radio" name="wallet" defaultChecked={w.includes('Paytm')} />
                    <span className="font-medium text-slate-700">{w}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Error Message if any */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePay(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Verifying Transaction with Bank...
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Authorize & Pay ₹{totalAmount?.toLocaleString('en-IN')} (Success)
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePay(false)}
              className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition border border-slate-200 hover:border-rose-200 disabled:opacity-50"
            >
              Simulate Payment Failure / Decline (Test Failure Branch)
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>256-bit TLS Encryption • Razorpay Mock Sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
}
