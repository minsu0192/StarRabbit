'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SortOption } from '@/types';

const BASIC_SORTS = [
  { value: 'featured' as SortOption, label: '기본순' },
  { value: 'score' as SortOption, label: '평점순' },
  { value: 'popular' as SortOption, label: '인기순' },
];

const PERIOD_SORTS = [
  { label: '주간', score: 'weekly_score' as SortOption, popular: 'weekly_comments' as SortOption },
  { label: '월간', score: 'monthly_score' as SortOption, popular: 'monthly_popular' as SortOption },
  { label: '연간', score: 'yearly_score' as SortOption, popular: 'yearly_popular' as SortOption },
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

  const chipClass = (active: boolean) =>
    `h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-bold transition-colors ${
      active
        ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300'
    }`;

  const subChipClass = (active: boolean) =>
    `whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-bold transition-colors ${
      active
        ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400'
    }`;

  return (
    <div className="space-y-2 px-4">
      <div className="flex gap-2">
        {BASIC_SORTS.map(({ value, label }) => (
          <Link key={value} href={href(value)} className={chipClass(current === value)}>
            {label}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-gray-100 dark:border-gray-900 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-900">
          {PERIOD_SORTS.map(({ label, score, popular }) => {
            const isActive = current === score || current === popular;
            return (
              <div key={label} className={`px-2 py-2.5 ${isActive ? 'bg-gray-50 dark:bg-gray-900/60' : ''}`}>
                <p className={`text-center text-[10px] font-black mb-1.5 ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                  {label}
                </p>
                <div className="flex gap-1 justify-center">
                  <Link href={href(score)} className={subChipClass(current === score)}>평점</Link>
                  <Link href={href(popular)} className={subChipClass(current === popular)}>인기</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
