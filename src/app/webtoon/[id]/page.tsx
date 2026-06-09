export const runtime = 'edge';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getWebtoon, getReviewsByWebtoon, getUserReview } from '@/lib/webtoons';
import { ReviewWithProfile } from '@/types';
import ScoreBadge from '@/components/ScoreBadge';
import PlatformBadge, { PlatformBadges } from '@/components/PlatformBadge';
import BunnyMascot from '@/components/BunnyMascot';
import TierBunny from '@/components/TierBunny';
import LoginButton from '@/components/LoginButton';
import ReviewForm from '@/components/ReviewForm';
import ReportButton from '@/components/ReportButton';
import RecommendButton from '@/components/RecommendButton';
import ReplySection from '@/components/ReplySection';
import SiteFooter from '@/components/SiteFooter';
import { getDiagnosis } from '@/lib/diagnosis';
import { getPointLevel } from '@/lib/points';

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, '.');
}

export default async function WebtoonDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [webtoon, reviews, userReview] = await Promise.all([
    getWebtoon(id),
    getReviewsByWebtoon(id),
    user ? getUserReview(id, user.id) : Promise.resolve(null),
  ]);

  if (!webtoon) notFound();

  // 현재 유저가 추천한 리뷰 ID 목록 + 댓글
  const reviewIds = reviews.map((r) => r.id);

  const [myRecommendedIds, repliesData] = await Promise.all([
    user && reviewIds.length > 0
      ? supabase
          .from('recommends')
          .select('review_id')
          .eq('user_id', user.id)
          .in('review_id', reviewIds)
          .then(({ data }) => new Set((data ?? []).map((r) => r.review_id)))
      : Promise.resolve(new Set<string>()),
    reviewIds.length > 0
      ? supabase
          .from('review_replies')
          .select('id, review_id, comment, created_at, user_id, profiles(nickname)')
          .in('review_id', reviewIds)
          .order('created_at', { ascending: true })
          .then(({ data }) => data ?? [])
      : Promise.resolve([]),
  ]);

  // review_id별 댓글 맵
  type ReplyRow = { id: string; review_id: string; comment: string; created_at: string; user_id: string; profiles: { nickname: string | null } | null };
  const repliesByReview = (repliesData as unknown as ReplyRow[]).reduce<Record<string, ReplyRow[]>>((acc, r) => {
    (acc[r.review_id] ??= []).push(r);
    return acc;
  }, {});

  const userInfo = user
    ? {
        name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? '유저',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      }
    : null;

  const scoreDistribution = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((s) => ({
    score: s,
    count: reviews.filter((r) => Math.floor(r.score) === s).length,
  }));
  const maxCount = Math.max(...scoreDistribution.map((d) => d.count), 1);
  const diagnosis = getDiagnosis(webtoon);
  const commentCount = reviews.filter((review) => String(review.comment ?? '').trim()).length;

  // 베스트 3 (추천 많은 순, 추천 1개 이상)
  const bestReviews = [...reviews]
    .filter((r) => r.recommend_count > 0)
    .sort((a, b) => b.recommend_count - a.recommend_count)
    .slice(0, 3);
  const bestIds = new Set(bestReviews.map((r) => r.id));

  // 나머지: 최신순 (베스트 제외)
  const restReviews = [...reviews]
    .filter((r) => !bestIds.has(r.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-[var(--background)]/90 px-4 py-3 backdrop-blur dark:border-gray-900">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-colors hover:text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:hover:text-gray-100" aria-label="뒤로">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19 8 12l7-7" />
            </svg>
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:ring-amber-900">
              <BunnyMascot size={24} />
            </span>
            <span className="text-sm font-black tracking-tight">별토끼</span>
          </Link>
        </div>
        <LoginButton user={userInfo} compact />
      </header>

      <section className="px-4 pt-6 pb-5 border-b border-gray-100 bg-gray-50/60 dark:border-gray-900 dark:bg-gray-950/40">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <PlatformBadges platforms={webtoon.sources.map((source) => source.platform)} />
          {webtoon.genre && (
            <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-100 dark:bg-gray-950 dark:text-gray-400 dark:ring-gray-800">{webtoon.genre}</span>
          )}
          {webtoon.status && (
            <span className={`rounded-md px-2 py-1 text-xs font-bold ${
              webtoon.status === 'completed'
                ? 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900'
            }`}>
              {webtoon.status === 'completed' ? '완결' : '연재중'}
            </span>
          )}
        </div>
        <h1 className="mb-1 text-2xl font-black leading-tight tracking-tight">{webtoon.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{webtoon.author}</p>
        {webtoon.sources.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {webtoon.sources.map((source) => (
              <a
                key={source.id}
                href={source.source_url ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
              >
                <PlatformBadge platform={source.platform} />
                <span>{source.title}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 py-5 border-b border-gray-100 dark:border-gray-900">
        <div className="grid grid-cols-[minmax(92px,112px)_1fr] gap-4">
          <div className="rounded-lg border border-gray-100 bg-white p-3 text-center shadow-sm dark:border-gray-900 dark:bg-gray-950">
            <div className="mb-1 text-[11px] font-bold text-gray-400">평균 평점</div>
            <div className="text-4xl font-black tabular-nums leading-none">
              {webtoon.avg_score !== null ? webtoon.avg_score.toFixed(1) : '-'}
            </div>
            <div className="mt-2 text-xs text-gray-400">{webtoon.review_count.toLocaleString()}명 평가</div>
          </div>

          {webtoon.review_count > 0 && (
            <div className="flex-1 space-y-0.5">
              {scoreDistribution.map(({ score, count }) => (
                <div key={score} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 w-3 tabular-nums">{score}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 w-3 tabular-nums text-right">{count > 0 ? count : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-900">
            <div className="text-[10px] font-bold text-gray-400">한줄평</div>
            <div className="mt-0.5 text-sm font-black tabular-nums">{commentCount.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-900">
            <div className="text-[10px] font-bold text-gray-400">베스트</div>
            <div className="mt-0.5 text-sm font-black tabular-nums">{bestReviews.length}</div>
          </div>
          <div className="rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-900">
            <div className="text-[10px] font-bold text-gray-400">플랫폼</div>
            <div className="mt-0.5 text-sm font-black tabular-nums">{webtoon.sources.length}</div>
          </div>
        </div>

        {diagnosis && (
          <div className={`mt-4 rounded-lg border px-3 py-2.5 ${diagnosis.bgClass}`}>
            <span className={`text-xs font-black ${diagnosis.colorClass}`}>{diagnosis.label}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{diagnosis.desc}</p>
          </div>
        )}
      </section>

      <section className="px-4 py-4 border-b border-gray-100 dark:border-gray-900">
        <h2 className="text-sm font-bold mb-3">
          {user ? (userReview ? '내 한줄평' : '평점 남기기') : '평점 남기기'}
        </h2>
        {user ? (
          <ReviewForm webtoonId={id} existingReview={userReview} />
        ) : (
          <LoginButtonSection />
        )}
      </section>

      <section className="flex-1 bg-gray-50/50 px-0 dark:bg-gray-950/30">
        <div className="px-4 py-3">
          <h2 className="text-sm font-bold">
            평가{reviews.length > 0 ? ` (${reviews.length})` : ''}
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <BunnyMascot size={44} />
            <p className="text-sm">아직 평가가 없어요</p>
          </div>
        ) : (
          <>
            {bestReviews.length > 0 && (
              <div className="px-4 pb-3">
                <p className="mb-2 text-[11px] font-black text-gray-500">베스트 한줄평</p>
                <ul className="grid gap-2">
                  {bestReviews.map((review) => (
                    <ReviewItem
                      key={review.id}
                      review={review}
                      isRecommended={myRecommendedIds.has(review.id)}
                      canRecommend={!!user && review.user_id !== user?.id}
                      isOwn={user?.id === review.user_id}
                      currentUserId={user?.id ?? null}
                      replies={repliesByReview[review.id] ?? []}
                      isBest
                    />
                  ))}
                </ul>
              </div>
            )}
            <ul className="grid gap-2 px-4 pb-4">
              {restReviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  isRecommended={myRecommendedIds.has(review.id)}
                  canRecommend={!!user && review.user_id !== user?.id}
                  isOwn={user?.id === review.user_id}
                  currentUserId={user?.id ?? null}
                  replies={repliesByReview[review.id] ?? []}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function LoginButtonSection() {
  return (
    <div className="flex flex-col items-center gap-2 py-3">
      <p className="text-sm text-gray-400">로그인하면 평점을 남길 수 있어요</p>
      <LoginButton user={null} />
    </div>
  );
}

function ReviewItem({
  review,
  isRecommended = false,
  canRecommend = false,
  isOwn = false,
  isBest = false,
  currentUserId = null,
  replies = [],
}: {
  review: ReviewWithProfile;
  isRecommended?: boolean;
  canRecommend?: boolean;
  isOwn?: boolean;
  isBest?: boolean;
  currentUserId?: string | null;
  replies?: { id: string; review_id: string; comment: string; created_at: string; user_id: string; profiles: { nickname: string | null } | null }[];
}) {
  const earnedPoints = review.profiles?.earned_points ?? review.profiles?.points ?? review.profiles?.total_recommends ?? 0;
  const tier = getPointLevel(earnedPoints);
  const now = new Date().toISOString();
  const hasNicknameColor = !!(review.profiles?.nickname_color_expires_at && review.profiles.nickname_color_expires_at > now);
  const hasBadge = !!(review.profiles?.review_badge_expires_at && review.profiles.review_badge_expires_at > now);
  const hasHighlight = !!(review.profiles?.review_highlight_expires_at && review.profiles.review_highlight_expires_at > now);

  return (
    <li className={[
      'rounded-lg border px-3 py-3 shadow-sm',
      isBest
        ? 'border-amber-200 bg-white dark:border-amber-900/60 dark:bg-gray-950'
        : hasHighlight
          ? 'border-amber-100 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/10'
          : 'border-gray-100 bg-white dark:border-gray-900 dark:bg-gray-950',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <TierBunny tier={tier.label} size={22} />
            <span className={`text-sm font-semibold ${hasNicknameColor ? 'text-amber-500 dark:text-amber-400' : ''}`}>{review.profiles?.nickname ?? '익명'}</span>
            {hasBadge && <span className="text-[10px] text-amber-400">✦</span>}
            <span className={`text-[10px] font-medium ${tier.color}`}>{tier.label}</span>
            {isBest && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">BEST</span>
            )}
            {isOwn && (
              <span className="rounded-md bg-gray-900 px-1.5 py-0.5 text-[9px] font-black text-white dark:bg-gray-100 dark:text-gray-950">나</span>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
            {review.comment || '별점만 남겼어요'}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(review.created_at)}</span>
            <span className="text-[11px] text-gray-300 dark:text-gray-700">·</span>
            <ReportButton reviewId={review.id} />
          </div>
          <ReplySection
            reviewId={review.id}
            initialReplies={replies}
            currentUserId={currentUserId}
            canReply={!!currentUserId}
          />
        </div>
        <div className="shrink-0 flex flex-col items-center gap-2">
          <ScoreBadge score={review.score} size="sm" />
          <RecommendButton
            reviewId={review.id}
            initialCount={review.recommend_count}
            initialRecommended={isRecommended}
            canRecommend={canRecommend}
          />
        </div>
      </div>
    </li>
  );
}
