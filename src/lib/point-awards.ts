import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';

type AwardPointsInput = {
  userId: string;
  amount: number;
  reason: string;
  uniqueKey: string;
  metadata?: Record<string, unknown>;
};

export async function awardPoints({
  userId,
  amount,
  reason,
  uniqueKey,
  metadata = {},
}: AwardPointsInput): Promise<{ awarded: boolean; error?: string }> {
  if (!userId || !Number.isSafeInteger(amount) || amount <= 0 || !reason || !uniqueKey) {
    return { awarded: false, error: 'Invalid point award request' };
  }

  const service = createServiceClient();
  const { data, error } = await service.rpc('award_points', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_unique_key: uniqueKey,
    p_metadata: metadata,
  });

  if (error) {
    console.error('awardPoints failed', { reason, uniqueKey, error });
    return { awarded: false, error: error.message };
  }

  return { awarded: data === true };
}
