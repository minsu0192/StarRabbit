'use client';

import { useState } from 'react';

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

const PAGE_SIZE = 10;
const MAX_PAGES = 10;

export default function PointHistoryModal() {
  const [open, setOpen] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGES);
  const overflowing = total > MAX_PAGES * PAGE_SIZE;

  async function loadPage(p: number) {
    if (loading) return;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const tid = window.setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`/api/point-history?page=${p}`, { signal: controller.signal });
      const data = await res.json().catch(() => null) as { transactions?: Transaction[]; total?: number; error?: string } | null;
      if (!res.ok || data?.error) {
        setError(data?.error ?? '내역을 불러오지 못했어요');
        return;
      }
      setTxs(data?.transactions ?? []);
      setTotal(data?.total ?? 0);
      setPage(p);
    } catch (err) {
      setError(err instanceof DOMException && err.name === 'AbortError'
        ? '응답이 지연되고 있어요. 잠시 후 다시 시도해주세요'
        : '네트워크 오류가 발생했어요');
    } finally {
      window.clearTimeout(tid);
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    if (txs.length === 0) loadPage(1);
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
        내역 보기
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-lg bg-white dark:bg-gray-950 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h2 className="text-base font-black">스타 획득 내역</h2>
                {total > 0 && (
                  <p className="text-[11px] text-gray-400 mt-0.5">총 {Math.min(total, MAX_PAGES * PAGE_SIZE).toLocaleString()}건</p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 삭제 경고 */}
            {overflowing && (
              <div className="px-5 py-2 border-b border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  100건 이전 내역은 자동으로 삭제됩니다. 현재 {total.toLocaleString()}건 중 최근 100건만 표시돼요.
                </p>
              </div>
            )}

            {/* 목록 */}
            <div className="overflow-y-auto flex-1 px-5 py-2">
              {loading ? (
                <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
              ) : error ? (
                <p className="py-10 text-center text-sm text-red-400">{error}</p>
              ) : txs.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">아직 획득 내역이 없어요</p>
              ) : (
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
              )}
            </div>

            {/* 페이지 네비게이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
                <button
                  onClick={() => loadPage(page - 1)}
                  disabled={page <= 1 || loading}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:border-gray-400 dark:border-gray-800 dark:text-gray-400"
                >
                  ← 이전
                </button>
                <span className="text-xs font-bold text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => loadPage(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:border-gray-400 dark:border-gray-800 dark:text-gray-400"
                >
                  다음 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
