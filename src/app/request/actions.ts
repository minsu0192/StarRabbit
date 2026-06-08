'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { containsPromoLink } from '@/lib/filter';

const PLATFORMS = new Set(['naver', 'kakao', 'ridi', 'etc']);

function clean(value: FormDataEntryValue | null) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export async function createWebtoonRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/?msg=' + encodeURIComponent('로그인이 필요합니다'));

  const title = clean(formData.get('title')).slice(0, 120);
  const author = clean(formData.get('author')).slice(0, 80);
  const platformInput = clean(formData.get('platform'));
  const platform = PLATFORMS.has(platformInput) ? platformInput : 'etc';
  const sourceUrl = clean(formData.get('sourceUrl')).slice(0, 500);
  const note = clean(formData.get('note')).slice(0, 300);

  if (!title) redirect('/request?msg=' + encodeURIComponent('작품 제목을 입력해주세요'));
  if (sourceUrl && containsPromoLink(sourceUrl) && !/^https?:\/\//.test(sourceUrl)) {
    redirect('/request?msg=' + encodeURIComponent('출처 URL을 확인해주세요'));
  }

  const { error } = await supabase.from('webtoon_requests').insert({
    requester_id: user.id,
    title,
    author,
    platform,
    source_url: sourceUrl || null,
    note: note || null,
  });

  if (error) {
    const message = error.message.includes('does not exist')
      ? 'webtoon_requests 테이블이 없습니다. Supabase SQL을 먼저 적용해주세요.'
      : error.message;
    redirect('/request?msg=' + encodeURIComponent(message));
  }

  revalidatePath('/request');
  redirect('/request?msg=' + encodeURIComponent('등록 신청이 접수되었습니다'));
}
