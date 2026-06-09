'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function getReturnPath(formData: FormData) {
  return formData.get('returnTo') === '/profile' ? '/profile' : '/shop';
}

function redirectWithError(path: string, error: string): never {
  const separator = path.includes('?') ? '&' : '?';
  redirect(`${path}${separator}err=${encodeURIComponent(error)}`);
}

export async function purchaseItem(formData: FormData) {
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect('/shop?err=login');

  const { data: result, error } = await supabase.rpc('spend_points', { p_user_id: user.id, p_item_id: itemId });

  if (error) redirect(`/shop?err=db&msg=${encodeURIComponent(error.message)}`);

  if (result === 'ok') redirect('/shop?ok=1');
  redirect(`/shop?err=${result ?? 'unknown'}`);
}

export async function equipItem(formData: FormData) {
  const itemId = String(formData.get('itemId') ?? '');
  const returnTo = getReturnPath(formData);
  if (!itemId) return;

  const { supabase, user } = await requireUser();
  if (!user) redirectWithError(returnTo, 'login');

  const { data: result, error } = await supabase.rpc('equip_shop_item', {
    p_user_id: user.id,
    p_item_id: itemId,
  });
  if (error) redirectWithError(returnTo, 'db');
  if (result !== 'ok') redirectWithError(returnTo, result ?? 'unknown');

  redirect(returnTo);
}

export async function unequipItem(formData: FormData) {
  const itemId = String(formData.get('itemId') ?? '');
  const returnTo = getReturnPath(formData);
  if (!itemId) return;

  const { supabase, user } = await requireUser();
  if (!user) redirectWithError(returnTo, 'login');

  const { data: result, error } = await supabase.rpc('unequip_shop_item', {
    p_user_id: user.id,
    p_item_id: itemId,
  });
  if (error) redirectWithError(returnTo, 'db');
  if (result !== 'ok') redirectWithError(returnTo, result ?? 'unknown');

  redirect(returnTo);
}

export async function equipTitle(formData: FormData) {
  const titleId = String(formData.get('titleId') ?? '');
  if (!titleId) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect('/');

  const { data: result, error } = await supabase.rpc('equip_title', { p_user_id: user.id, p_title_id: titleId });
  if (error || result !== 'ok') redirect('/profile?err=title');

  redirect('/profile');
}

export async function unequipTitle(formData: FormData) {
  const titleId = String(formData.get('titleId') ?? '');
  if (!titleId) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect('/');

  const { data: result, error } = await supabase.rpc('unequip_title', {
    p_user_id: user.id,
    p_title_id: titleId,
  });
  if (error || result !== 'ok') redirect('/profile?err=title');

  redirect('/profile');
}
