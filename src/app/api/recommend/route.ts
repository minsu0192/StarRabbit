export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { reviewId } = await request.json() as { reviewId: string };
    if (!reviewId) return Response.json({ error: '리뷰 ID가 없어요' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const { data: existing } = await supabase
      .from('recommends')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('recommends')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ recommended: false });
    }

    const { data: review } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();
    if (!review) {
      return Response.json({ error: '한줄평을 찾을 수 없어요' }, { status: 404 });
    }
    if (review?.user_id === user.id) {
      return Response.json({ error: '내 한줄평은 추천할 수 없어요' }, { status: 400 });
    }

    const { error } = await supabase
      .from('recommends')
      .insert({ review_id: reviewId, user_id: user.id });
    if (error?.code === '23505') return Response.json({ recommended: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ recommended: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
