export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { validateReplyInput } from '@/lib/review-validation';

export async function POST(request: Request) {
  try {
    const { reviewId, comment } = await request.json() as { reviewId: string; comment: string };
    if (!reviewId || !comment) return Response.json({ error: '입력값이 없어요' }, { status: 400 });

    const validation = validateReplyInput(comment);
    if ('error' in validation) return Response.json({ error: validation.error }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const { data: reply, error } = await supabase
      .from('review_replies')
      .insert({ review_id: reviewId, user_id: user.id, comment: validation.comment })
      .select('id, comment, created_at, user_id, profiles(nickname)')
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const { error: pointError } = await supabase.rpc('award_points', {
      p_user_id: user.id,
      p_amount: 5,
      p_reason: '댓글 작성',
      p_unique_key: `reply:${user.id}:${reviewId}`,
      p_metadata: { review_id: reviewId },
    });

    if (pointError) {
      console.error('reply award_points failed', pointError);
    }

    return Response.json({ ok: true, reply });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { replyId } = await request.json() as { replyId: string };
    if (!replyId) return Response.json({ error: '댓글 ID가 없어요' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const { error } = await supabase
      .from('review_replies')
      .delete()
      .eq('id', replyId)
      .eq('user_id', user.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
