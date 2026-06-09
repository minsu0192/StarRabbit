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
};

type UserItem = { item_id: string; is_equipped: boolean };

const TYPE_LABEL: Record<string, string> = {
  costume: '코스튬',
  title: '칭호',
  frame: '테두리',
};

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [shopRes, userItemsRes, profileRes] = await Promise.all([
    supabase.from('shop_items').select('*').eq('is_available', true).order('type').order('price'),
    user
      ? supabase.from('user_items').select('item_id, is_equipped').eq('user_id', user.id)
      : Promise.resolve({ data: [] as UserItem[] }),
    user
      ? supabase.from('profiles').select('points, earned_points').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const allItems = (shopRes.data ?? []) as ShopItem[];
  const userItems = (userItemsRes.data ?? []) as UserItem[];
  const profile = profileRes.data as { points: number; earned_points: number } | null;

  const ownedIds = new Set(userItems.map((u) => u.item_id));
  const equippedIds = new Set(userItems.filter((u) => u.is_equipped).map((u) => u.item_id));

  const balance = profile?.points ?? 0;
  const earnedPoints = profile?.earned_points ?? 0;
  const tier = getPointLevel(earnedPoints);

  const equippedCostume = allItems.find((i) => equippedIds.has(i.id) && i.type === 'costume');
  const equippedTitle = allItems.find((i) => equippedIds.has(i.id) && i.type === 'title');

  const groups = ['costume', 'title'] as const;

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto w-full">
      <Header />

      {/* 헤더 */}
      <section className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-0.5">SHOP</p>
            <h1 className="text-xl font-black tracking-tight">별토끼 상점</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">스타로 코스튬과 칭호를 구매하세요</p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1">
            <TierBunny tier={tier.label} size={60} costume={equippedCostume?.costume_key} />
            {user ? (
              <p className="text-xs font-black tabular-nums text-amber-500">{balance.toLocaleString()} ★ 보유</p>
            ) : (
              <p className="text-[11px] text-gray-400">로그인 후 구매 가능</p>
            )}
            {equippedTitle && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {equippedTitle.name}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 아이템 목록 */}
      {groups.map((type) => {
        const items = allItems.filter((i) => i.type === type);
        if (items.length === 0) return null;
        return (
          <section key={type} className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-black mb-3">{TYPE_LABEL[type]}</h2>

            {type === 'costume' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((item) => {
                  const owned = ownedIds.has(item.id);
                  const equipped = equippedIds.has(item.id);
                  const canAfford = balance >= item.price;
                  return (
                    <div key={item.id} className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${equipped ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950'}`}>
                      <TierBunny tier={tier.label} size={68} costume={item.costume_key} />
                      <p className="text-xs font-black text-center">{item.name}</p>
                      <p className="text-[10px] text-gray-400 text-center leading-snug">{item.description}</p>
                      {!owned && (
                        <p className={`text-xs font-bold ${canAfford ? 'text-amber-500' : 'text-red-400'}`}>
                          {item.price.toLocaleString()} ★
                        </p>
                      )}
                      <ItemButton item={item} owned={owned} equipped={equipped} canAfford={canAfford} user={!!user} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item) => {
                  const owned = ownedIds.has(item.id);
                  const equipped = equippedIds.has(item.id);
                  const canAfford = balance >= item.price;
                  return (
                    <div key={item.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${equipped ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950'}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">{item.name}</span>
                          {equipped && <span className="text-[10px] text-amber-500 font-bold">장착중</span>}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">{item.description}</p>
                        {!owned && (
                          <p className={`text-xs font-bold mt-1 ${canAfford ? 'text-amber-500' : 'text-red-400'}`}>
                            {item.price.toLocaleString()} ★
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <ItemButton item={item} owned={owned} equipped={equipped} canAfford={canAfford} user={!!user} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

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

function ItemButton({
  item, owned, equipped, canAfford, user,
}: {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  user: boolean;
}) {
  if (!user) {
    return <span className="text-[10px] text-gray-400">{item.price.toLocaleString()} ★</span>;
  }
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
