export const runtime = 'edge';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import NicknameForm from '@/components/NicknameForm';
import BunnyMascot from '@/components/BunnyMascot';
import MyReviewList from '@/components/MyReviewList';
import TierBunny from '@/components/TierBunny';
import LevelUpPopup from '@/components/LevelUpPopup';
import { POINT_LEVELS, POINT_RULES, getPointLevel } from '@/lib/points';
import PointHistoryModal from '@/components/PointHistoryModal';
import ProfilePerksPanel from '@/components/ProfilePerksPanel';
import { equipItem, unequipItem } from '@/app/shop/actions';

function getRank(total: number): { label: string; color: string; next: string; needed: number | null } {
  if (total >= 1000) return { label: '별토끼', color: 'text-amber-500', next: '무지개토끼', needed: null };
  if (total >= 100)  return { label: '달토끼',  color: 'text-blue-500',  next: '별토끼',    needed: 1000 - total };
  if (total >= 10)   return { label: '들토끼',  color: 'text-green-500', next: '달토끼',    needed: 100 - total };
  return                     { label: '길토끼',  color: 'text-gray-400',  next: '들토끼',    needed: 10 - total };
}

type OwnedRow = {
  item_id: string;
  is_equipped: boolean;
  shop_items: { name: string; type: string; costume_key: string | null; description: string } | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  await supabase.rpc('auto_attend', { p_user_id: user.id });

  const { data: profileWithPoints, error: profileError } = await supabase
    .from('profiles')
    .select('nickname, total_recommends, points, earned_points, last_attendance_at')
    .eq('id', user.id)
    .single();
  const { data: profileFallback } = profileError
    ? await supabase.from('profiles').select('nickname, total_recommends').eq('id', user.id).single()
    : { data: null };
  const profile = profileWithPoints ?? profileFallback;

  const [reviewsResult, ownedItemsResult] = await Promise.all([
    supabase
      .from('reviews')
      .select('*, webtoons(title, platform)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_items')
      .select('item_id, is_equipped, shop_items(name, type, costume_key, description)')
      .eq('user_id', user.id),
  ]);

  const reviews = reviewsResult.data;
  const ownedItems = (ownedItemsResult.data ?? []) as unknown as OwnedRow[];

  const equippedCostume = ownedItems.find((i) => i.is_equipped && i.shop_items?.type === 'costume')?.shop_items?.costume_key ?? null;
  const equippedTitle   = ownedItems.find((i) => i.is_equipped && i.shop_items?.type === 'title')?.shop_items?.name ?? null;

  const ownedCostumes = ownedItems.filter((i) => i.shop_items?.type === 'costume');
  const ownedTitles   = ownedItems.filter((i) => i.shop_items?.type === 'title');

  const nickname = profile?.nickname ?? '유저';
  const totalRecommends = profile?.total_recommends ?? 0;
  const rawEarned = profile && 'earned_points' in profile ? profile.earned_points : null;
  const rawBalance = profile && 'points' in profile ? profile.points : null;
  const points = Number(rawBalance ?? 0);
  const earnedPoints = Number(rawEarned ?? rawBalance ?? totalRecommends);
  const rank = getRank(totalRecommends);
  const pointLevel = getPointLevel(earnedPoints);
  const pointLevelIndex = POINT_LEVELS.findIndex((level) => level.label === pointLevel.label);

  const lastAttendance = profile && 'last_attendance_at' in profile
    ? profile.last_attendance_at as string | null
    : null;
  const today = new Date().toISOString().slice(0, 10);
  const checkedToday = lastAttendance != null && lastAttendance.slice(0, 10) === today;

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <LevelUpPopup userId={user.id} levelLabel={pointLevel.label} levelIndex={pointLevelIndex} />
      <Header />

      {/* 프로필 헤더 */}
      <section className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <TierBunny tier={pointLevel.label} size={56} costume={equippedCostume} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-black">{nickname}</span>
              {equippedTitle && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {equippedTitle}
                </span>
              )}
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

      {/* 스타 */}
      <section className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">내 스타</h2>
            <p className={`mt-1 text-lg font-black ${pointLevel.color}`}>{pointLevel.label}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tabular-nums">{points.toLocaleString()}</p>
            <p className="text-xs text-gray-400">보유 ★</p>
            <p className="text-xs text-gray-300 dark:text-gray-700">누적 {earnedPoints.toLocaleString()} ★</p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-900">
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${pointLevel.progress}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {pointLevel.remaining === null
              ? '최고 등급입니다'
              : `${pointLevel.nextLabel}까지 ${pointLevel.remaining.toLocaleString()} 스타 남음`}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/shop" className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400">상점 →</Link>
            <PointHistoryModal />
          </div>
        </div>
        <div className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-3 ${
          checkedToday
            ? 'border-green-100 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
            : 'border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
        }`}>
          {checkedToday ? (
            <><span className="text-base">✓</span><span className="text-xs font-bold text-green-600 dark:text-green-400">오늘 출석 완료! +50 스타 획득</span></>
          ) : (
            <><span className="text-base">☀️</span><span className="text-xs text-amber-700 dark:text-amber-400">오늘 방문하면 +50 스타가 자동 지급돼요</span></>
          )}
        </div>
      </section>

      <ProfilePerksPanel points={points} />

      {/* 내 아이템 */}
      {(ownedCostumes.length > 0 || ownedTitles.length > 0) && (
        <details className="border-b border-gray-100 dark:border-gray-800 group" open>
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4">
            <span className="text-sm font-bold">내 아이템 ({ownedItems.length})</span>
            <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="px-4 pb-4 space-y-4">
            {ownedCostumes.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 mb-2">코스튬</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {ownedCostumes.map((item) => (
                    <div key={item.item_id} className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 ${item.is_equipped ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20' : 'border-gray-100 dark:border-gray-800'}`}>
                      <TierBunny tier={pointLevel.label} size={56} costume={item.shop_items?.costume_key} />
                      <p className="text-[10px] font-bold text-center leading-tight">{item.shop_items?.name}</p>
                      {item.is_equipped ? (
                        <form action={unequipItem}>
                          <input type="hidden" name="itemId" value={item.item_id} />
                          <button className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                            장착중 ✓
                          </button>
                        </form>
                      ) : (
                        <form action={equipItem}>
                          <input type="hidden" name="itemId" value={item.item_id} />
                          <button className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 dark:border-gray-700">
                            장착
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ownedTitles.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 mb-2">칭호</p>
                <div className="flex flex-col gap-1.5">
                  {ownedTitles.map((item) => (
                    <div key={item.item_id} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${item.is_equipped ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20' : 'border-gray-100 dark:border-gray-800'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">{item.shop_items?.name}</span>
                        <span className="text-[10px] text-gray-400 truncate">{item.shop_items?.description}</span>
                      </div>
                      {item.is_equipped ? (
                        <form action={unequipItem}>
                          <input type="hidden" name="itemId" value={item.item_id} />
                          <button className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                            장착중 ✓
                          </button>
                        </form>
                      ) : (
                        <form action={equipItem}>
                          <input type="hidden" name="itemId" value={item.item_id} />
                          <button className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 dark:border-gray-700">
                            장착
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}

      {/* 스타 획득 방법 */}
      <details className="border-b border-gray-100 dark:border-gray-800 group">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4">
          <span className="text-sm font-bold">스타 획득 방법</span>
          <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="px-4 pb-4">
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
        </div>
      </details>

      {/* 토끼 등급 */}
      <details className="border-b border-gray-100 dark:border-gray-800 group">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4">
          <span className="text-sm font-bold">토끼 등급표</span>
          <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="px-4 pb-4">
          <div className="grid gap-2">
            {POINT_LEVELS.map((level) => (
              <div key={level.label} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${pointLevel.label === level.label ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-gray-100 dark:border-gray-900'}`}>
                <TierBunny tier={level.label} size={32} />
                <span className={`flex-1 text-sm font-bold ${level.color}`}>{level.label}</span>
                {pointLevel.label === level.label && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-white">현재</span>
                )}
                <span className="text-xs font-semibold text-gray-400">{level.min.toLocaleString()} 스타</span>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* 닉네임 변경 */}
      <details className="border-b border-gray-100 dark:border-gray-800 group">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4">
          <span className="text-sm font-bold">닉네임 변경</span>
          <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="px-4 pb-4">
          <NicknameForm currentNickname={nickname} />
        </div>
      </details>

      {/* 내 한줄평 */}
      <section className="flex-1 px-0">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-bold">내 한줄평 {reviews && reviews.length > 0 ? `(${reviews.length})` : ''}</h2>
        </div>
        {!reviews || reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <BunnyMascot size={44} />
            <p className="text-sm">아직 남긴 한줄평이 없어요</p>
          </div>
        ) : (
          <MyReviewList reviews={reviews.map((r) => ({ ...r, webtoons: (r.webtoons as { title: string } | null) }))} />
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
