'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function purchaseItem(formData: FormData) {
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect('/shop?err=login');

  const { data: result, error } = await supabase.rpc('spend_points', { p_user_id: user.id, p_item_id: itemId });

  if (error) redirect(`/shop?err=db&msg=${encodeURIComponent(error.message)}`);

  revalidatePath('/shop');
  revalidatePath('/profile');

  if (result === 'ok') redirect('/shop?ok=1');
  redirect(`/shop?err=${result ?? 'unknown'}`);
}

export async function equipItem(formData: FormData) {
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  // 같은 타입의 다른 아이템 모두 해제
  const { data: item } = await supabase
    .from('shop_items').select('type').eq('id', itemId).single();
  if (!item) return;

  const { data: owned } = await supabase
    .from('user_items').select('item_id').eq('user_id', user.id);
  const ownedIds = (owned ?? []).map((o) => o.item_id);

  if (ownedIds.length > 0) {
    const { data: sameType } = await supabase
      .from('shop_items').select('id').eq('type', item.type).in('id', ownedIds);
    const sameTypeIds = (sameType ?? []).map((s) => s.id);
    if (sameTypeIds.length > 0) {
      await supabase.from('user_items')
        .update({ is_equipped: false })
        .eq('user_id', user.id)
        .in('item_id', sameTypeIds);
    }
  }

  await supabase.from('user_items')
    .update({ is_equipped: true })
    .eq('user_id', user.id)
    .eq('item_id', itemId);

  revalidatePath('/shop');
  revalidatePath('/profile');
}

export async function unequipItem(formData: FormData) {
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase.from('user_items')
    .update({ is_equipped: false })
    .eq('user_id', user.id)
    .eq('item_id', itemId);

  revalidatePath('/shop');
  revalidatePath('/profile');
}

export async function equipTitle(formData: FormData) {
  const titleId = String(formData.get('titleId') ?? '');
  if (!titleId) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase.rpc('equip_title', { p_user_id: user.id, p_title_id: titleId });

  revalidatePath('/profile');
}

export async function unequipTitle(formData: FormData) {
  const titleId = String(formData.get('titleId') ?? '');
  if (!titleId) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase.from('user_titles')
    .update({ is_equipped: false })
    .eq('user_id', user.id)
    .eq('title_id', titleId);

  revalidatePath('/profile');
}
