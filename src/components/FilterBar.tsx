'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const PLATFORMS = [
  { value: '', label: '전체' },
  { value: 'naver', label: '네이버' },
  { value: 'kakao', label: '카카오' },
  { value: 'ridi', label: '리디' },
  { value: 'etc', label: '기타' },
];

const STATUSES = [
  { value: '', label: '전체' },
  { value: 'ongoing', label: '연재중' },
  { value: 'completed', label: '완결' },
];

const GENRES = [
  { value: '', label: '전체' },
  { value: '로맨스', label: '로맨스' },
  { value: '판타지', label: '판타지' },
  { value: '액션', label: '액션' },
  { value: '무협', label: '무협' },
  { value: '드라마', label: '드라마' },
  { value: '스릴러', label: '스릴러' },
];

const INITIALS = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export default function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const platform = sp.get('platform') ?? '';
  const status = sp.get('status') ?? '';
  const genre = sp.get('genre') ?? '';
  const initial = sp.get('initial') ?? '';
  const size = sp.get('size') ?? '20';

  const activeCount = [platform, status, genre, initial, size !== '20' ? size : ''].filter(Boolean).length;

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    const next = params.toString();
    router.push(next ? `/?${next}` : '/');
  };

  const chip = (active: boolean) =>
    `h-8 rounded-full border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
      active
        ? 'bg-gray-950 text-white border-gray-950 dark:bg-white dark:text-gray-950 dark:border-white'
        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400'
    }`;

  return (
    <div className="px-4">
      {/* 토글 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs font-bold text-gray-500 transition-colors hover:border-gray-300 dark:border-gray-900 dark:text-gray-400 dark:hover:border-gray-700"
      >
        <span className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h18M6 12h12M9 20h6" />
          </svg>
          필터
          {activeCount > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-px text-[10px] font-black text-white">
              {activeCount}
            </span>
          )}
        </span>
        <span className="text-base leading-none">{open ? '−' : '+'}</span>
      </button>

      {/* 필터 패널 */}
      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-gray-100 p-3 dark:border-gray-900">
          <FilterRow label="개수">
            {[10, 20, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => update('size', n === 20 ? '' : String(n))}
                className={chip(size === String(n) || (size === '20' && n === 20))}
              >
                {n}개
              </button>
            ))}
          </FilterRow>
          <FilterRow label="초성">
            <button onClick={() => update('initial', '')} className={chip(initial === '')}>전체</button>
            {INITIALS.map((v) => (
              <button key={v} onClick={() => update('initial', v)} className={chip(initial === v)}>{v}</button>
            ))}
          </FilterRow>
          <FilterRow label="장르">
            {GENRES.map(({ value, label }) => (
              <button key={value} onClick={() => update('genre', value)} className={chip(genre === value)}>
                {label}
              </button>
            ))}
          </FilterRow>
          <FilterRow label="플랫폼">
            {PLATFORMS.map(({ value, label }) => (
              <button key={value} onClick={() => update('platform', value)} className={chip(platform === value)}>
                {label}
              </button>
            ))}
          </FilterRow>
          <FilterRow label="상태">
            {STATUSES.map(({ value, label }) => (
              <button key={value} onClick={() => update('status', value)} className={chip(status === value)}>
                {label}
              </button>
            ))}
          </FilterRow>
          {activeCount > 0 && (
            <button
              onClick={() => { update('platform', ''); update('status', ''); update('genre', ''); update('initial', ''); update('size', ''); }}
              className="mt-1 w-full rounded-full border border-red-200 py-1 text-[11px] font-bold text-red-400 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
            >
              필터 전체 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-11 shrink-0 text-[11px] font-bold text-gray-400 dark:text-gray-500">{label}</span>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">{children}</div>
    </div>
  );
}
