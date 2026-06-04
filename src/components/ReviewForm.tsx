'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createOrUpdateReview, deleteReview } from '@/app/actions';
import { ReviewWithProfile } from '@/types';

interface Props {
  webtoonId: string;
  existingReview: ReviewWithProfile | null;
}

function scoreColor(score: number) {
  if (score >= 8) return 'text-green-500';
  if (score >= 5) return 'text-amber-500';
  return 'text-red-500';
}

function formatScore(score: number) {
  const value = Number(score);
  return Number.isFinite(value) ? value.toFixed(1) : '−';
}

export default function ReviewForm({ webtoonId, existingReview }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(!existingReview);
  const [score, setScore] = useState(existingReview?.score ?? 7.0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = () => {
    if (!comment.trim()) { setErrorMsg('한줄평을 입력해주세요'); return; }
    setErrorMsg('');
    startTransition(async () => {
      const result = await createOrUpdateReview(webtoonId, score, comment.trim());
      if (result.error) { setErrorMsg(result.error); return; }
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!existingReview) return;
    if (!confirm('한줄평을 삭제할까요?')) return;
    startTransition(async () => {
      const result = await deleteReview(existingReview.id);
      if (result.error) { setErrorMsg(result.error); return; }
      setScore(7.0);
      setComment('');
      setIsEditing(true);
      router.refresh();
    });
  };

  // 이미 리뷰가 있고 수정 모드가 아닐 때: 내 리뷰 요약 표시
  if (existingReview && !isEditing) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">내 한줄평</span>
          <span className={`text-lg font-black tabular-nums ${scoreColor(existingReview.score)}`}>
            {formatScore(existingReview.score)}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{existingReview.comment}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline"
          >
            수정
          </button>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-red-400 hover:text-red-600 font-medium hover:underline disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 점수 슬라이더 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">점수</span>
          <span className={`text-2xl font-black tabular-nums ${scoreColor(score)}`}>
            {formatScore(score)}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-amber-400"
        />
        <div className="flex justify-between text-[10px] text-gray-300 dark:text-gray-600">
          <span>1.0</span>
          <span>5.5</span>
          <span>10.0</span>
        </div>
      </div>

      {/* 한줄평 */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="이 웹툰 어땠나요? 솔직하게 남겨주세요."
        maxLength={200}
        rows={3}
        className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent resize-none focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 placeholder-gray-300 dark:placeholder-gray-600"
      />
      <div className="flex justify-end">
        <span className="text-[11px] text-gray-300 dark:text-gray-600">{comment.length}/200</span>
      </div>

      {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

      <div className="flex gap-2">
        {existingReview && (
          <button
            onClick={() => { setIsEditing(false); setScore(existingReview.score); setComment(existingReview.comment); }}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            취소
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
        >
          {isPending ? '저장 중...' : existingReview ? '수정 완료' : '평점 남기기'}
        </button>
      </div>
    </div>
  );
}
