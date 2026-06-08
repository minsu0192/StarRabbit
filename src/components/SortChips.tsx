'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SortOption } from '@/types';

const SORTS = [
  { value: 'popular' as SortOption, label: '인기순' },
  { value: 'score' as SortOption, label: '평점순' },
];

export default function SortChips() {
  const searchParams = useSearchParams();
  const current = (searchParams.get('sort') ?? 'popular') as SortOption;

  function href(value: SortOption) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'popular') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    params.delete('page');
    const q = params.toString();
    return q ? `/?${q}` : '/';
  }

  const chipClass = (active: boolean) =>
    `inline-flex items-center h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-bold transition-colors ${
      active
        ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300'
    }`;

  return (
    <div className="flex gap-2 px-4">
      {SORTS.map(({ value, label }) => (
        <Link key={value} href={href(value)} className={chipClass(current === value)}>
          {label}
        </Link>
      ))}
    </div>
  );
}
