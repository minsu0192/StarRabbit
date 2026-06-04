export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import NicknameForm from '@/components/NicknameForm';
import ScoreBadge from '@/components/ScoreBadge';
import BunnyMascot from '@/components/BunnyMascot';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, total_recommends')
    .eq('id', user.id)
    .single();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, webtoons(title, platform)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const nickname = profile?.nickname ?? '유저';
  const totalRecommends = profile?.total_recommends ?? 0;
  const rank = getRank(totalRecommends);

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <Header />

      {/* 프로필 헤더 */}
      <section className="px-4 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-2xl font-black text-white shrink-0">
            {nickname.slice(0, 1)}
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

      <footer className="py-6 text-center text-xs text-gray-300 dark:text-gray-700">
        © 2026 별토끼
      </footer>
    </div>
  );
}
