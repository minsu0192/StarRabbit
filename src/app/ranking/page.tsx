export const runtime = 'edge';

import Link from 'next/link';
import Header from '@/components/Header';
import ScoreBadge from '@/components/ScoreBadge';
import { getWebtoons } from '@/lib/webtoons';
import { createClient } from '@/lib/supabase/server';
import type { WebtoonWithStats, SortOption } from '@/types';

type Tab = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'daily', label: '일간', emoji: '☀️' },
  { id: 'weekly', label: '주간', emoji: '📅' },
  { id: 'monthly', label: '월간', emoji: '🗓️' },
  { id: 'yearly', label: '연간', emoji: '🏆' },
];

function scoreSort(tab: Tab): SortOption {
  if (tab === 'daily') return 'daily_score';
  if (tab === 'weekly') return 'weekly_score';
  if (tab === 'monthly') return 'monthly_score';
  return 'yearly_score';
}

function popularSort(tab: Tab): SortOption {
  if (tab === 'daily') return 'daily_popular';
  if (tab === 'weekly') return 'weekly_comments';
  if (tab === 'monthly') return 'monthly_popular';
  return 'yearly_popular';
}

function periodScore(w: WebtoonWithStats, tab: Tab): number | null {
  if (tab === 'daily') return w.daily_avg_score;
  if (tab === 'weekly') return w.weekly_avg_score;
  if (tab === 'monthly') return w.monthly_avg_score;
  return w.yearly_avg_score;
}

function periodCount(w: WebtoonWithStats, tab: Tab): number {
  if (tab === 'daily') return w.daily_review_count;
  if (tab === 'weekly') return w.weekly_review_count;
  if (tab === 'monthly') return w.monthly_review_count;
  return w.yearly_review_count;
}

const RANK_COLORS = ['text-amber-500', 'text-gray-400', 'text-orange-600', 'text-gray-500', 'text-gray-400'];

export default async function RankingPage({ searchParams }: Props) {
  const { tab: rawTab } = await searchParams;
  const tab = (['daily', 'weekly', 'monthly', 'yearly'].includes(rawTab ?? '') ? rawTab : 'weekly') as Tab;

  const supabase = await createClient();

  const [{ items: scoreItems }, { items: popularItems }, reviewsResult] = await Promise.all([
    getWebtoons(scoreSort(tab), undefined, undefined, 1, 20),
    getWebtoons(popularSort(tab), undefined, undefined, 1, 20),
    supabase
      .from('reviews')
      .select('id, webtoon_id, score, comment, recommend_count, created_at, profiles(nickname), webtoons(title)')
      .gt('recommend_count', 0)
      .not('comment', 'is', null)
      .neq('comment', '')
      .order('recommend_count', { ascending: false })
      .limit(100),
  ]);

  const now = Date.now();
  const periodStart =
    tab === 'daily' ? now - 24 * 60 * 60 * 1000 :
    tab === 'weekly' ? now - 7 * 24 * 60 * 60 * 1000 :
    tab === 'monthly' ? now - 30 * 24 * 60 * 60 * 1000 :
    now - 365 * 24 * 60 * 60 * 1000;

  const topScore = scoreItems.filter((w) => periodScore(w, tab) !== null).slice(0, 5);
  const topPopular = popularItems.filter((w) => periodCount(w, tab) > 0).slice(0, 5);
  const allReviews = reviewsResult.data ?? [];
  const topReviews = allReviews
    .filter((r) => r.comment && new Date(r.created_at).getTime() >= periodStart)
    .slice(0, 5);

  const currentTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="flex min-h-screen w-full max-w-2xl flex-col mx-auto pb-20">
      <Header />

      <section className="border-b border-gray-100 px-4 py-5 dark:border-gray-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-amber-500 mb-1">HALL OF FAME</p>
            <h1 className="text-2xl font-black tracking-tight">명예의 전당</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">기간별 최고 평점·인기 작품과 명예 한줄평</p>
          </div>
          <Link href="/cheer" className="shrink-0 rounded-full border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/30">
            응원전 →
          </Link>
        </div>
      </section>

      <nav className="flex border-b border-gray-100 dark:border-gray-900">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/ranking?tab=${t.id}`}
            className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-bold transition-colors ${
              tab === t.id
                ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400'
            }`}
          >
            <span className="text-base leading-none">{t.emoji}</span>
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="divide-y divide-gray-100 dark:divide-gray-900">
        <RankSection
          title={`${currentTab.label} 평점 TOP 5`}
          subtitle="해당 기간 평균 평점이 높은 작품"
          items={topScore}
          renderValue={(w) => <ScoreBadge score={periodScore(w, tab)} size="sm" />}
          empty="이 기간에 평점이 쌓인 작품이 없어요"
          rankColors={RANK_COLORS}
        />

        <RankSection
          title={`${currentTab.label} 인기 TOP 5`}
          subtitle="해당 기간 평점·댓글을 가장 많이 받은 작품"
          items={topPopular}
          renderValue={(w) => (
            <span className="text-xs font-black tabular-nums text-gray-600 dark:text-gray-300">
              {periodCount(w, tab).toLocaleString()}개
            </span>
          )}
          empty="이 기간에 활동이 없어요"
          rankColors={RANK_COLORS}
        />

        <section className="px-4 py-5">
          <div className="mb-4">
            <h2 className="text-sm font-black">{currentTab.label} 명예 한줄평</h2>
            <p className="mt-0.5 text-[11px] text-gray-400">해당 기간 추천을 가장 많이 받은 한줄평</p>
          </div>
          {topReviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">이 기간에 추천받은 한줄평이 없어요</p>
          ) : (
            <ul className="grid gap-3">
              {topReviews.map((review, i) => {
                const webtoon = review.webtoons as { title?: string } | null;
                const profile = review.profiles as { nickname?: string } | null;
                return (
                  <li key={review.id}>
                    <Link href={`/webtoon/${review.webtoon_id}`} className="block rounded-xl border border-gray-100 bg-white p-3 hover:border-amber-200 dark:border-gray-900 dark:bg-gray-950 dark:hover:border-amber-900">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs font-black tabular-nums ${RANK_COLORS[i]}`}>{i + 1}</span>
                          <span className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">{webtoon?.title ?? ''}</span>
                        </div>
                        <ScoreBadge score={Number(review.score)} size="sm" />
                      </div>
                      <p className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-100 line-clamp-2">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">{profile?.nickname ?? '익명'}</span>
                        <span className="text-[11px] font-bold text-amber-500">♥ {review.recommend_count}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function RankSection({
  title,
  subtitle,
  items,
  renderValue,
  empty,
  rankColors,
}: {
  title: string;
  subtitle: string;
  items: WebtoonWithStats[];
  renderValue: (w: WebtoonWithStats) => React.ReactNode;
  empty: string;
  rankColors: string[];
}) {
  return (
    <section className="px-4 py-5">
      <div className="mb-4">
        <h2 className="text-sm font-black">{title}</h2>
        <p className="mt-0.5 text-[11px] text-gray-400">{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">{empty}</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((w, i) => (
            <li key={w.id}>
              <Link
                href={`/webtoon/${w.id}`}
                className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 hover:border-amber-200 dark:border-gray-900 dark:bg-gray-950 dark:hover:border-amber-900"
              >
                <div className={`text-center text-sm font-black tabular-nums ${rankColors[i]}`}>{i + 1}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black">{w.title}</div>
                  <div className="truncate text-[11px] text-gray-400">{w.author}</div>
                </div>
                {renderValue(w)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
