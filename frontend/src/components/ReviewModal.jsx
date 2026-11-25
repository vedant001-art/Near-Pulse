import React, { useState } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';
import { reviewsApi } from '../services/api';

export default function ReviewModal({ isOpen, onClose, amenityId, amenityName, onReviewSubmitted = () => {} }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please enter your review feedback.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await reviewsApi.createReview(amenityId, { rating, comment });
      if (res.data.success) {
        setSuccess(true);
        onReviewSubmitted(res.data.review);
        setTimeout(() => {
          setSuccess(false);
          setComment('');
          onClose();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-400">
              Community Review
            </span>
            <h3 className="text-base font-bold text-white">Rate & Review</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition text-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-500 mb-4">
            Share your honest experience with <strong className="text-slate-800">{amenityName}</strong> to help fellow students and working professionals.
          </p>

          {success ? (
            <div className="py-8 text-center animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">Review Submitted!</h4>
              <p className="text-xs text-slate-500 mt-1">Thank you for contributing to the community.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {hoverRating || rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Review & Experience
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the food hygiene, room quality, gym equipment, or doctor consultation? Was the staff courteous?"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Publishing Review...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
