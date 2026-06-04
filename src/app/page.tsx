export const runtime = 'edge';

import { Suspense } from 'react';
import { getWebtoons } from '@/lib/webtoons';
import { SortOption } from '@/types';
import WebtoonRow from '@/components/WebtoonRow';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import BunnyMascot from '@/components/BunnyMascot';
import Header from '@/components/Header';

interface Props {
  searchParams: Promise<{ sort?: string; platform?: string; status?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const { sort, platform, status } = await searchParams;
  const sortOption = (['score', 'popular', 'latest'].includes(sort ?? '') ? sort : 'score') as SortOption;
  const webtoons = await getWebtoons(sortOption, platform, status);

  const platformLabel = platform === 'naver' ? '네이버' : platform === 'kakao' ? '카카오' : null;
  const statusLabel = status === 'ongoing' ? '연재중' : status === 'completed' ? '완결' : null;

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
            {[platformLabel, statusLabel].filter(Boolean).join(' · ') || '전체 웹툰'}
          </p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{webtoons.length.toLocaleString()}개</p>
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
              <WebtoonRow key={webtoon.id} webtoon={webtoon} rank={i + 1} />
            ))}
          </ul>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-gray-300 dark:text-gray-700">
        © 2026 별토끼
      </footer>
    </div>
  );
}
