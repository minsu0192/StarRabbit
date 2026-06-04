export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const fallbackName = user.user_metadata?.name ?? user.email?.split('@')[0] ?? '유저';
        await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              nickname: `${fallbackName.slice(0, 8)}-${user.id.slice(0, 4)}`,
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
      }

      const target = new URL(origin);
      target.searchParams.set('auth', 'success');
      return NextResponse.redirect(target);
    }

    const target = new URL(origin);
    target.searchParams.set('auth', 'failed');
    target.searchParams.set('reason', error.message);
    return NextResponse.redirect(target);
  }

  const target = new URL(origin);
  target.searchParams.set('auth', 'failed');
  if (providerError) target.searchParams.set('reason', providerError);
  return NextResponse.redirect(target);
}
