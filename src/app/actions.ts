'use server';

import { createClient } from '@/lib/supabase/server';

function normalizeScore(score: number) {
  if (!Number.isFinite(score)) return null;
  const rounded = Math.round(score * 2) / 2;
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

export async function createOrUpdateReview(
  webtoonId: string,
  score: number,
  comment: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const safeScore = normalizeScore(score);
  if (safeScore === null) return { error: '평점은 1.0점부터 10.0점까지 0.5점 단위로 입력해주세요' };

  const trimmed = comment.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 1) return { error: '한줄평은 비우거나 2자 이상 입력해주세요' };
  if (trimmed.length > 200) return { error: '한줄평은 200자 이하여야 합니다' };

  const { error } = await supabase.from('reviews').upsert(
    { webtoon_id: webtoonId, user_id: user.id, score: safeScore, comment: trimmed },
    { onConflict: 'webtoon_id,user_id' }
  );

  return error ? { error: error.message } : {};
}

export async function deleteReview(
  reviewId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id);

  return error ? { error: error.message } : {};
}

export async function updateNickname(
  nickname: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const trimmed = nickname.trim();
  if (!trimmed || trimmed.length < 2) return { error: '닉네임은 2자 이상이어야 합니다' };
  if (trimmed.length > 12) return { error: '닉네임은 12자 이하여야 합니다' };

  const { error } = await supabase
    .from('profiles')
    .update({ nickname: trimmed })
    .eq('id', user.id);

  return error
    ? { error: error.code === '23505' ? '이미 사용 중인 닉네임입니다' : error.message }
    : {};
}
