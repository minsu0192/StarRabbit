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
  const { data: profileState } = await supabase
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .single();
  if (profileState?.is_suspended) return { error: '정지된 계정은 평점을 남길 수 없습니다' };

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname_updated_at, is_suspended')
    .eq('id', user.id)
    .single();
  if (profile?.is_suspended) return { error: '정지된 계정은 닉네임을 바꿀 수 없습니다' };

  if (profile?.nickname_updated_at) {
    const lastChanged = new Date(profile.nickname_updated_at).getTime();
    const nextChangeAt = lastChanged + 10 * 24 * 60 * 60 * 1000;
    if (Date.now() < nextChangeAt) {
      const remainingDays = Math.ceil((nextChangeAt - Date.now()) / (24 * 60 * 60 * 1000));
      return { error: `닉네임은 10일에 한 번만 바꿀 수 있어요. ${remainingDays}일 뒤 다시 시도해주세요` };
    }
  }

  let { error } = await supabase
    .from('profiles')
    .update({ nickname: trimmed, nickname_updated_at: new Date().toISOString() })
    .eq('id', user.id);
  if (error?.message?.includes('nickname_updated_at')) {
    const fallback = await supabase
      .from('profiles')
      .update({ nickname: trimmed })
      .eq('id', user.id);
    error = fallback.error;
  }

  return error
    ? { error: error.code === '23505' ? '이미 사용 중인 닉네임입니다' : error.message }
    : {};
}
