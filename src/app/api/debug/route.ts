export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    return Response.json({ error: '관리자만 접근 가능합니다' }, { status: 403 });
  }

  // 웹툰별 리뷰 수를 nested 방식으로 확인
  const nestedResult = await supabase
    .from('webtoons')
    .select('id, title, reviews(id, score)')
    .limit(50)
    .order('title', { ascending: true });

  // 리뷰 테이블 직접 조회
  const directResult = await supabase
    .from('reviews')
    .select('id, webtoon_id, score, webtoons(title)');

  const nestedCounts = (nestedResult.data ?? []).map((w) => ({
    title: w.title,
    nested_review_count: (w.reviews as { id: string }[] ?? []).length,
  })).filter(w => w.nested_review_count > 0);

  return Response.json({
    nested_with_reviews: nestedCounts,
    direct_reviews: (directResult.data ?? []).map((r) => ({
      webtoon: (r.webtoons as { title?: string } | null)?.title,
      score: r.score,
    })),
    nested_error: nestedResult.error?.message ?? null,
    direct_error: directResult.error?.message ?? null,
  });
}
