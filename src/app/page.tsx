export const runtime = 'edge';

import { Suspense } from 'react';
import { getWebtoons } from '@/lib/webtoons';
import { SortOption } from '@/types';
import WebtoonRow from '@/components/WebtoonRow';
import SearchBar from '@/components/SearchBar';
import SortChips from '@/components/SortChips';
import BunnyMascot from '@/components/BunnyMascot';
import Header from '@/components/Header';

interface Props {
  searchParams: Promise<{ sort?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const { sort } = await searchParams;
  const sortOption = (['score', 'popular', 'latest'].includes(sort ?? '') ? sort : 'score') as SortOption;
  const webtoons = await getWebtoons(sortOption);

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">

      {/* 헤더 */}
      <Header />

      {/* 히어로 */}
      <section className="flex flex-col items-center pt-8 pb-6 px-4 text-center gap-3">
        <BunnyMascot size={88} />
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight">별토끼</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            네이버는 다 9점,{' '}
            <span className="font-bold text-gray-900 dark:text-gray-100">별토끼는 진짜 점수가 나온다.</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            팬덤 몰표 없이 1인 1평 · 솔직한 점수만
          </p>
        </div>
      </section>

      {/* 검색바 */}
      <div className="px-4 mb-4">
        <SearchBar />
      </div>

      {/* 정렬 칩 */}
      <div className="px-4 mb-2">
        <Suspense>
          <SortChips />
        </Suspense>
      </div>

      {/* 웹툰 리스트 */}
      <main className="flex-1">
        {webtoons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <BunnyMascot size={56} />
            <p className="text-sm">웹툰이 없습니다</p>
          </div>
        ) : (
          <ul>
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
