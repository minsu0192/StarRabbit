export const runtime = 'edge';

import { searchWebtoons } from '@/lib/webtoons';
import WebtoonRow from '@/components/WebtoonRow';
import SearchBar from '@/components/SearchBar';
import BunnyMascot from '@/components/BunnyMascot';
import Header from '@/components/Header';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const results = query ? await searchWebtoons(query) : [];

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <Header />

      <div className="px-4 mt-5 mb-4">
        <SearchBar defaultValue={query} />
      </div>

      <main className="flex-1">
        {query ? (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 px-4 mb-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{query}</span> 검색 결과 {results.length}건
            </p>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <BunnyMascot size={56} />
                <p className="text-sm">검색 결과가 없습니다</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-900">
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
