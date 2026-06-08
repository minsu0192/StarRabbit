import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import BunnyMascot from './BunnyMascot';
import LoginButton from './LoginButton';
import ThemeMenu from './ThemeMenu';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let nickname = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? '유저';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, last_attendance_at')
      .eq('id', user.id)
      .single();
    if (profile?.nickname) nickname = profile.nickname;

    // 오늘 출석 체크 안 했으면 자동 지급
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = profile?.last_attendance_at
      ? (profile.last_attendance_at as string).slice(0, 10)
      : null;
    if (lastDate !== today) {
      await supabase.rpc('auto_attend', { p_user_id: user.id });
    }
  }

  const userInfo = user
    ? { name: nickname, avatarUrl: user.user_metadata?.avatar_url ?? null }
    : null;
  const isAdmin = isAdminEmail(user?.email);

  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-[var(--background)]/90 px-4 py-3 backdrop-blur dark:border-gray-900">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-50 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:ring-amber-900">
            <BunnyMascot size={26} />
          </span>
          <span className="truncate text-base font-black tracking-tight">별토끼</span>
        </Link>
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          {user && (
            <span className="hidden max-w-32 truncate text-xs font-semibold text-gray-500 min-[460px]:block">
              {nickname}님 반가워요
            </span>
          )}
          {isAdmin && (
            <Link href="/admin" className="hidden text-xs font-semibold text-amber-600 transition-colors hover:text-amber-700 min-[390px]:block">
              관리자
            </Link>
          )}
          {user && (
            <Link href="/profile" className="hidden text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-gray-100 min-[390px]:block">
              프로필
            </Link>
          )}
          <Link href="/cheer" className="hidden text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-gray-100 min-[390px]:block">
            응원
          </Link>
          {user && (
            <Link href="/request" className="hidden text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-gray-100 min-[460px]:block">
              신청
            </Link>
          )}
          <ThemeMenu />
          <LoginButton user={userInfo} compact />
        </div>
      </div>
    </header>
  );
}
