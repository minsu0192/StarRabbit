'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const PLATFORMS = [
  { value: '', label: '전체' },
  { value: 'naver', label: '네이버' },
  { value: 'kakao', label: '카카오' },
  { value: 'etc', label: '기타' },
];

const STATUSES = [
  { value: '', label: '전체' },
  { value: 'ongoing', label: '연재중' },
  { value: 'completed', label: '완결' },
];

const SORTS = [
  { value: 'score', label: '평점순' },
  { value: 'popular', label: '인기순' },
  { value: 'latest', label: '최신순' },
];

export default function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const sort = sp.get('sort') ?? 'score';
  const platform = sp.get('platform') ?? '';
  const status = sp.get('status') ?? '';

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const next = params.toString();
    router.push(next ? `/?${next}` : '/');
  };

  const chip = (active: boolean) =>
    `h-8 rounded-md border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
      active
        ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950 border-gray-950 dark:border-white'
        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400 dark:hover:border-gray-600'
    }`;

  return (
    <div className="px-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SORTS.map(({ value, label }) => (
          <button key={value} onClick={() => update('sort', value)} className={chip(sort === value)}>
            {label}
          </button>
        ))}
        <div className="mx-1 w-px shrink-0 bg-gray-200 dark:bg-gray-800" />
        {PLATFORMS.map(({ value, label }) => (
          <button key={`p-${value}`} onClick={() => update('platform', value)} className={chip(platform === value)}>
            {label}
          </button>
        ))}
        <div className="mx-1 w-px shrink-0 bg-gray-200 dark:bg-gray-800" />
        {STATUSES.map(({ value, label }) => (
          <button key={`s-${value}`} onClick={() => update('status', value)} className={chip(status === value)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
