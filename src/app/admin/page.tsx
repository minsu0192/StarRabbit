export const runtime = 'edge';

import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = new Set(['minsu0192@gmail.com']);

const ADMIN_TASKS = [
  {
    title: '카카오 제목 정리',
    command: 'npm run clean:kakao-titles',
    description: '대괄호 메타, 이용권, 컬렉션/패키지/모음 항목을 정리합니다.',
  },
  {
    title: '네이버 장르 백필',
    command: 'npm run backfill:genres',
    description: '제목/출처 기반으로 비어 있는 장르를 채웁니다.',
  },
  {
    title: '네이버 소스 동기화',
    command: 'npm run sync:sources:naver',
    description: '네이버 연재 목록을 다시 가져오고 장르 추론을 적용합니다.',
  },
  {
    title: '응원전 DB 적용',
    command: 'supabase/add-cheer-points.sql',
    description: '포인트 장부, 응원전, 응원 댓글 테이블을 추가하는 SQL입니다.',
  },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? '';

  if (!ADMIN_EMAILS.has(email)) redirect('/');

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      <Header />

      <section className="border-b border-gray-100 px-4 py-6 dark:border-gray-900">
        <p className="text-xs font-bold text-amber-500">ADMIN</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">관리자 설정</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {email} 계정에서만 보이는 운영 작업 목록입니다.
        </p>
      </section>

      <main className="flex-1 px-4 py-4">
        <div className="divide-y divide-gray-100 rounded-md border border-gray-100 dark:divide-gray-900 dark:border-gray-900">
          {ADMIN_TASKS.map((task) => (
            <div key={task.title} className="px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold">{task.title}</h2>
                  <p className="mt-1 text-xs text-gray-400">{task.description}</p>
                </div>
                <code className="shrink-0 rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  {task.command}
                </code>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
