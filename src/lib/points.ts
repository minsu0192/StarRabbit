import type { createClient } from '@/lib/supabase/server';

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const POINT_RULES = [
  { label: '별점만 남기기', points: 5, description: '작품당 최초 1회' },
  { label: '별점과 한줄평 남기기', points: 15, description: '작품당 최초 1회, 별점만 남긴 뒤 한줄평을 추가하면 차액 10점' },
  { label: '응원전 참여', points: 10, description: '이벤트당 응원 댓글 최초 1회' },
  { label: '응원전 승리팀', points: 50, description: '이벤트 종료 시 승리 작품 응원 댓글 작성자' },
  { label: '응원전 패배팀', points: 20, description: '이벤트 종료 시 패배 작품 응원 댓글 작성자' },
  { label: '응원 댓글 1등', points: 150, description: '이벤트 내 추천수 1위 댓글' },
  { label: '응원 댓글 2등', points: 100, description: '이벤트 내 추천수 2위 댓글' },
  { label: '응원 댓글 3등', points: 50, description: '이벤트 내 추천수 3위 댓글' },
];

export const POINT_LEVELS = [
  { label: '길토끼', min: 0, color: 'text-gray-400' },
  { label: '풀토끼', min: 50, color: 'text-lime-500' },
  { label: '들토끼', min: 150, color: 'text-green-500' },
  { label: '달토끼', min: 500, color: 'text-blue-500' },
  { label: '별토끼', min: 1500, color: 'text-amber-500' },
  { label: '은하토끼', min: 5000, color: 'text-fuchsia-500' },
  { label: '우주토끼', min: 15000, color: 'text-violet-500' },
  { label: '전설토끼', min: 50000, color: 'text-rose-500' },
];

export function getPointLevel(points: number) {
  const safePoints = Math.max(0, Math.floor(points));
  const current = [...POINT_LEVELS].reverse().find((level) => safePoints >= level.min) ?? POINT_LEVELS[0];
  const next = POINT_LEVELS.find((level) => level.min > safePoints) ?? null;

  return {
    ...current,
    points: safePoints,
    nextLabel: next?.label ?? null,
    remaining: next ? next.min - safePoints : null,
    progress: next ? Math.round(((safePoints - current.min) / (next.min - current.min)) * 100) : 100,
  };
}

export function reviewPointValue(comment: string | null | undefined) {
  return String(comment ?? '').trim() ? 15 : 5;
}

export async function awardReviewPoints(
  supabase: ServerSupabaseClient,
  userId: string,
  previousComment: string | null | undefined,
  nextComment: string,
) {
  const previousPoints = previousComment === undefined ? 0 : reviewPointValue(previousComment);
  const nextPoints = reviewPointValue(nextComment);
  const delta = Math.max(nextPoints - previousPoints, 0);
  if (delta <= 0) return;

  const { data } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single();

  const currentPoints = Number(data?.points ?? 0);
  await supabase
    .from('profiles')
    .update({ points: currentPoints + delta })
    .eq('id', userId);
}
