'use client';

import { useState } from 'react';
import ScoreBadge from '@/components/ScoreBadge';

interface Review {
  id: string;
  score: number;
  comment: string;
  recommend_count: number;
  created_at: string;
  webtoons: { title: string } | null;
}

interface Props {
  reviews: Review[];
}

const PAGE_SIZE = 10;

export default function MyReviewList({ reviews }: Props) {
  const [query, setQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('profile-review-query') ?? '';
  });
  const [page, setPage] = useState(1);

  const filtered = reviews.filter((r) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      (r.webtoons?.title ?? '').toLowerCase().includes(q) ||
      (r.comment ?? '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleQuery(v: string) {
    setQuery(v);
    setPage(1);
    sessionStorage.setItem('profile-review-query', v);
  }

  return (
    <div>
      {/* 검색 */}
      <div className="px-4 pb-3">
        <input
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          placeholder="작품명 또는 내용 검색..."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950 focus:outline-none focus:border-amber-300"
        />
      </div>

      {paged.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          {query ? '검색 결과가 없어요' : '아직 남긴 한줄평이 없어요'}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {paged.map((review) => (
              <li key={review.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">
                      {review.webtoons?.title ?? '알 수 없음'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                      {review.comment || '별점만 남겼어요'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {review.created_at.slice(0, 10).replace(/-/g, '.')}
                      {review.recommend_count > 0 && ` · ★ ${review.recommend_count}`}
                    </p>
                  </div>
                  <ScoreBadge score={review.score} size="sm" />
                </div>
              </li>
            ))}
          </ul>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 px-4 py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-md text-xs font-bold text-gray-400 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, i, arr) => (
                  <>
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span key={`ellipsis-${p}`} className="text-xs text-gray-300 px-1">…</span>
                    )}
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-bold ${
                        p === currentPage
                          ? 'bg-amber-400 text-white'
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900'
                      }`}
                    >
                      {p}
                    </button>
                  </>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-md text-xs font-bold text-gray-400 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
