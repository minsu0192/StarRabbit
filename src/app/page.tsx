import { Suspense } from 'react';
import { getWebtoons } from '@/lib/webtoons';
import { SortOption } from '@/types';
import WebtoonRow from '@/components/WebtoonRow';
import SearchBar from '@/components/SearchBar';
import SortChips from '@/components/SortChips';

interface Props {
  searchParams: Promise<{ sort?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const { sort } = await searchParams;
  const sortOption = (['score', 'popular', 'latest'].includes(sort ?? '') ? sort : 'score') as SortOption;
  const webtoons = await getWebtoons(sortOption);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">🐰 별토끼</span>
        <button className="text-sm px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          로그인
        </button>
      </header>

      {/* 히어로 */}
      <section className="flex flex-col items-center py-8 px-4 text-center gap-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center text-4xl shadow">
          🐰
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">별토끼</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          네이버는 다 9점,{' '}
          <span className="text-black dark:text-white font-semibold">별토끼는 진짜 점수가 나온다.</span>
        </p>
      </section>

      {/* 검색바 */}
      <div className="mb-4">
        <SearchBar />
      </div>

      {/* 정렬 칩 */}
      <div className="mb-3 max-w-2xl mx-auto w-full">
        <Suspense>
          <SortChips />
        </Suspense>
      </div>

      {/* 웹툰 리스트 */}
      <main className="flex-1 w-full max-w-2xl mx-auto">
        {webtoons.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">웹툰이 없습니다</div>
        ) : (
          <div>
            {webtoons.map((webtoon, i) => (
              <WebtoonRow key={webtoon.id} webtoon={webtoon} rank={i + 1} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-400 dark:text-gray-600 mt-8">
        © 2026 별토끼
      </footer>
    </div>
  );
}
