'use client';

import { useState, useTransition } from 'react';
import { reportReview } from '@/app/actions';

const REASONS = ['스팸·홍보', '욕설·혐오표현', '허위정보', '기타'];

export default function ReportButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  if (done) return <span className="text-[11px] text-gray-400">신고 완료</span>;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] text-gray-300 hover:text-gray-400 dark:text-gray-700 dark:hover:text-gray-500 transition-colors"
      >
        신고
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="text-[11px] rounded border border-gray-200 px-1.5 py-0.5 bg-transparent dark:border-gray-700"
      >
        {REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <button
        onClick={() => startTransition(async () => {
          const result = await reportReview(reviewId, reason);
          if (result.error) { setErrorMsg(result.error); return; }
          setDone(true);
        })}
        disabled={isPending}
        className="text-[11px] font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        신고
      </button>
      <button
        onClick={() => { setOpen(false); setErrorMsg(''); }}
        className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
      >
        취소
      </button>
      {errorMsg && <span className="w-full text-[11px] text-red-400">{errorMsg}</span>}
    </span>
  );
}
