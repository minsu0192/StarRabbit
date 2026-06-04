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

      {/* 히어로 — 간결하게 */}
      <section className="flex items-center gap-3 px-4 pt-5 pb-4">
        <BunnyMascot size={44} />
        <div>
          <h1 className="text-lg font-black tracking-tight leading-tight">별토끼</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">팬덤 몰표 없이 1인 1평 · 진짜 점수</p>
        </div>
      </section>

      {/* 검색바 */}
      <div className="px-4 mb-3">
        <SearchBar />
      </div>

      {/* 필터바 (정렬 + 플랫폼 + 연재상태) */}
      <div className="mb-3">
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      {/* 결과 수 */}
      <div className="px-4 mb-1">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {[platformLabel, statusLabel].filter(Boolean).join(' · ')}
          {(platformLabel || statusLabel) ? ' ' : ''}
          <span className="font-semibold text-gray-600 dark:text-gray-300">{webtoons.length.toLocaleString()}개</span>
        </p>
      </div>

      {/* 웹툰 리스트 */}
      <main className="flex-1">
        {webtoons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <BunnyMascot size={52} />
            <p className="text-sm">해당하는 웹툰이 없습니다</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800/60">
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
