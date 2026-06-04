import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BunnyMascot from './BunnyMascot';
import LoginButton from './LoginButton';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let nickname = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? '유저';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();
    if (profile?.nickname) nickname = profile.nickname;
  }

  const userInfo = user
    ? { name: nickname, avatarUrl: user.user_metadata?.avatar_url ?? null }
    : null;

  return (
    <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <BunnyMascot size={28} />
        <span className="font-black text-base tracking-tight">별토끼</span>
      </Link>
      <div className="flex items-center gap-2">
        {user && (
          <Link href="/profile" className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            프로필
          </Link>
        )}
        <LoginButton user={userInfo} />
      </div>
    </header>
  );
}
