export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const PAGE_SIZE = 10;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const [{ data, error }, { count }] = await Promise.all([
      supabase
        .from('point_transactions')
        .select('id, amount, reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to),
      supabase
        .from('point_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(
      { transactions: data ?? [], total: count ?? 0 },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
