import { createClient } from '@/lib/supabase/server';
import { Webtoon, WebtoonSource, WebtoonWithStats, SortOption, ReviewWithProfile } from '@/types';

const VALID_PLATFORMS = ['naver', 'kakao', 'ridi', 'lezhin', 'bomtoon', 'toomics', 'etc'];
const VALID_STATUSES = ['ongoing', 'completed'];
const LIST_LIMIT = 120;
const SEARCH_LIMIT = 80;

type WebtoonRowData = Webtoon & {
  reviews?: { score: number }[];
  webtoon_sources?: WebtoonSource[];
};
type ReviewRowData = Omit<ReviewWithProfile, 'score'> & { score: number | string };

function withStats(webtoon: WebtoonRowData): WebtoonWithStats {
  const scores = (webtoon.reviews ?? []).map((r) => Number(r.score));
  const avg_score = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;
  const { reviews: _reviews, webtoon_sources: webtoonSources, ...rest } = webtoon;
  void _reviews;
  const fallbackSource: WebtoonSource = {
    id: `${webtoon.id}-${webtoon.platform}`,
    webtoon_id: webtoon.id,
    platform: webtoon.platform,
    external_id: null,
    source_url: null,
    title: webtoon.title,
    author: webtoon.author,
    status: webtoon.status,
    genre: webtoon.genre,
    last_seen_at: webtoon.created_at,
    source_checked_at: null,
  };

  return {
    ...rest,
    avg_score,
    review_count: scores.length,
    sources: webtoonSources?.length ? webtoonSources : [fallbackSource],
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

  let query = supabase
    .from('webtoons')
    .select(platform && VALID_PLATFORMS.includes(platform)
      ? `*, reviews(score), webtoon_sources!inner(*)`
      : `*, reviews(score), webtoon_sources(*)`);

  if (platform && VALID_PLATFORMS.includes(platform)) {
    query = query.eq('webtoon_sources.platform', platform);
  }

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('status', status);
  }

  if (sort === 'latest') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('title', { ascending: true });
  }

  query = query.limit(LIST_LIMIT);

  let { data, error } = await query;

  if (error?.message?.includes('webtoon_sources')) {
    let fallbackQuery = supabase.from('webtoons').select(`*, reviews(score)`);
    if (status && VALID_STATUSES.includes(status)) {
      fallbackQuery = fallbackQuery.eq('status', status);
    }
    fallbackQuery = fallbackQuery
      .order(sort === 'latest' ? 'created_at' : 'title', { ascending: sort !== 'latest' })
      .limit(LIST_LIMIT);
    const fallback = await fallbackQuery;
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) return [];

  let webtoons = data.map((w) => withStats(w));

  if (platform && VALID_PLATFORMS.includes(platform)) {
    webtoons = webtoons.filter((webtoon) => webtoon.sources.some((source) => source.platform === platform));
  }

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
    .select(`*, reviews(score), webtoon_sources(*)`)
    .eq('id', id)
    .single();

  if (error?.message?.includes('webtoon_sources')) {
    const fallback = await supabase
      .from('webtoons')
      .select(`*, reviews(score)`)
      .eq('id', id)
      .single();
    if (fallback.error || !fallback.data) return null;
    return withStats(fallback.data);
  }

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

  return (data as ReviewRowData[]).map((review) => ({
    ...review,
    score: Number(review.score),
  }));
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
  const review = data as ReviewRowData;
  return {
    ...review,
    score: Number(review.score),
  };
}

export async function searchWebtoons(query: string): Promise<WebtoonWithStats[]> {
  const supabase = await createClient();
  const safeQuery = escapePostgrestPattern(query);
  if (!safeQuery) return [];

  const { data, error } = await supabase
    .from('webtoons')
    .select(`*, reviews(score), webtoon_sources(*)`)
    .or(`title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%`)
    .order('title', { ascending: true })
    .limit(SEARCH_LIMIT);

  if (error?.message?.includes('webtoon_sources')) {
    const fallback = await supabase
      .from('webtoons')
      .select(`*, reviews(score)`)
      .or(`title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%`)
      .order('title', { ascending: true })
      .limit(SEARCH_LIMIT);
    if (fallback.error || !fallback.data) return [];
    return fallback.data.map((w) => withStats(w));
  }

  if (error || !data) return [];

  return data.map((w) => withStats(w));
}
