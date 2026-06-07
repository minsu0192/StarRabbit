'use client';

import { useState } from 'react';

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export default function PointHistoryModal() {
  const [open, setOpen] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  async function loadMore(reset = false) {
    if (loading) return;
    setLoading(true);
    setError(null);
    const from = reset ? 0 : page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`/api/point-history?from=${from}&to=${to}`, {
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null) as { transactions?: Transaction[]; error?: string } | null;

      if (!res.ok || data?.error) {
        setError(data?.error ?? '획득 내역을 불러오지 못했어요');
        return;
      }

      const transactions = data?.transactions ?? [];
      setTxs((prev) => reset ? transactions : [...prev, ...transactions]);
      setHasMore(transactions.length === PAGE_SIZE);
      setPage(reset ? 1 : (p) => p + 1);
      setLoadedOnce(true);
    } catch (fetchError) {
      setError(fetchError instanceof DOMException && fetchError.name === 'AbortError'
        ? '획득 내역 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요'
        : '네트워크 오류가 발생했어요');
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    if (!loadedOnce) {
      void loadMore(true);
    }
  }

  function formatDate(iso: string) {
    return iso.slice(0, 16).replace('T', ' ');
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs font-bold text-amber-500 hover:text-amber-600 underline underline-offset-2"
      >
        획득 내역 보기
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* 배경 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* 모달 */}
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-950 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h2 className="text-base font-black">스타 획득 내역</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 목록 */}
            <div className="overflow-y-auto flex-1 px-5 py-2">
              {txs.length === 0 && !loading && (
                <p className="py-10 text-center text-sm text-gray-400">
                  {error ?? '아직 획득 내역이 없어요'}
                </p>
              )}
              <ul className="divide-y divide-gray-100 dark:divide-gray-900">
                {txs.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{tx.reason}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(tx.created_at)}</p>
                    </div>
                    <span className={`text-sm font-black tabular-nums shrink-0 ${tx.amount > 0 ? 'text-amber-500' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} ★
                    </span>
                  </li>
                ))}
              </ul>

              {hasMore && !loading && (
                <button
                  onClick={() => loadMore()}
                  className="w-full py-3 text-xs text-gray-400 hover:text-gray-600"
                >
                  더 보기
                </button>
              )}
              {loading && (
                <p className="py-4 text-center text-xs text-gray-400">불러오는 중...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
