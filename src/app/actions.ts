'use server';

import { createClient } from '@/lib/supabase/server';

export async function createOrUpdateReview(
  webtoonId: string,
  score: number,
  comment: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { error } = await supabase.from('reviews').upsert(
    { webtoon_id: webtoonId, user_id: user.id, score, comment },
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
