'use client';

import { useRouter, useSearchParams } from 'next/navigation';

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

export default function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const platform = sp.get('platform') ?? '';
  const status = sp.get('status') ?? '';
  const genre = sp.get('genre') ?? '';

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
    <div className="px-4 space-y-2">
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
