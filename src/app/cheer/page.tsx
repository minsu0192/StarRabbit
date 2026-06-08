export const runtime = 'edge';

import Link from 'next/link';
import Header from '@/components/Header';
import BunnyMascot from '@/components/BunnyMascot';
import { createClient } from '@/lib/supabase/server';
import { recommendCheerComment, submitCheerComment } from './actions';

type CheerComment = {
  id: string;
  webtoon_id: string;
  user_id: string;
  comment: string;
  recommend_count: number;
  created_at: string;
  profiles: { nickname?: string } | null;
};

type CheerEntry = {
  id: string;
  webtoon_id: string;
  webtoons: { title?: string; author?: string | null; platform?: string } | null;
};

type CheerEvent = {
  id: string;
  title: string;
  status: string;
  starts_at: string;
  ends_at: string;
  cheer_entries?: CheerEntry[];
  cheer_comments?: CheerComment[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function eventState(event: CheerEvent) {
  const now = Date.now();
  if (event.status === 'cancelled') return '취소됨';
  if (event.status === 'settled') return '정산완료';
  if (event.status === 'active' && now <= new Date(event.ends_at).getTime()) return '진행중';
  if (now < new Date(event.starts_at).getTime()) return '예정';
  if (now > new Date(event.ends_at).getTime()) return '종료';
  return '진행중';
}

export default async function CheerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('cheer_events')
    .select(`
      id, title, status, starts_at, ends_at,
      cheer_entries(id, webtoon_id, webtoons(title, author, platform)),
      cheer_comments(id, webtoon_id, user_id, comment, recommend_count, created_at, profiles(nickname))
    `)
    .in('status', ['scheduled', 'active'])
    .order('starts_at', { ascending: false })
    .limit(10);

  const events = error ? [] : ((data ?? []) as CheerEvent[]);

  return (
    <div className="flex min-h-screen w-full max-w-2xl flex-col mx-auto pb-20">
      <Header />

      <section className="border-b border-gray-100 px-4 py-6 dark:border-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber-50 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:ring-amber-900">
            <BunnyMascot size={36} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-500">CHEER LEAGUE</p>
            <h1 className="text-2xl font-black tracking-tight">별토끼 응원전</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">작품 하나를 골라 응원 댓글을 남기면 50스타를 받아요.</p>
          </div>
        </div>
      </section>

      {!user && (
        <section className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-300">
          로그인하면 응원 댓글을 작성하고 포인트를 받을 수 있어요.
        </section>
      )}

      {error ? (
        <section className="px-4 py-12 text-center">
          <BunnyMascot size={44} />
          <p className="mt-3 text-sm text-gray-400">응원전 테이블이 아직 준비되지 않았어요.</p>
        </section>
      ) : events.length === 0 ? (
        <section className="px-4 py-12 text-center">
          <BunnyMascot size={44} />
          <p className="mt-3 text-sm text-gray-400">현재 진행 중인 응원전이 없습니다.</p>
        </section>
      ) : (
        <main className="flex-1 divide-y divide-gray-100 dark:divide-gray-900">
          {events.map((event) => {
            const state = eventState(event);
            const entries = event.cheer_entries ?? [];
            const comments = [...(event.cheer_comments ?? [])].sort((a, b) => b.recommend_count - a.recommend_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const myComment = user ? comments.find((comment) => comment.user_id === user.id) : null;
            const isOpen = state === '진행중';

            return (
              <article key={event.id} className="px-4 py-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight">{event.title}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${isOpen ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-900'}`}>
                        {state}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDateTime(event.starts_at)} - {formatDateTime(event.ends_at)}
                    </p>
                  </div>
                </div>

                <div className="mb-4 grid gap-2">
                  {entries.map((entry) => {
                    const count = comments.filter((comment) => comment.webtoon_id === entry.webtoon_id).length;
                    return (
                      <div key={entry.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-gray-100 px-3 py-2 dark:border-gray-900">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{entry.webtoons?.title ?? '알 수 없음'}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-400">{entry.webtoons?.author ?? '작가 미상'} · {entry.webtoons?.platform ?? 'etc'}</p>
                        </div>
                        <span className="self-center text-xs font-black text-amber-500">{count} 응원</span>
                      </div>
                    );
                  })}
                </div>

                {user && isOpen && (
                  <form action={submitCheerComment} className="mb-4 grid gap-2 rounded-md border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-950 dark:bg-amber-950/20">
                    <input type="hidden" name="eventId" value={event.id} />
                    <select name="webtoonId" defaultValue={myComment?.webtoon_id ?? entries[0]?.webtoon_id ?? ''} className="rounded-md border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-amber-900 dark:bg-gray-950">
                      {entries.map((entry) => (
                        <option key={entry.id} value={entry.webtoon_id}>{entry.webtoons?.title ?? entry.webtoon_id}</option>
                      ))}
                    </select>
                    <textarea name="comment" required minLength={2} maxLength={300} rows={3} defaultValue={myComment?.comment ?? ''} placeholder="응원 댓글을 남겨주세요" className="rounded-md border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-amber-900 dark:bg-gray-950" />
                    <button className="rounded-md bg-gray-950 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-gray-950">
                      {myComment ? '응원 수정' : '응원하기 +50★'}
                    </button>
                  </form>
                )}

                <div className="divide-y divide-gray-100 rounded-md border border-gray-100 dark:divide-gray-900 dark:border-gray-900">
                  {comments.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-gray-400">아직 응원 댓글이 없어요.</p>
                  ) : comments.map((comment) => {
                    const entry = entries.find((item) => item.webtoon_id === comment.webtoon_id);
                    return (
                      <div key={comment.id} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{entry?.webtoons?.title ?? '알 수 없음'}</p>
                          <p className="mt-1 break-words text-sm text-gray-700 dark:text-gray-300">{comment.comment}</p>
                          <p className="mt-1 text-[11px] text-gray-400">{comment.profiles?.nickname ?? '익명'} · {comment.created_at.slice(0, 10)}</p>
                        </div>
                        <form action={recommendCheerComment} className="self-start">
                          <input type="hidden" name="commentId" value={comment.id} />
                          <button disabled={!user || comment.user_id === user?.id} className="rounded-md border border-gray-200 px-2 py-1 text-xs font-bold text-gray-500 disabled:opacity-40 dark:border-gray-800">
                            ♥ {comment.recommend_count}
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </main>
      )}

      <div className="px-4 pb-4">
        <Link href="/ranking" className="flex items-center justify-center gap-2 rounded-md border border-amber-200 py-3 text-sm font-bold text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/30">
          명예의 전당 보러가기
        </Link>
      </div>
    </div>
  );
}
