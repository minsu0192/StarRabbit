'use client';

import { useState } from 'react';
import { toggleRecommend } from '@/app/actions';

interface Props {
  reviewId: string;
  initialCount: number;
  initialRecommended: boolean;
  canRecommend: boolean;
}

export default function RecommendButton({ reviewId, initialCount, initialRecommended, canRecommend }: Props) {
  const [recommended, setRecommended] = useState(initialRecommended);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!canRecommend || loading) return;
    setLoading(true);
    const result = await toggleRecommend(reviewId);
    setLoading(false);
    if (!result.error) {
      setRecommended(!recommended);
      setCount((c) => recommended ? c - 1 : c + 1);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!canRecommend || loading}
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
        recommended
          ? 'bg-red-50 text-red-500 dark:bg-red-950/30'
          : canRecommend
            ? 'text-gray-400 hover:bg-red-50 hover:text-red-400 dark:hover:bg-red-950/30'
            : 'text-gray-300 dark:text-gray-700 cursor-default'
      }`}
    >
      ♥{count > 0 ? ` ${count}` : ''}
    </button>
  );
}
