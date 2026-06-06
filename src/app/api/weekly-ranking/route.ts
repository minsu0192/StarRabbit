export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('distribute_weekly_ranking_stars');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ distributed: data });
}
