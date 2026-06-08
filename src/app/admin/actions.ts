'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient, hasServiceRoleConfig } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) throw new Error('관리자 권한이 없습니다');
  if (!user) throw new Error('로그인이 필요합니다');
  return user;
}

function nonEmpty(value: FormDataEntryValue | null) {
  return String(value ?? '').trim();
}

function requireServiceRole() {
  if (!hasServiceRoleConfig()) {
    throw new Error('배포 환경에 SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않습니다');
  }
  return createServiceClient();
}

export async function updateTopNotice(formData: FormData) {
  const user = await requireAdmin();
  const service = requireServiceRole();
  const notice = nonEmpty(formData.get('notice')).slice(0, 500);

  const { error } = await service
    .from('site_settings')
    .upsert({
      key: 'top_notice',
      value: notice,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteReviewAsAdmin(formData: FormData) {
  await requireAdmin();
  const service = requireServiceRole();
  const reviewId = nonEmpty(formData.get('reviewId'));
  if (!reviewId) throw new Error('삭제할 게시물이 없습니다');

  const { error } = await service
    .from('reviews')
    .delete()
    .eq('id', reviewId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
}

export async function suspendUserAsAdmin(formData: FormData) {
  await requireAdmin();
  const service = requireServiceRole();
  const userId = nonEmpty(formData.get('userId'));
  const reason = nonEmpty(formData.get('reason')) || '운영 정책 위반';
  if (!userId) throw new Error('정지할 유저가 없습니다');

  const { error } = await service
    .from('profiles')
    .update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspension_reason: reason.slice(0, 120),
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);

  await service.auth.admin.updateUserById(userId, { ban_duration: '876000h' }).catch(() => null);
  revalidatePath('/admin');
}

export async function updateBannerAd(formData: FormData) {
  const user = await requireAdmin();
  const service = requireServiceRole();
  const imageUrl = nonEmpty(formData.get('imageUrl')).slice(0, 500);
  const linkUrl = nonEmpty(formData.get('linkUrl')).slice(0, 500);
  const altText = nonEmpty(formData.get('altText')).slice(0, 100);

  const { error } = await service.from('site_settings').upsert([
    { key: 'banner_image_url', value: imageUrl, updated_by: user.id, updated_at: new Date().toISOString() },
    { key: 'banner_link_url', value: linkUrl, updated_by: user.id, updated_at: new Date().toISOString() },
    { key: 'banner_alt_text', value: altText || '광고', updated_by: user.id, updated_at: new Date().toISOString() },
  ]);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function createCheerEvent(formData: FormData) {
  await requireAdmin();
  const service = requireServiceRole();
  const title = nonEmpty(formData.get('title'));
  const startsAt = nonEmpty(formData.get('startsAt'));
  const endsAt = nonEmpty(formData.get('endsAt'));
  const webtoonIds = nonEmpty(formData.get('webtoonIds'))
    .split(/[,\n]/)
    .map((id) => id.trim())
    .filter(Boolean);

  if (!title || !startsAt || !endsAt || webtoonIds.length < 2) {
    redirect('/admin?msg=' + encodeURIComponent('제목, 시작/종료일, 최소 2개 작품이 필요합니다'));
  }

  const { data: event, error } = await service
    .from('cheer_events')
    .insert({
      title,
      status: 'scheduled',
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    const hint = error.message.includes('does not exist')
      ? 'cheer_events 테이블이 없습니다. Supabase에서 add-cheer-points.sql을 실행하세요.'
      : error.message;
    redirect('/admin?msg=' + encodeURIComponent(hint));
  }

  const { error: entryError } = await service
    .from('cheer_entries')
    .insert(webtoonIds.map((webtoonId) => ({ event_id: event!.id, webtoon_id: webtoonId })));

  if (entryError) {
    redirect('/admin?msg=' + encodeURIComponent(entryError.message));
  }

  revalidatePath('/admin');
  revalidatePath('/cheer');
  redirect('/admin?msg=' + encodeURIComponent(`응원전 "${title}" 생성 완료!`));
}

export async function approveWebtoonRequest(formData: FormData) {
  const user = await requireAdmin();
  const service = requireServiceRole();
  const requestId = nonEmpty(formData.get('requestId'));
  if (!requestId) throw new Error('승인할 신청이 없습니다');

  const { data: request, error: requestError } = await service
    .from('webtoon_requests')
    .select('id, title, author, platform, source_url, status')
    .eq('id', requestId)
    .single();
  if (requestError || !request) throw new Error(requestError?.message ?? '신청을 찾을 수 없습니다');
  if (request.status !== 'pending') redirect('/admin?msg=' + encodeURIComponent('이미 처리된 신청입니다'));

  const author = nonEmpty(request.author) || '미상';
  const { data: webtoon, error: webtoonError } = await service
    .from('webtoons')
    .insert({
      title: request.title,
      author,
      platform: request.platform,
      status: 'ongoing',
    })
    .select('id')
    .single();
  if (webtoonError || !webtoon) {
    redirect('/admin?msg=' + encodeURIComponent(webtoonError?.message ?? '웹툰 등록에 실패했습니다'));
  }

  await service.from('webtoon_sources').insert({
    webtoon_id: webtoon.id,
    platform: request.platform,
    external_id: null,
    source_url: request.source_url || null,
    title: request.title,
    author,
    status: 'ongoing',
  });

  const { error } = await service
    .from('webtoon_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      created_webtoon_id: webtoon.id,
    })
    .eq('id', requestId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
  revalidatePath('/request');
  revalidatePath('/');
  redirect('/admin?msg=' + encodeURIComponent(`"${request.title}" 등록 승인 완료`));
}

export async function rejectWebtoonRequest(formData: FormData) {
  const user = await requireAdmin();
  const service = requireServiceRole();
  const requestId = nonEmpty(formData.get('requestId'));
  if (!requestId) throw new Error('반려할 신청이 없습니다');

  const { error } = await service
    .from('webtoon_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending');
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
  revalidatePath('/request');
  redirect('/admin?msg=' + encodeURIComponent('등록 신청을 반려했습니다'));
}
