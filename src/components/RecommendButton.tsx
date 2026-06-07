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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleClick() {
    if (!canRecommend || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await toggleRecommend(reviewId);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        const wasRecommended = recommended;
        setRecommended(!wasRecommended);
        setCount((c) => wasRecommended ? c - 1 : c + 1);
      }
    } catch {
      setErrorMsg('오류가 발생했어요. 다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleClick}
        disabled={!canRecommend || loading}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors ${
          recommended
            ? 'border-amber-300 bg-amber-50 text-amber-500 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
            : canRecommend
              ? 'border-gray-200 text-gray-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500 dark:border-gray-800 dark:hover:border-amber-900 dark:hover:bg-amber-950/20'
              : 'border-gray-100 text-gray-300 dark:border-gray-900 dark:text-gray-700 cursor-default'
        }`}
      >
        <span>★</span>
        <span>{loading ? '...' : '추천'}</span>
        <span className="tabular-nums">{count}명</span>
      </button>
      {errorMsg && (
        <span className="text-[10px] text-red-400">{errorMsg}</span>
      )}
    </div>
  );
}
