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
import SiteFooter from '@/components/SiteFooter';
import SortChips from '@/components/SortChips';
import { createClient } from '@/lib/supabase/server';

interface Props {
  searchParams: Promise<{ sort?: string; platform?: string; status?: string; page?: string; size?: string; initial?: string; genre?: string; audience?: string; origin?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const { sort, platform, status, page, size, initial, genre, audience, origin } = await searchParams;
  const supabase = await createClient();
  const sortOption = (['featured', 'score', 'popular', 'weekly_score', 'weekly_comments', 'monthly_score', 'monthly_popular', 'yearly_score', 'yearly_popular', 'latest'].includes(sort ?? '') ? sort : 'featured') as SortOption;
  const currentPage = Math.max(Number(page ?? '1') || 1, 1);
  const pageSize = Number(size ?? '20') || 20;
  const [
    { items: webtoons, total, limit },
    { items: weeklyScoreWebtoons },
    { items: weeklyCommentWebtoons },
    noticeResult,
    bannerResult,
  ] = await Promise.all([
    getWebtoons(sortOption, platform, status, currentPage, pageSize, initial, genre, audience, origin),
    getWebtoons('weekly_score', platform, status, 1, 20, initial, genre, audience, origin),
    getWebtoons('weekly_comments', platform, status, 1, 20, initial, genre, audience, origin),
    supabase.from('site_settings').select('value').eq('key', 'top_notice').maybeSingle(),
    supabase.from('site_settings').select('key, value').in('key', ['banner_image_url', 'banner_link_url', 'banner_alt_text']),
  ]);
  const topNotice = noticeResult.error ? null : noticeResult.data?.value?.trim();
  const bannerSettings = bannerResult.data ?? [];
  const bannerImageUrl = bannerSettings.find((s) => s.key === 'banner_image_url')?.value?.trim() ?? '';
  const bannerLinkUrl = bannerSettings.find((s) => s.key === 'banner_link_url')?.value?.trim() ?? '';
  const bannerAltText = bannerSettings.find((s) => s.key === 'banner_alt_text')?.value?.trim() ?? '광고';
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const clampedPage = Math.min(currentPage, totalPages);

  const platformLabel =
    platform === 'naver' ? '네이버' :
    platform === 'kakao' ? '카카오' :
    platform === 'ridi' ? '리디' :
    platform === 'etc' ? '기타' :
    null;
  const statusLabel = status === 'ongoing' ? '연재중' : status === 'completed' ? '완결' : null;
  const originLabel = origin === 'korea' ? '한국' : origin === 'japan' ? '일본' : origin === 'china' ? '중국' : null;
  const weeklyScoreItems = weeklyScoreWebtoons.filter((webtoon) => webtoon.weekly_review_count > 0).slice(0, 3);
  const weeklyCommentItems = weeklyCommentWebtoons.filter((webtoon) => webtoon.weekly_comment_count > 0).slice(0, 3);
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (sort && sort !== 'featured') params.set('sort', sort);
    if (platform) params.set('platform', platform);
    if (status) params.set('status', status);
    if (initial) params.set('initial', initial);
    if (genre) params.set('genre', genre);
    if (audience) params.set('audience', audience);
    if (origin) params.set('origin', origin);
    if (limit !== 20) params.set('size', String(limit));
    if (nextPage > 1) params.set('page', String(nextPage));
    const query = params.toString();
    return query ? `/?${query}` : '/';
  };

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <Header />

      {topNotice && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-300">
          {topNotice}
        </div>
      )}

      {bannerImageUrl && (
        <a href={bannerLinkUrl || undefined} target="_blank" rel="noopener noreferrer sponsored"
          className="block border-b border-gray-100 dark:border-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerImageUrl} alt={bannerAltText} className="w-full object-cover max-h-20" />
          <p className="px-3 py-1 text-[10px] text-right text-gray-300 dark:text-gray-700">광고</p>
        </a>
      )}

      <section className="px-4 pb-4 pt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold text-amber-600 dark:text-amber-400">WEBTOON REVIEW</p>
            <h1 className="text-2xl font-black tracking-tight">진짜 점수가 보이는 웹툰 평점</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">1인 1평으로 점수 쏠림을 줄인 리뷰 목록</p>
          </div>
          <div className="hidden shrink-0 min-[420px]:block">
            <BunnyMascot size={56} />
          </div>
        </div>
      </section>

      <div className="px-4 mb-3">
        <SearchBar />
      </div>

      <nav className="mb-3">
        <Suspense>
          <SortChips />
        </Suspense>
      </nav>

      {(weeklyScoreItems.length > 0 || weeklyCommentItems.length > 0) && (
        <section className="mb-3 space-y-3 px-4">
          {weeklyScoreItems.length > 0 && (
            <WeeklyStrip title="금주 평점" items={weeklyScoreItems} />
          )}
          {weeklyCommentItems.length > 0 && (
            <WeeklyStrip title="금주 댓글" items={weeklyCommentItems} />
          )}
        </section>
      )}

      <div className="mb-3">
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      <div className="px-4 pb-2">
        <div className="flex items-center justify-between border-y border-gray-100 py-2 dark:border-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {[platformLabel, originLabel, genre, initial, statusLabel, audience === 'all' ? 'BL·GL 포함' : null].filter(Boolean).join(' · ') || '전체 웹툰'}
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

      <SiteFooter />
    </div>
  );
}

function WeeklyStrip({ title, items }: { title: string; items: Awaited<ReturnType<typeof getWebtoons>>['items'] }) {
  return (
    <div className="rounded-md border border-gray-100 bg-white p-3 dark:border-gray-900 dark:bg-gray-950">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-black">{title}</h2>
        <span className="text-[11px] font-semibold text-gray-400">TOP 3</span>
      </div>
      <div className="grid gap-2">
        {items.map((webtoon, index) => (
          <Link key={`${title}-${webtoon.id}`} href={`/webtoon/${webtoon.id}`} className="grid grid-cols-[24px_1fr_auto] items-center gap-2 rounded-md border border-gray-100 px-3 py-3 dark:border-gray-900">
            <div className="text-sm font-black text-amber-500">{index + 1}</div>
            <div className="min-w-0">
              <div className="truncate text-base font-black">{webtoon.title}</div>
              <div className="truncate text-xs text-gray-400">{webtoon.author}</div>
            </div>
            <div className="text-right text-sm font-black tabular-nums text-gray-700 dark:text-gray-200">
              {title === '금주 댓글'
                ? `${webtoon.weekly_comment_count.toLocaleString()}개`
                : webtoon.weekly_avg_score !== null ? webtoon.weekly_avg_score.toFixed(1) : '-'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
