export const runtime = 'edge';

import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import { createClient } from '@/lib/supabase/server';
import { createWebtoonRequest } from './actions';

interface RequestPageProps {
  searchParams: Promise<{ msg?: string }>;
}

type WebtoonRequestRow = {
  id: string;
  title: string;
  author: string | null;
  platform: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

const STATUS_LABEL: Record<WebtoonRequestRow['status'], string> = {
  pending: '검토중',
  approved: '승인됨',
  rejected: '반려됨',
};

export default async function WebtoonRequestPage({ searchParams }: RequestPageProps) {
  const { msg } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data } = await supabase
    .from('webtoon_requests')
    .select('id, title, author, platform, status, created_at')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);
  const requests = (data ?? []) as WebtoonRequestRow[];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      <Header />

      <section className="border-b border-gray-100 px-4 py-6 dark:border-gray-900">
        <p className="text-xs font-bold text-amber-500">REQUEST</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">웹툰 등록 신청</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          별토끼에 없는 작품을 알려주시면 관리자가 검토 후 등록합니다.
        </p>
      </section>

      <main className="flex-1 space-y-4 px-4 py-4">
        {msg && (
          <div className={`rounded-md border px-3 py-2 text-sm font-semibold ${msg.includes('접수') ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'}`}>
            {msg}
          </div>
        )}

        <section className="rounded-md border border-gray-100 p-3 dark:border-gray-900">
          <h2 className="mb-3 text-sm font-bold">새 작품 신청</h2>
          <form action={createWebtoonRequest} className="grid gap-2">
            <input name="title" required maxLength={120} placeholder="작품 제목" className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800" />
            <input name="author" maxLength={80} placeholder="작가명" className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800" />
            <select name="platform" defaultValue="etc" className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800">
              <option value="naver">네이버</option>
              <option value="kakao">카카오</option>
              <option value="ridi">리디</option>
              <option value="etc">기타</option>
            </select>
            <input name="sourceUrl" type="url" maxLength={500} placeholder="작품 URL" className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800" />
            <textarea name="note" maxLength={300} rows={3} placeholder="관리자에게 남길 메모" className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800" />
            <button className="rounded-md bg-gray-950 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-gray-950">
              등록 신청
            </button>
          </form>
        </section>

        <section className="rounded-md border border-gray-100 p-3 dark:border-gray-900">
          <h2 className="mb-3 text-sm font-bold">내 신청 내역</h2>
          {requests.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">아직 신청한 작품이 없어요</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-900">
              {requests.map((request) => (
                <div key={request.id} className="grid grid-cols-[1fr_auto] gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{request.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {request.author || '작가 미상'} · {request.platform} · {request.created_at.slice(0, 10)}
                    </p>
                  </div>
                  <span className="self-start rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-500 dark:bg-gray-900">
                    {STATUS_LABEL[request.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
