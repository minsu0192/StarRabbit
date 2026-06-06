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

  // 타인 리뷰 목록 (내 리뷰 제외)
  const otherReviews = user
    ? reviews.filter((r) => r.user_id !== user.id)
    : reviews;

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

      <section className="px-4 pt-6 pb-5 border-b border-gray-100 dark:border-gray-900">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <PlatformBadges platforms={webtoon.sources.map((source) => source.platform)} />
          {webtoon.genre && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{webtoon.genre}</span>
          )}
          {webtoon.status && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              webtoon.status === 'completed'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                : 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
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
        <div className="flex items-center gap-4">
          <div className="text-center shrink-0">
            <div className="text-4xl font-black tabular-nums leading-none mb-1">
              {webtoon.avg_score !== null ? webtoon.avg_score.toFixed(1) : '−'}
            </div>
            <div className="text-xs text-gray-400">{webtoon.review_count.toLocaleString()}명 평가</div>
          </div>

          {webtoon.review_count > 0 && (
            <div className="flex-1 space-y-0.5">
              {scoreDistribution.map(({ score, count }) => (
                <div key={score} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 w-3 tabular-nums">{score}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 w-3 tabular-nums text-right">{count > 0 ? count : ''}</span>
                </div>
              ))}
            </div>
          )}
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

      <section className="flex-1 px-0">
        <div className="px-4 py-3">
          <h2 className="text-sm font-bold">
            평가{otherReviews.length > 0 ? ` (${otherReviews.length})` : ''}
          </h2>
        </div>

        {otherReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <BunnyMascot size={44} />
            <p className="text-sm">아직 평가가 없어요</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-900">
            {otherReviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </ul>
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

function ReviewItem({ review }: { review: ReviewWithProfile }) {
  const points = review.profiles?.points ?? review.profiles?.total_recommends ?? 0;
  const tier = getPointLevel(points);

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <TierBunny tier={tier.label} size={22} />
            <span className="text-sm font-semibold">{review.profiles?.nickname ?? '익명'}</span>
            <span className={`text-[10px] font-medium ${tier.color}`}>{tier.label}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
            {review.comment || '별점만 남겼어요'}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 dark:text-gray-500 flex-wrap">
            <span>{formatDate(review.created_at)}</span>
            {review.recommend_count > 0 && (
              <>
                <span>·</span>
                <span>♥ {review.recommend_count}</span>
              </>
            )}
            <span>·</span>
            <ReportButton reviewId={review.id} />
          </div>
        </div>
        <div className="shrink-0">
          <ScoreBadge score={review.score} size="sm" />
        </div>
      </div>
    </li>
  );
}
