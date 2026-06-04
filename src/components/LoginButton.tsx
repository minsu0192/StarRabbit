'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';

interface Props {
  user: { name: string; avatarUrl: string | null } | null;
  compact?: boolean;
}

function getUserInfo(user: User | null) {
  if (!user) return null;
  return {
    name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? '유저',
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  };
}

export default function LoginButton({ user, compact = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const clientUser = getUserInfo(data.user);
      if (clientUser) setCurrentUser(clientUser);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(getUserInfo(session?.user ?? null));
      router.refresh();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router, supabase]);

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
    setCurrentUser(null);
    router.push('/');
    router.refresh();
  };

  if (!currentUser) {
    return (
      <button
        onClick={handleLogin}
        disabled={pending}
        className="inline-flex h-9 items-center justify-center rounded-md bg-gray-950 px-3 text-xs font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
      >
        {pending ? '연결 중' : compact ? '로그인' : 'Google로 로그인'}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 dark:border-amber-900 dark:bg-amber-950/40">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-white">
          {currentUser.name.slice(0, 1)}
        </div>
        <span className="max-w-[112px] truncate text-xs font-bold text-gray-900 dark:text-gray-100">
          {currentUser.name}님
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
