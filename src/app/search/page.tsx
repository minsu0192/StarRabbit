import Link from 'next/link';
import { searchWebtoons } from '@/lib/webtoons';
import WebtoonRow from '@/components/WebtoonRow';
import SearchBar from '@/components/SearchBar';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const results = query ? await searchWebtoons(query) : [];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">🐰 별토끼</Link>
        <button className="text-sm px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          로그인
        </button>
      </header>

      <div className="mt-6 mb-4">
        <SearchBar />
      </div>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4">
        {query ? (
          <>
            <p className="text-sm text-gray-500 mb-3">
              <span className="font-semibold text-black dark:text-white">"{query}"</span> 검색 결과 {results.length}건
            </p>
            {results.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                검색 결과가 없습니다
              </div>
            ) : (
              <div>
                {results.map((webtoon, i) => (
                  <WebtoonRow key={webtoon.id} webtoon={webtoon} rank={i + 1} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-gray-400 text-sm">
            검색어를 입력하세요
          </div>
        )}
      </main>
    </div>
  );
}
