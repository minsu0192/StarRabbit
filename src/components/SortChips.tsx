'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SortOption } from '@/types';

const GROUPS: { label: string; options: { value: SortOption; label: string }[] }[] = [
  {
    label: '기본',
    options: [
      { value: 'featured', label: '기본순' },
      { value: 'score', label: '평점순' },
      { value: 'popular', label: '인기순' },
      { value: 'latest', label: '최신순' },
    ],
  },
  {
    label: '주간',
    options: [
      { value: 'weekly_score', label: '주간 평점' },
      { value: 'weekly_comments', label: '주간 인기' },
    ],
  },
  {
    label: '월간',
    options: [
      { value: 'monthly_score', label: '월간 평점' },
      { value: 'monthly_popular', label: '월간 인기' },
    ],
  },
  {
    label: '연간',
    options: [
      { value: 'yearly_score', label: '연간 평점' },
      { value: 'yearly_popular', label: '연간 인기' },
    ],
  },
];

export default function SortChips() {
  const searchParams = useSearchParams();
  const current = (searchParams.get('sort') ?? 'featured') as SortOption;

  function href(value: SortOption) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    params.delete('page');
    const q = params.toString();
    return q ? `/?${q}` : '/';
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
      {GROUPS.flatMap((g) => g.options).map(({ value, label }) => {
        const active = current === value;
        return (
          <Link
            key={value}
            href={href(value)}
            className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-bold transition-colors
              ${active
                ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300'
              }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
