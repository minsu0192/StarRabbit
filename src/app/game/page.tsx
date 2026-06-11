export const runtime = 'edge';

import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import LoginButton from '@/components/LoginButton';
import TierBunny from '@/components/TierBunny';
import { createClient } from '@/lib/supabase/server';
import { getPointLevel, POINT_LEVELS } from '@/lib/points';
import { TIER_UNIT_KEYS } from '@/lib/game/config';
import type { CostumeUnitKey, UnitKey } from '@/lib/game/types';
import GameClient from './GameClient';

export const metadata = {
  title: '토끼굴 수호대 | 별토끼',
  description: '내 토끼 수호대를 보내 토끼굴을 지키는 방어 미니게임',
};

type OwnedCostumeRow = {
  expires_at: string | null;
  shop_items: { costume_key: string | null; type: string } | null;
};

const COSTUME_KEYS = new Set<CostumeUnitKey>(['ninja', 'samurai', 'princess', 'mage', 'pirate', 'astronaut', 'devil', 'santa']);

export default async function GamePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-5 py-16">
          <section className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-200 bg-white text-center shadow-xl shadow-amber-100/60 dark:border-amber-900 dark:bg-gray-950 dark:shadow-none">
            <div className="bg-gradient-to-b from-sky-100 to-emerald-100 px-6 pt-8 dark:from-sky-950 dark:to-emerald-950">
              <div className="mx-auto w-fit"><TierBunny tier="별토끼" size={150} costume="samurai" /></div>
            </div>
            <div className="px-6 py-7">
              <p className="text-xs font-black tracking-[0.18em] text-amber-600">RABBIT HOLE GUARDIANS</p>
              <h1 className="mt-2 text-2xl font-black">로그인하고 수호대를 지켜주세요</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">게임 기록과 스타 보상은 계정에 저장됩니다. 보유한 등급 토끼와 상점 코스튬도 로그인 후 사용할 수 있어요.</p>
              <div className="mt-6 flex justify-center"><LoginButton user={null} /></div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const [profileResult, itemsResult] = await Promise.all([
    supabase.from('profiles').select('nickname, earned_points, points').eq('id', user.id).single(),
    supabase.from('user_items').select('expires_at, shop_items(costume_key, type)').eq('user_id', user.id),
  ]);
  const profile = profileResult.data;
  const level = getPointLevel(Number(profile?.earned_points ?? 0));
  const tierIndex = Math.max(0, POINT_LEVELS.findIndex((tier) => tier.label === level.label));
  const unlockedTiers = TIER_UNIT_KEYS.slice(0, tierIndex + 1);
  const now = new Date().toISOString();
  const ownedCostumes = ((itemsResult.data ?? []) as unknown as OwnedCostumeRow[])
    .filter((item) => item.shop_items?.type === 'costume' && (!item.expires_at || item.expires_at > now))
    .map((item) => item.shop_items?.costume_key)
    .filter((key): key is CostumeUnitKey => !!key && COSTUME_KEYS.has(key as CostumeUnitKey));
  const unlockedUnits = [...unlockedTiers, ...ownedCostumes] as UnitKey[];
  const kstDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  const { data: dailyStats, error: gameStatsError } = await supabase.from('game_daily_stats')
    .select('attempts_used, best_stage').eq('user_id', user.id).eq('game_date', kstDate).maybeSingle();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      <Header />
      <GameClient
        nickname={profile?.nickname ?? user.email?.split('@')[0] ?? '수호대장'}
        tierLabel={level.label}
        unlockedUnits={unlockedUnits}
        initialAttemptsUsed={dailyStats?.attempts_used ?? 0}
        initialBestStage={dailyStats?.best_stage ?? 0}
        gameDatabaseReady={!gameStatsError}
      />
      <SiteFooter />
    </div>
  );
}
