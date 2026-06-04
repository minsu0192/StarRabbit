export const runtime = 'edge';

import { Suspense } from 'react';
import Link from 'next/link';
import { getWebtoons } from '@/lib/webtoons';
import { SortOption } from '@/types';
import WebtoonRow from '@/components/WebtoonRow';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import BunnyMascot from '@/components/BunnyMascot';
import Header from '@/components/Header';

interface Props {
  searchParams: Promise<{ sort?: string; platform?: string; status?: string; page?: string; size?: string; initial?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const { sort, platform, status, page, size, initial } = await searchParams;
  const sortOption = (['score', 'popular', 'latest', 'title'].includes(sort ?? '') ? sort : 'score') as SortOption;
  const currentPage = Math.max(Number(page ?? '1') || 1, 1);
  const pageSize = Number(size ?? '100') || 100;
  const { items: webtoons, total, limit } = await getWebtoons(sortOption, platform, status, currentPage, pageSize, initial);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const clampedPage = Math.min(currentPage, totalPages);

  const platformLabel =
    platform === 'naver' ? '네이버' :
    platform === 'kakao' ? '카카오' :
    platform === 'ridi' ? '리디' :
    platform === 'etc' ? '기타' :
    null;
  const statusLabel = status === 'ongoing' ? '연재중' : status === 'completed' ? '완결' : null;
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (sort && sort !== 'score') params.set('sort', sort);
    if (platform) params.set('platform', platform);
    if (status) params.set('status', status);
    if (initial) params.set('initial', initial);
    if (limit !== 100) params.set('size', String(limit));
    if (nextPage > 1) params.set('page', String(nextPage));
    const query = params.toString();
    return query ? `/?${query}` : '/';
  };

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <Header />

      <section className="px-4 pb-4 pt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold text-amber-600 dark:text-amber-400">WEBTOON REVIEW</p>
            <h1 className="text-2xl font-black tracking-tight">진짜 점수가 보이는 웹툰 평점</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">1인 1평으로 팬덤 몰표를 줄인 리뷰 목록</p>
          </div>
          <div className="hidden shrink-0 min-[420px]:block">
            <BunnyMascot size={56} />
          </div>
        </div>
      </section>

      <div className="px-4 mb-3">
        <SearchBar />
      </div>

      <div className="mb-3">
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      <div className="px-4 pb-2">
        <div className="flex items-center justify-between border-y border-gray-100 py-2 dark:border-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {[platformLabel, initial, statusLabel].filter(Boolean).join(' · ') || '전체 웹툰'}
          </p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
            {total.toLocaleString()}개 중 {webtoons.length.toLocaleString()}개
          </p>
        </div>
      </div>

      <main className="flex-1">
        {webtoons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <BunnyMascot size={52} />
            <p className="text-sm">해당하는 웹툰이 없습니다</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-900">
            {webtoons.map((webtoon, i) => (
              <WebtoonRow key={webtoon.id} webtoon={webtoon} rank={(clampedPage - 1) * limit + i + 1} />
            ))}
          </ul>
        )}
      </main>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between border-t border-gray-100 px-4 py-4 dark:border-gray-900">
          <Link
            href={pageHref(Math.max(clampedPage - 1, 1))}
            aria-disabled={clampedPage <= 1}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              clampedPage <= 1
                ? 'pointer-events-none border-gray-100 text-gray-300 dark:border-gray-900 dark:text-gray-700'
                : 'border-gray-200 text-gray-700 hover:border-gray-400 dark:border-gray-800 dark:text-gray-200'
            }`}
          >
            이전
          </Link>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
            {clampedPage.toLocaleString()} / {totalPages.toLocaleString()}
          </span>
          <Link
            href={pageHref(Math.min(clampedPage + 1, totalPages))}
            aria-disabled={clampedPage >= totalPages}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              clampedPage >= totalPages
                ? 'pointer-events-none border-gray-100 text-gray-300 dark:border-gray-900 dark:text-gray-700'
                : 'border-gray-200 text-gray-700 hover:border-gray-400 dark:border-gray-800 dark:text-gray-200'
            }`}
          >
            다음
          </Link>
        </nav>
      )}

      <footer className="py-6 text-center text-xs text-gray-300 dark:text-gray-700">
        © 2026 별토끼
      </footer>
    </div>
  );
}
