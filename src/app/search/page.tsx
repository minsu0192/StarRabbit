export const runtime = 'edge';

import Link from 'next/link';
import { searchWebtoons } from '@/lib/webtoons';
import WebtoonRow from '@/components/WebtoonRow';
import SearchBar from '@/components/SearchBar';
import BunnyMascot from '@/components/BunnyMascot';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const results = query ? await searchWebtoons(query) : [];

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BunnyMascot size={28} />
          <span className="font-black text-base tracking-tight">별토끼</span>
        </Link>
        <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          로그인
        </button>
      </header>

      <div className="px-4 mt-5 mb-4">
        <SearchBar />
      </div>

      <main className="flex-1">
        {query ? (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 px-4 mb-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300">"{query}"</span> 검색 결과 {results.length}건
            </p>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <BunnyMascot size={56} />
                <p className="text-sm">검색 결과가 없습니다</p>
              </div>
            ) : (
              <ul>
                {results.map((webtoon, i) => (
                  <WebtoonRow key={webtoon.id} webtoon={webtoon} rank={i + 1} />
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <BunnyMascot size={56} />
            <p className="text-sm">검색어를 입력하세요</p>
          </div>
        )}
      </main>
    </div>
  );
}
