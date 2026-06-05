export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import NicknameForm from '@/components/NicknameForm';
import ScoreBadge from '@/components/ScoreBadge';
import BunnyMascot from '@/components/BunnyMascot';
import TierBunny from '@/components/TierBunny';
import { POINT_LEVELS, POINT_RULES, getPointLevel } from '@/lib/points';

function getRank(total: number): { label: string; color: string; next: string; needed: number | null } {
  if (total >= 1000) return { label: '별토끼', color: 'text-amber-500', next: '무지개토끼', needed: null };
  if (total >= 100)  return { label: '달토끼',  color: 'text-blue-500',  next: '별토끼',    needed: 1000 - total };
  if (total >= 10)   return { label: '들토끼',  color: 'text-green-500', next: '달토끼',    needed: 100 - total };
  return                     { label: '길토끼',  color: 'text-gray-400',  next: '들토끼',    needed: 10 - total };
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profileWithPoints, error: profileError } = await supabase
    .from('profiles')
    .select('nickname, total_recommends, points')
    .eq('id', user.id)
    .single();
  const { data: profileFallback } = profileError
    ? await supabase
      .from('profiles')
      .select('nickname, total_recommends')
      .eq('id', user.id)
      .single()
    : { data: null };
  const profile = profileWithPoints ?? profileFallback;

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, webtoons(title, platform)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const nickname = profile?.nickname ?? '유저';
  const totalRecommends = profile?.total_recommends ?? 0;
  const rawPoints = profile && 'points' in profile ? profile.points : null;
  const points = Number(rawPoints ?? totalRecommends);
  const rank = getRank(totalRecommends);
  const pointLevel = getPointLevel(points);

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <Header />

      {/* 프로필 헤더 */}
      <section className="px-4 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <TierBunny tier={pointLevel.label} size={56} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black">{nickname}</span>
              <span className={`text-sm font-bold ${rank.color}`}>{rank.label}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              받은 추천 {totalRecommends.toLocaleString()}개
              {rank.needed !== null && (
                <span className="ml-1 text-gray-300 dark:text-gray-600">
                  · {rank.next}까지 {rank.needed}개 남음
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">내 포인트</h2>
            <p className={`mt-1 text-lg font-black ${pointLevel.color}`}>{pointLevel.label}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tabular-nums">{points.toLocaleString()}</p>
            <p className="text-xs text-gray-400">포인트</p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-900">
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${pointLevel.progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {pointLevel.remaining === null
            ? '최고 등급입니다'
            : `${pointLevel.nextLabel}까지 ${pointLevel.remaining.toLocaleString()}점 남음`}
        </p>
      </section>

      <section className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-bold mb-3">포인트 제도</h2>
        <div className="divide-y divide-gray-100 rounded-md border border-gray-100 dark:divide-gray-900 dark:border-gray-900">
          {POINT_RULES.map((rule) => (
            <div key={rule.label} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold">{rule.label}</p>
                <p className="mt-0.5 text-xs text-gray-400">{rule.description}</p>
              </div>
              <span className="text-sm font-black tabular-nums text-amber-500">+{rule.points}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-bold mb-3">토끼 등급</h2>
        <div className="grid gap-2">
          {POINT_LEVELS.map((level) => (
            <div key={level.label} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${pointLevel.label === level.label ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-gray-100 dark:border-gray-900'}`}>
              <TierBunny tier={level.label} size={32} />
              <span className={`flex-1 text-sm font-bold ${level.color}`}>{level.label}</span>
              {pointLevel.label === level.label && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-white">현재</span>
              )}
              <span className="text-xs font-semibold text-gray-400">{level.min.toLocaleString()}점</span>
            </div>
          ))}
        </div>
      </section>

      {/* 닉네임 변경 */}
      <section className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-bold mb-3">닉네임 변경</h2>
        <NicknameForm currentNickname={nickname} />
      </section>

      {/* 내 한줄평 목록 */}
      <section className="flex-1 px-0">
        <div className="px-4 py-3">
          <h2 className="text-sm font-bold">내 한줄평 {reviews && reviews.length > 0 ? `(${reviews.length})` : ''}</h2>
        </div>

        {!reviews || reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <BunnyMascot size={44} />
            <p className="text-sm">아직 남긴 한줄평이 없어요</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {reviews.map((review) => (
              <li key={review.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">
                      {(review.webtoons as { title: string } | null)?.title ?? '알 수 없음'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                      {review.comment}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {review.created_at.slice(0, 10).replace(/-/g, '.')}
                      {review.recommend_count > 0 && ` · ♥ ${review.recommend_count}`}
                    </p>
                  </div>
                  <ScoreBadge score={review.score} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
