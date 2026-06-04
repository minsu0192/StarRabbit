'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Props {
  user: { name: string; avatarUrl: string | null } | null;
}

export default function LoginButton({ user }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        구글로 로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
        <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-white shrink-0">
          {user.name.slice(0, 1)}
        </div>
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 max-w-[80px] truncate">
          {user.name}
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
