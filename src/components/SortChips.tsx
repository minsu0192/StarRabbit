'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SortOption } from '@/types';

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'score', label: '평점순' },
  { value: 'popular', label: '인기순' },
  { value: 'latest', label: '최신순' },
];

export default function SortChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get('sort') as SortOption) ?? 'score';

  return (
    <div className="flex gap-2 px-4">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => router.push(`/?sort=${value}`)}
          className={`text-sm px-3 py-1 rounded-full border transition-colors ${
            current === value
              ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
