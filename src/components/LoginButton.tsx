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
        로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-xs font-black text-white shrink-0">
        {user.name.slice(0, 1)}
      </div>
      <button
        onClick={handleLogout}
        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
