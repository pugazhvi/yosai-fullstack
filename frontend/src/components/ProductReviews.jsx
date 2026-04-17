import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Star, ThumbsUp, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/utils";

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="p-0.5"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await api.get(`/reviews/${productId}`);
      return res.data;
    },
    enabled: !!productId,
  });

  const submitMut = useMutation({
    mutationFn: (body) => api.post(`/reviews/${productId}`, body),
    onSuccess: () => {
      toast.success("Review submitted!");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      setShowForm(false);
      setRating(0);
      setTitle("");
      setComment("");
    },
    onError: (err) => toast.error(err?.message || "Failed to submit review"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      toast.success("Review deleted");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (err) => toast.error(err?.message || "Failed"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) { toast.error("Please select a rating"); return; }
    submitMut.mutate({ rating, title, comment });
  };

  const reviews = data?.reviews || [];
  const total = data?.total || 0;
  const avg = data?.avg || 0;
  const breakdown = data?.breakdown || [];
  const hasReviewed = reviews.some((r) => r.userId?._id === user?._id);

  return (
    <div className="max-w-3xl">
      {/* Summary */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-start gap-6 p-5 bg-gray-50 rounded-2xl mb-6">
          <div className="text-center sm:text-left flex-shrink-0">
            <div className="text-5xl font-bold text-gray-900">{avg}</div>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avg) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">{total} review{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 space-y-1.5 w-full">
            {breakdown.map((b) => (
              <div key={b.star} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-gray-500 w-3">{b.star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${total > 0 ? (b.count / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write review button */}
      {user && !hasReviewed && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
        >
          Write a Review
        </button>
      )}

      {!user && (
        <p className="mb-6 text-sm text-gray-500">
          <a href="/auth" className="text-pink-600 font-semibold hover:underline">Sign in</a> to write a review.
        </p>
      )}

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="mb-6 p-5 border border-gray-200 rounded-2xl space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
              <StarInput value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a line" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
              <textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like or dislike?" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">Cancel</button>
              <button type="submit" disabled={submitMut.isPending} className="btn-primary text-sm flex items-center gap-2">
                {submitMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit Review"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {r.userId?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{r.userId?.name || "User"}</p>
                      {r.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
              </div>
              {r.title && <p className="text-sm font-semibold text-gray-900 mt-3">{r.title}</p>}
              {r.comment && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>}
              {r.userId?._id === user?._id && (
                <button
                  onClick={() => deleteMut.mutate(r._id)}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
