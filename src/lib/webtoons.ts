import { createClient } from '@/lib/supabase/server';
import { Webtoon, WebtoonWithStats, SortOption, ReviewWithProfile } from '@/types';

const VALID_PLATFORMS = ['naver', 'kakao', 'etc'];
const VALID_STATUSES = ['ongoing', 'completed'];

type WebtoonRowData = Webtoon & { reviews?: { score: number }[] };

function withStats(webtoon: WebtoonRowData): WebtoonWithStats {
  const scores = (webtoon.reviews ?? []).map((r) => Number(r.score));
  const avg_score = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;
  const { reviews: _reviews, ...rest } = webtoon;
  void _reviews;
  return {
    ...rest,
    avg_score,
    review_count: scores.length,
  };
}

function escapePostgrestPattern(value: string) {
  return value.replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function getWebtoons(
  sort: SortOption = 'score',
  platform?: string,
  status?: string,
): Promise<WebtoonWithStats[]> {
  const supabase = await createClient();

  let query = supabase.from('webtoons').select(`*, reviews(score)`);
  if (platform && VALID_PLATFORMS.includes(platform)) {
    query = query.eq('platform', platform);
  }
  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const webtoons = data.map((w) => withStats(w));

  if (sort === 'score') {
    return webtoons.sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0));
  } else if (sort === 'popular') {
    return webtoons.sort((a, b) => b.review_count - a.review_count);
  } else {
    return webtoons.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function getWebtoon(id: string): Promise<WebtoonWithStats | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webtoons')
    .select(`*, reviews(score)`)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return withStats(data);
}

export async function getReviewsByWebtoon(webtoonId: string): Promise<ReviewWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select(`*, profiles(nickname, total_recommends)`)
    .eq('webtoon_id', webtoonId)
    .order('recommend_count', { ascending: false });

  if (error || !data) return [];

  return data as ReviewWithProfile[];
}

export async function getUserReview(webtoonId: string, userId: string): Promise<ReviewWithProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select(`*, profiles(nickname, total_recommends)`)
    .eq('webtoon_id', webtoonId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as ReviewWithProfile;
}

export async function searchWebtoons(query: string): Promise<WebtoonWithStats[]> {
  const supabase = await createClient();
  const safeQuery = escapePostgrestPattern(query);
  if (!safeQuery) return [];

  const { data, error } = await supabase
    .from('webtoons')
    .select(`*, reviews(score)`)
    .or(`title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%`);

  if (error || !data) return [];

  return data.map((w) => withStats(w));
}
