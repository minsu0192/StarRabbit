'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const PLATFORMS = [
  { value: '', label: '전체' },
  { value: 'naver', label: '네이버' },
  { value: 'kakao', label: '카카오' },
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
    router.push(`/?${params.toString()}`);
  };

  const chip = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full border font-medium transition-colors whitespace-nowrap ${
      active
        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
    }`;

  return (
    <div className="space-y-2 px-4">
      {/* 정렬 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {SORTS.map(({ value, label }) => (
          <button key={value} onClick={() => update('sort', value)} className={chip(sort === value)}>
            {label}
          </button>
        ))}
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
        {/* 플랫폼 */}
        {PLATFORMS.map(({ value, label }) => (
          <button key={`p-${value}`} onClick={() => update('platform', value)} className={chip(platform === value)}>
            {label}
          </button>
        ))}
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
        {/* 연재상태 */}
        {STATUSES.map(({ value, label }) => (
          <button key={`s-${value}`} onClick={() => update('status', value)} className={chip(status === value)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
