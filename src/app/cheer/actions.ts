'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { containsProfanity, containsPromoLink } from '@/lib/filter';

function clean(value: FormDataEntryValue | null) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  return { supabase, user };
}

export async function submitCheerComment(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const eventId = clean(formData.get('eventId'));
  const webtoonId = clean(formData.get('webtoonId'));
  const comment = clean(formData.get('comment')).slice(0, 300);
  if (!eventId || !webtoonId || comment.length < 2) return;
  if (containsProfanity(comment) || containsPromoLink(comment)) return;

  const { data: event } = await supabase
    .from('cheer_events')
    .select('id, starts_at, ends_at, status')
    .eq('id', eventId)
    .single();
  const now = Date.now();
  const isOpen = event
    && event.status !== 'cancelled'
    && event.status !== 'settled'
    && (event.status === 'active' || new Date(event.starts_at).getTime() <= now)
    && new Date(event.ends_at).getTime() >= now;
  if (!isOpen) return;

  const { data: entry } = await supabase
    .from('cheer_entries')
    .select('id')
    .eq('event_id', eventId)
    .eq('webtoon_id', webtoonId)
    .maybeSingle();
  if (!entry) return;

  const { error } = await supabase.from('cheer_comments').upsert(
    { event_id: eventId, webtoon_id: webtoonId, user_id: user.id, comment },
    { onConflict: 'event_id,user_id' },
  );
  if (!error) {
    await supabase.rpc('award_points', {
      p_user_id: user.id,
      p_amount: 50,
      p_reason: '응원전 참여',
      p_unique_key: `cheer:${eventId}:${user.id}`,
      p_metadata: { event_id: eventId, webtoon_id: webtoonId },
    });
  }

  revalidatePath('/cheer');
}

export async function recommendCheerComment(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const commentId = clean(formData.get('commentId'));
  if (!commentId) return;

  const { data: comment } = await supabase
    .from('cheer_comments')
    .select('id, user_id')
    .eq('id', commentId)
    .single();
  if (!comment || comment.user_id === user.id) return;

  await supabase
    .from('cheer_comment_recommends')
    .insert({ cheer_comment_id: commentId, user_id: user.id });

  revalidatePath('/cheer');
}
