export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import TierBunny from '@/components/TierBunny';
import { getPointLevel } from '@/lib/points';
import { purchaseItem, equipItem, unequipItem } from './actions';

type ShopItem = {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  costume_key: string | null;
  duration_days: number | null;
};

type UserItem = { item_id: string; is_equipped: boolean; expires_at: string | null };

const EFFECT_META: Record<string, { icon: string; label: string }> = {
  nickname_color:   { icon: '🎨', label: '닉네임 컬러' },
  review_badge:     { icon: '✦',  label: '프로필 배지' },
  review_highlight: { icon: '✨', label: '한줄평 강조' },
};

function daysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

const ERR_MSG: Record<string, string> = {
  not_found:    '상품을 찾을 수 없어요.',
  insufficient: '포인트가 부족해요.',
  already_owned:'이미 보유한 아이템이에요.',
  db:           'DB 오류가 발생했어요.',
  login:        '로그인이 필요해요.',
  unknown:      '알 수 없는 오류가 발생했어요.',
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; msg?: string }> }) {
  const { ok, err, msg } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [shopRes, userItemsRes, profileRes] = await Promise.all([
    supabase.from('shop_items').select('*').eq('is_available', true).order('type').order('price'),
    user
      ? supabase.from('user_items').select('item_id, is_equipped, expires_at').eq('user_id', user.id)
      : Promise.resolve({ data: [] as UserItem[] }),
    user
      ? supabase.from('profiles').select('points, earned_points').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const allItems = (shopRes.data ?? []) as ShopItem[];
  const userItems = (userItemsRes.data ?? []) as UserItem[];
  const profile = profileRes.data as { points: number; earned_points: number } | null;

  const now = new Date().toISOString();
  const activeIds = new Set(
    userItems.filter((u) => !u.expires_at || u.expires_at > now).map((u) => u.item_id)
  );
  const equippedIds = new Set(userItems.filter((u) => u.is_equipped).map((u) => u.item_id));
  const expiryMap = new Map(userItems.filter((u) => u.expires_at).map((u) => [u.item_id, u.expires_at!]));

  const balance = profile?.points ?? 0;
  const earnedPoints = profile?.earned_points ?? 0;
  const tier = getPointLevel(earnedPoints);

  const equippedCostume = allItems.find((i) => equippedIds.has(i.id) && i.type === 'costume');

  const costumes = allItems.filter((i) => i.type === 'costume');
  const effects  = allItems.filter((i) => ['nickname_color', 'review_badge', 'review_highlight'].includes(i.type));

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <Header />

      {/* 헤더 */}
      <section className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-0.5">SHOP</p>
            <h1 className="text-xl font-black tracking-tight">별토끼 상점</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">스타로 코스튬과 효과를 구매하세요</p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1">
            <TierBunny tier={tier.label} size={60} costume={equippedCostume?.costume_key} />
            {user ? (
              <p className="text-xs font-black tabular-nums text-amber-500">{balance.toLocaleString()} ★ 보유</p>
            ) : (
              <p className="text-[11px] text-gray-400">로그인 후 구매 가능</p>
            )}
          </div>
        </div>
      </section>

      {/* 구매 결과 메시지 */}
      {ok && (
        <div className="mx-4 mt-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm font-bold text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">
          구매 완료!
        </div>
      )}
      {err && (
        <div className="mx-4 mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
          {ERR_MSG[err] ?? ERR_MSG.unknown}{msg ? ` (${msg})` : ''}
        </div>
      )}

      {/* 코스튬 */}
      {costumes.length > 0 && (
        <section className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-black mb-3">코스튬</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {costumes.map((item) => {
              const owned = activeIds.has(item.id);
              const equipped = equippedIds.has(item.id);
              const canAfford = balance >= item.price;
              return (
                <div
                  key={item.id}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${
                    equipped
                      ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20'
                      : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950'
                  }`}
                >
                  <TierBunny tier={tier.label} size={68} costume={item.costume_key} />
                  <p className="text-xs font-black text-center">{item.name}</p>
                  <p className="text-[10px] text-gray-400 text-center leading-snug">{item.description}</p>
                  {!owned && (
                    <p className={`text-xs font-bold ${canAfford ? 'text-amber-500' : 'text-red-400'}`}>
                      {item.price.toLocaleString()} ★
                    </p>
                  )}
                  <CostumeButton item={item} owned={owned} equipped={equipped} canAfford={canAfford} user={!!user} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 효과 아이템 */}
      {effects.length > 0 && (
        <section className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-black mb-3">효과</h2>
          <div className="flex flex-col gap-2">
            {effects.map((item) => {
              const active = activeIds.has(item.id);
              const expiry = expiryMap.get(item.id);
              const canAfford = balance >= item.price;
              const meta = EFFECT_META[item.type] ?? { icon: '◆', label: item.type };
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                    active
                      ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20'
                      : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm">{meta.icon}</span>
                      <span className="text-xs font-black">{item.name}</span>
                      {item.duration_days && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
                          {item.duration_days}일권
                        </span>
                      )}
                      {active && expiry && (
                        <span className="text-[10px] font-bold text-amber-500">
                          {daysLeft(expiry)}일 남음
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">{item.description}</p>
                    {!active && (
                      <p className={`text-xs font-bold mt-1 ${canAfford ? 'text-amber-500' : 'text-red-400'}`}>
                        {item.price.toLocaleString()} ★
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <EffectButton item={item} active={active} canAfford={canAfford} user={!!user} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 스타 획득 안내 */}
      <section className="px-4 py-5">
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">★ 스타 모으는 방법</p>
          <ul className="space-y-1 text-[11px] text-amber-600 dark:text-amber-500">
            <li>· 매일 출석 체크 +50 ★</li>
            <li>· 한줄평 작성 +15 ★</li>
            <li>· 별점만 남기기 +5 ★</li>
            <li>· 추천 받을 때마다 +10 ★</li>
            <li>· 응원전 참여 / 우승 시 보너스 ★</li>
          </ul>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function CostumeButton({
  item, owned, equipped, canAfford, user,
}: {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  user: boolean;
}) {
  if (!user) return <span className="text-[10px] text-gray-400">{item.price.toLocaleString()} ★</span>;
  if (owned) {
    if (equipped) {
      return (
        <form action={unequipItem}>
          <input type="hidden" name="itemId" value={item.id} />
          <button className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
            장착중 ✓
          </button>
        </form>
      );
    }
    return (
      <form action={equipItem}>
        <input type="hidden" name="itemId" value={item.id} />
        <button className="text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600 dark:border-gray-700 dark:text-gray-300">
          장착하기
        </button>
      </form>
    );
  }
  return (
    <form action={purchaseItem}>
      <input type="hidden" name="itemId" value={item.id} />
      <button
        disabled={!canAfford}
        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
          canAfford
            ? 'border-amber-400 bg-amber-400 text-white hover:bg-amber-500'
            : 'border-gray-100 text-gray-300 cursor-not-allowed dark:border-gray-800 dark:text-gray-700'
        }`}
      >
        {canAfford ? `구매 ${item.price.toLocaleString()}★` : '잔고 부족'}
      </button>
    </form>
  );
}

function EffectButton({
  item, active, canAfford, user,
}: {
  item: ShopItem;
  active: boolean;
  canAfford: boolean;
  user: boolean;
}) {
  if (!user) return <span className="text-[10px] text-gray-400">{item.price.toLocaleString()} ★</span>;
  if (active) {
    return (
      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
        사용중 ✓
      </span>
    );
  }
  return (
    <form action={purchaseItem}>
      <input type="hidden" name="itemId" value={item.id} />
      <button
        disabled={!canAfford}
        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
          canAfford
            ? 'border-amber-400 bg-amber-400 text-white hover:bg-amber-500'
            : 'border-gray-100 text-gray-300 cursor-not-allowed dark:border-gray-800 dark:text-gray-700'
        }`}
      >
        {canAfford ? `구매 ${item.price.toLocaleString()}★` : '잔고 부족'}
      </button>
    </form>
  );
}
