'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface Props {
  user: { name: string; avatarUrl: string | null } | null;
  compact?: boolean;
}

export default function LoginButton({ user, compact = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const supabase = createClient();

  const handleLogin = async () => {
    setPending(true);
    try {
      const query = searchParams.toString();
      const next = `${pathname}${query ? `?${query}` : ''}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) alert(`로그인 오류: ${error.message}`);
    } catch (e) {
      alert(`오류: ${e}`);
    } finally {
      setPending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        disabled={pending}
        className="inline-flex h-9 items-center justify-center rounded-md bg-gray-950 px-3 text-xs font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
      >
        {pending ? '연결 중' : compact ? '로그인' : 'Google 로그인'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-white">
          {user.name.slice(0, 1)}
        </div>
        <span className="max-w-[84px] truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
          {user.name}
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="h-9 rounded-md px-2 text-xs font-medium text-gray-400 transition-colors hover:text-red-500"
      >
        나가기
      </button>
    </div>
  );
}
