export const runtime = 'edge';

import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { isAdminEmail } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient, hasServiceRoleConfig } from '@/lib/supabase/service';
import WebtoonSearchPicker from '@/components/WebtoonSearchPicker';
import ScoreBadge from '@/components/ScoreBadge';
import AdminBannerSection from '@/components/AdminBannerSection';
import {
  createCheerEvent,
  deleteReviewAsAdmin,
  suspendUserAsAdmin,
  updateTopNotice,
  updateBannerAd,
} from './actions';

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

type AdminProfileRow = {
  id: string;
  nickname: string;
  total_recommends?: number | null;
  is_suspended?: boolean | null;
  suspension_reason?: string | null;
  suspended_at?: string | null;
};

interface AdminProps {
  searchParams: Promise<{ msg?: string }>;
}

export default async function AdminPage({ searchParams }: AdminProps) {
  const { msg } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? '';

  if (!isAdminEmail(email)) redirect('/');

  type ReviewRow = {
    id: string;
    score?: number | null;
    comment: string | null;
    created_at?: string | null;
    profiles: { id?: string; nickname?: string } | null;
    webtoons: { title?: string } | null;
  };

  let reviews: ReviewRow[] = [];
  let profiles: AdminProfileRow[] = [];
  let notice: { value?: string } | null = null;
  let bannerImageUrl = '';
  let bannerLinkUrl = '';
  let bannerAltText = '';
  const reportedReviews: ReviewRow[] = [];
  const serviceConfigured = hasServiceRoleConfig();

  if (serviceConfigured) {
    try {
      const service = createServiceClient();
      const [reviewsResult, profilesResult, settingsResult, reportsResult] = await Promise.all([
        service
          .from('reviews')
          .select('id, user_id, score, comment, created_at, profiles(id, nickname), webtoons(title)')
          .order('created_at', { ascending: false })
          .limit(20),
        service
          .from('profiles')
          .select('id, nickname, is_suspended, suspension_reason, suspended_at, total_recommends')
          .order('created_at', { ascending: false })
          .limit(20),
        service.from('site_settings').select('key, value'),
        service
          .from('reports')
          .select('review_id, reviews(id, score, comment, created_at, profiles(id, nickname), webtoons(title))')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      profiles = profilesResult.data ?? [];
      if (profilesResult.error) {
        const fallback = await service.from('profiles').select('id, nickname, total_recommends').order('created_at', { ascending: false }).limit(20);
        profiles = fallback.data ?? [];
      }
      reviews = (reviewsResult.data ?? []) as ReviewRow[];
      notice = (settingsResult.data ?? []).find((s) => s.key === 'top_notice') ?? null;
      bannerImageUrl = (settingsResult.data ?? []).find((s) => s.key === 'banner_image_url')?.value ?? '';
      bannerLinkUrl = (settingsResult.data ?? []).find((s) => s.key === 'banner_link_url')?.value ?? '';
      bannerAltText = (settingsResult.data ?? []).find((s) => s.key === 'banner_alt_text')?.value ?? '';

      const seenIds = new Set<string>();
      for (const r of reportsResult.data ?? []) {
        const rv = (r as unknown as { reviews: ReviewRow | null }).reviews;
        if (rv && !seenIds.has(rv.id)) { seenIds.add(rv.id); reportedReviews.push(rv); }
      }
    } catch {
      reviews = [];
      profiles = [];
      notice = null;
    }
  }

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

      <main className="flex-1 space-y-4 px-4 py-4">
        {msg && (
          <div className={`rounded-md border px-3 py-2 text-sm font-semibold ${msg.includes('완료') ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'}`}>
            {msg}
          </div>
        )}
        {!serviceConfigured && (
          <section className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
            배포 환경에 <code>SUPABASE_SERVICE_ROLE_KEY</code>가 없어 관리자 실행 기능이 비활성화되어 있습니다.
          </section>
        )}

        <section className="rounded-md border border-gray-100 p-3 dark:border-gray-900">
          <h2 className="mb-3 text-sm font-bold">상단 공지글</h2>
          <form action={updateTopNotice} className="space-y-2">
            <textarea
              name="notice"
              defaultValue={notice?.value ?? ''}
              maxLength={120}
              rows={3}
              placeholder="홈 상단에 보여줄 공지"
              className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800"
            />
            <button className="rounded-md bg-gray-950 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-gray-950">
              공지 저장
            </button>
          </form>
        </section>

        <section className="rounded-md border border-gray-100 p-3 dark:border-gray-900">
          <h2 className="mb-3 text-sm font-bold">응원전 생성</h2>
          <form action={createCheerEvent} className="grid gap-2">
            <input name="title" placeholder="예: 화산귀환 vs 전독시" className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800" />
            <div className="grid grid-cols-2 gap-2">
              <input name="startsAt" type="datetime-local" className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800" />
              <input name="endsAt" type="datetime-local" className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800" />
            </div>
            <WebtoonSearchPicker name="webtoonIds" />
            <button className="rounded-md bg-gray-950 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-gray-950">
              응원전 만들기
            </button>
          </form>
        </section>

        {reportedReviews.length > 0 && (
          <section className="rounded-md border border-red-100 p-3 dark:border-red-950">
            <h2 className="mb-3 text-sm font-bold text-red-600 dark:text-red-400">신고된 게시물 ({reportedReviews.length})</h2>
            <div className="divide-y divide-gray-100 dark:divide-gray-900">
              {reportedReviews.map((review) => (
                <form key={review.id} action={deleteReviewAsAdmin} className="grid grid-cols-[1fr_auto] items-start gap-3 py-2">
                  <input type="hidden" name="reviewId" value={review.id} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <ScoreBadge score={typeof review.score === 'number' ? review.score : Number(review.score ?? 0)} size="sm" />
                      <p className="truncate text-sm font-bold">{review.webtoons?.title ?? '알 수 없음'}</p>
                    </div>
                    <p className="truncate text-xs text-gray-400">{review.profiles?.nickname ?? '익명'} · {review.comment || '한줄평 없음'}</p>
                  </div>
                  <button className="mt-1 shrink-0 rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-500">
                    삭제
                  </button>
                </form>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-md border border-gray-100 p-3 dark:border-gray-900">
          <h2 className="mb-1 text-sm font-bold">최근 한줄평 관리</h2>
          <p className="mb-3 text-xs text-gray-400">욕설·도배·허위 평점 등 문제 있는 게시물만 삭제하세요.</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-900">
            {reviews.map((review) => (
              <form key={review.id} action={deleteReviewAsAdmin} className="grid grid-cols-[1fr_auto] items-start gap-3 py-2">
                <input type="hidden" name="reviewId" value={review.id} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <ScoreBadge score={typeof review.score === 'number' ? review.score : Number(review.score ?? 0)} size="sm" />
                    <p className="truncate text-sm font-bold">{review.webtoons?.title ?? '알 수 없음'}</p>
                  </div>
                  <p className="truncate text-xs text-gray-400">
                    {review.profiles?.nickname ?? '익명'} · {review.comment || '한줄평 없음'} · {review.created_at?.slice(0,10) ?? ''}
                  </p>
                </div>
                <button className="mt-1 shrink-0 rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-500">
                  삭제
                </button>
              </form>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-gray-100 p-3 dark:border-gray-900">
          <h2 className="mb-3 text-sm font-bold">회원 관리</h2>
          <p className="mb-2 text-xs text-gray-400">닉네임 클릭 시 해당 회원이 남긴 댓글을 모두 볼 수 있습니다.</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-900">
            {profiles.map((profile) => (
              <form key={profile.id} action={suspendUserAsAdmin} className="grid gap-2 py-2">
                <input type="hidden" name="userId" value={profile.id} />
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold">{profile.nickname}</p>
                      {'is_suspended' in profile && profile.is_suspended && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500 dark:bg-red-950">정지됨</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-400">
                      {'is_suspended' in profile && profile.is_suspended
                        ? `사유: ${profile.suspension_reason ?? '없음'}`
                        : `추천 ${profile.total_recommends ?? 0}개`}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {reviews.filter((r) => r.profiles?.id === profile.id).map((r) => (
                        <span key={r.id} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-400 max-w-[200px] truncate" title={r.comment ?? ''}>
                          {r.webtoons?.title ?? '?'}: {r.comment ? r.comment.slice(0, 30) : '별점만'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="shrink-0 rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-500">
                    정지
                  </button>
                </div>
                <input name="reason" placeholder="정지 사유" className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-xs outline-none focus:border-amber-400 dark:border-gray-800" />
              </form>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-gray-100 p-3 dark:border-gray-900">
          <h2 className="mb-1 text-sm font-bold">배너 광고</h2>
          <p className="mb-3 text-xs text-gray-400">홈 상단에 광고 배너를 표시합니다. URL이 비어있으면 배너가 숨겨집니다.</p>
          <AdminBannerSection
            updateBannerAd={updateBannerAd}
            bannerImageUrl={bannerImageUrl}
            bannerLinkUrl={bannerLinkUrl}
            bannerAltText={bannerAltText}
          />
        </section>

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
