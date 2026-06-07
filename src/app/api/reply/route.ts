export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { containsProfanity, containsPromoLink } from '@/lib/filter';

export async function POST(request: Request) {
  try {
    const { reviewId, comment } = await request.json() as { reviewId: string; comment: string };
    if (!reviewId || !comment) return Response.json({ error: '입력값이 없어요' }, { status: 400 });

    const trimmed = comment.trim().replace(/\s+/g, ' ');
    if (!trimmed) return Response.json({ error: '내용을 입력해주세요' }, { status: 400 });
    if (trimmed.length > 300) return Response.json({ error: '300자 이하로 입력해주세요' }, { status: 400 });
    if (containsProfanity(trimmed)) return Response.json({ error: '금지된 표현이 포함되어 있습니다' }, { status: 400 });
    if (containsPromoLink(trimmed)) return Response.json({ error: '외부 링크나 홍보성 내용은 작성할 수 없습니다' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const { error } = await supabase
      .from('review_replies')
      .insert({ review_id: reviewId, user_id: user.id, comment: trimmed });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // 댓글 작성 +5 스타 (작품당 1회)
    await supabase.rpc('award_points', {
      p_user_id: user.id,
      p_amount: 5,
      p_reason: '댓글 작성',
      p_unique_key: `reply:${user.id}:${reviewId}`,
      p_metadata: { review_id: reviewId },
    });

    return Response.json({ ok: true });
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
