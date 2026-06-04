'use client';

import { useEffect, useState } from 'react';
import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthFeedback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth === 'success') {
      supabase.auth.getUser().then(({ data }) => {
        const name = data.user?.user_metadata?.name ?? data.user?.email?.split('@')[0] ?? '유저';
        setMessage(`${name}님 환영합니다`);
      });

      const timer = window.setTimeout(() => {
        setMessage('');
        const url = new URL(window.location.href);
        url.searchParams.delete('auth');
        router.replace(`${url.pathname}${url.search}`);
      }, 2600);

      return () => window.clearTimeout(timer);
    }

    if (auth === 'failed') {
      setMessage('로그인에 실패했습니다. 다시 시도해주세요.');
      const timer = window.setTimeout(() => setMessage(''), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [router, searchParams, supabase]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-3 z-50 flex justify-center px-4">
      <div className="max-w-sm rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-lg dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100">
        {message}
      </div>
    </div>
  );
}
