export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = Math.max(0, Number(url.searchParams.get('from') ?? '0'));
    const requestedTo = Number(url.searchParams.get('to') ?? '19');
    const to = Math.min(Math.max(from, requestedTo), from + 49);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });

    const { data, error } = await supabase
      .from('point_transactions')
      .select('id, amount, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(
      { transactions: data ?? [] },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
