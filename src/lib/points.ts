import type { createClient } from '@/lib/supabase/server';

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const POINT_RULES = [
  { label: '출석 체크', points: 50, description: '하루 1회' },
  { label: '추천 받기', points: 10, description: '내 한줄평에 추천 1개당' },
  { label: '주간랭킹 1위', points: 500, description: '그 주 받은 추천수 1위' },
  { label: '주간랭킹 2위', points: 400, description: '그 주 받은 추천수 2위' },
  { label: '주간랭킹 3위', points: 300, description: '그 주 받은 추천수 3위' },
  { label: '주간랭킹 4위', points: 200, description: '그 주 받은 추천수 4위' },
  { label: '주간랭킹 5위', points: 100, description: '그 주 받은 추천수 5위' },
  { label: '별점만 남기기', points: 5, description: '작품당 최초 1회' },
  { label: '별점과 한줄평 남기기', points: 15, description: '작품당 최초 1회, 별점만 남긴 뒤 한줄평 추가 시 차액 10스타' },
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

export async function awardAttendanceStars(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: result } = await supabase
    .rpc('award_points', {
      p_user_id: userId,
      p_amount: 50,
      p_reason: '출석 체크',
      p_unique_key: `attendance:${userId}:${today}`,
      p_metadata: { date: today },
    });

  if (result === false) {
    return { success: false, error: '오늘은 이미 출석 체크를 했어요' };
  }

  await supabase
    .from('profiles')
    .update({ last_attendance_at: new Date().toISOString() })
    .eq('id', userId);

  return { success: true };
}
