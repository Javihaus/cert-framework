'use client';

import { useState, useEffect } from 'react';
import {
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewItem {
  id: string;
  input: string;
  output: string;
  model: string;
  timestamp: string;
  score: number;
  judgeNotes: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function HumanReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  useEffect(() => {
    loadReviewItems();
  }, []);

  const loadReviewItems = async () => {
    setLoading(true);
    try {
      // Try to load from API
      const response = await fetch('/api/quality/review-queue');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        // Load from localStorage
        const stored = localStorage.getItem('cert-review-queue');
        if (stored) {
          setItems(JSON.parse(stored));
        }
      }
    } catch (e) {
      // Load from localStorage as fallback
      const stored = localStorage.getItem('cert-review-queue');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    }
    setLoading(false);
  };

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    const currentItem = filteredItems[currentIndex];
    if (!currentItem) return;

    // Update local state
    const updatedItems = items.map((item) =>
      item.id === currentItem.id ? { ...item, status: decision } : item
    );
    setItems(updatedItems);
    localStorage.setItem('cert-review-queue', JSON.stringify(updatedItems));

    // Try to sync with backend
    try {
      await fetch(`/api/quality/review/${currentItem.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, feedback }),
      });
    } catch (e) {
      // Continue with local-only update
    }

    // Reset and move to next
    setFeedback('');
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const filteredItems = filter === 'pending'
    ? items.filter((item) => item.status === 'pending')
    : items;

  const currentItem = filteredItems[currentIndex];
  const pendingCount = items.filter((item) => item.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
            <User className="w-7 h-7 text-orange-500" />
            Human Review Queue
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Review traces that need manual verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as 'all' | 'pending');
              setCurrentIndex(0);
            }}
            className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
          >
            <option value="pending">Pending Only ({pendingCount})</option>
            <option value="all">All Items ({items.length})</option>
          </select>
          <button
            onClick={loadReviewItems}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Clock className="w-4 h-4" />
            Pending
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Approved
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {items.filter((i) => i.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <XCircle className="w-4 h-4 text-red-500" />
            Rejected
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {items.filter((i) => i.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Review Card */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            {filter === 'pending' ? 'All caught up!' : 'No items to show'}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            {filter === 'pending'
              ? 'There are no traces pending review. Run some evaluations to populate the queue.'
              : 'No review items found. Items will appear here when evaluations fall below the confidence threshold.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {/* Navigation */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Trace #{currentItem?.id?.slice(0, 8) || 'N/A'}
              </span>
              {currentItem?.status !== 'pending' && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    currentItem?.status === 'approved'
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                  )}
                >
                  {currentItem?.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {currentIndex + 1} of {filteredItems.length}
              </span>
              <button
                onClick={() =>
                  setCurrentIndex(Math.min(filteredItems.length - 1, currentIndex + 1))
                }
                disabled={currentIndex === filteredItems.length - 1}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {currentItem && (
            <div className="p-6 space-y-6">
              {/* Meta Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>Model: {currentItem.model}</span>
                  <span>Time: {currentItem.timestamp}</span>
                </div>
                <div
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    currentItem.score >= 0.5
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                      : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                  )}
                >
                  Score: {currentItem.score.toFixed(2)}
                </div>
              </div>

              {/* Input */}
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  INPUT
                </h3>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {currentItem.input}
                  </p>
                </div>
              </div>

              {/* Output */}
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  OUTPUT
                </h3>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {currentItem.output}
                  </p>
                </div>
              </div>

              {/* Judge Notes */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    LLM Judge Notes
                  </h3>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {currentItem.judgeNotes}
                </p>
              </div>

              {/* Feedback */}
              {currentItem.status === 'pending' && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Your Feedback (optional)
                  </h3>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Add notes about this evaluation..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              {currentItem.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecision('approved')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision('rejected')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    onClick={handleSkip}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                  >
                    <SkipForward className="w-5 h-5" />
                    Skip
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
