export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { awardReviewPoints } from '@/lib/points';
import { validateReviewInput } from '@/lib/review-validation';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return errorResponse('로그인이 필요합니다', 401);
  const { data: profileState } = await supabase
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .single();
  if (profileState?.is_suspended) return errorResponse('정지된 계정은 평점을 남길 수 없습니다', 403);

  const body = await request.json().catch(() => null);
  const webtoonId = String(body?.webtoonId ?? '');

  if (!webtoonId) return errorResponse('작품 정보가 없습니다');
  const validation = validateReviewInput(body?.score, body?.comment);
  if ('error' in validation) return errorResponse(validation.error);

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('comment')
    .eq('webtoon_id', webtoonId)
    .eq('user_id', user.id)
    .maybeSingle();

  const { error } = await supabase.from('reviews').upsert(
    { webtoon_id: webtoonId, user_id: user.id, score: validation.score, comment: validation.comment },
    { onConflict: 'webtoon_id,user_id' },
  );

  if (error) return errorResponse(error.message, 500);

  await awardReviewPoints(user.id, existingReview?.comment, validation.comment, webtoonId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return errorResponse('로그인이 필요합니다', 401);

  const body = await request.json().catch(() => null);
  const reviewId = String(body?.reviewId ?? '');
  if (!reviewId) return errorResponse('한줄평 정보가 없습니다');

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id);

  return error ? errorResponse(error.message, 500) : NextResponse.json({ ok: true });
}
