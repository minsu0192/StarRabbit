import { createClient } from '@/lib/supabase/server';
import { Webtoon, WebtoonSource, WebtoonWithStats, SortOption, ReviewWithProfile } from '@/types';

const VALID_PLATFORMS = ['naver', 'kakao', 'ridi', 'etc'];
const VALID_STATUSES = ['ongoing', 'completed'];
const DEFAULT_LIST_LIMIT = 100;
const VALID_LIST_LIMITS = [50, 100, 200];
const SEARCH_LIMIT = 80;
const INITIAL_RANGES: Record<string, [string, string | null]> = {
  'ㄱ': ['가', '나'],
  'ㄴ': ['나', '다'],
  'ㄷ': ['다', '라'],
  'ㄹ': ['라', '마'],
  'ㅁ': ['마', '바'],
  'ㅂ': ['바', '사'],
  'ㅅ': ['사', '아'],
  'ㅇ': ['아', '자'],
  'ㅈ': ['자', '차'],
  'ㅊ': ['차', '카'],
  'ㅋ': ['카', '타'],
  'ㅌ': ['타', '파'],
  'ㅍ': ['파', '하'],
  'ㅎ': ['하', null],
};

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

function normalizeListLimit(limit?: number) {
  return VALID_LIST_LIMITS.includes(Number(limit)) ? Number(limit) : DEFAULT_LIST_LIMIT;
}

function applyInitialFilter<T extends { gte: (column: string, value: string) => T; lt: (column: string, value: string) => T }>(
  query: T,
  initial?: string,
) {
  const range = initial ? INITIAL_RANGES[initial] : null;
  if (!range) return query;
  query = query.gte('title', range[0]);
  return range[1] ? query.lt('title', range[1]) : query;
}

export async function getWebtoons(
  sort: SortOption = 'score',
  platform?: string,
  status?: string,
  page = 1,
  limit?: number,
  initial?: string,
): Promise<{ items: WebtoonWithStats[]; total: number; page: number; limit: number }> {
  const supabase = await createClient();
  const safeLimit = normalizeListLimit(limit);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase
    .from('webtoons')
    .select(platform && VALID_PLATFORMS.includes(platform)
      ? `*, reviews(score), webtoon_sources!inner(*)`
      : `*, reviews(score), webtoon_sources(*)`, { count: 'exact' });

  if (platform && VALID_PLATFORMS.includes(platform)) {
    query = query.eq('webtoon_sources.platform', platform);
  }

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('status', status);
  }
  query = applyInitialFilter(query, initial);

  if (sort === 'latest') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('title', { ascending: true });
  }

  query = query.range(from, to);

  let { data, error } = await query;
  let total = 0;

  if (!error) {
    let countQuery = supabase
      .from('webtoons')
      .select(platform && VALID_PLATFORMS.includes(platform) ? `id, webtoon_sources!inner(*)` : 'id', {
        count: 'exact',
        head: true,
      });

    if (platform && VALID_PLATFORMS.includes(platform)) {
      countQuery = countQuery.eq('webtoon_sources.platform', platform);
    }
    if (status && VALID_STATUSES.includes(status)) {
      countQuery = countQuery.eq('status', status);
    }
    countQuery = applyInitialFilter(countQuery, initial);

    const { count } = await countQuery;
    total = count ?? data?.length ?? 0;
  }

  if (error?.message?.includes('webtoon_sources')) {
    let fallbackQuery = supabase.from('webtoons').select(`*, reviews(score)`);
    if (status && VALID_STATUSES.includes(status)) {
      fallbackQuery = fallbackQuery.eq('status', status);
    }
    fallbackQuery = applyInitialFilter(fallbackQuery, initial);
    fallbackQuery = fallbackQuery
      .order(sort === 'latest' ? 'created_at' : 'title', { ascending: sort !== 'latest' })
      .range(from, to);
    const fallback = await fallbackQuery;
    data = fallback.data;
    error = fallback.error;

    let fallbackCount = supabase.from('webtoons').select('id', { count: 'exact', head: true });
    if (status && VALID_STATUSES.includes(status)) {
      fallbackCount = fallbackCount.eq('status', status);
    }
    fallbackCount = applyInitialFilter(fallbackCount, initial);
    const { count } = await fallbackCount;
    total = count ?? data?.length ?? 0;
  }

  if (error || !data) return { items: [], total: 0, page: safePage, limit: safeLimit };

  let webtoons = data.map((w) => withStats(w));

  if (platform && VALID_PLATFORMS.includes(platform)) {
    webtoons = webtoons.filter((webtoon) => webtoon.sources.some((source) => source.platform === platform));
  }

  if (sort === 'score') {
    webtoons = webtoons.sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0));
  } else if (sort === 'popular') {
    webtoons = webtoons.sort((a, b) => b.review_count - a.review_count);
  } else {
    webtoons = webtoons.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return { items: webtoons, total, page: safePage, limit: safeLimit };
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

  const byId = new Map<string, WebtoonWithStats>();
  for (const row of data.map((w) => withStats(w))) byId.set(row.id, row);

  const { data: sourceMatches } = await supabase
    .from('webtoon_sources')
    .select('webtoon_id')
    .or(`title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%`)
    .limit(SEARCH_LIMIT);

  const missingIds = [...new Set((sourceMatches ?? []).map((row) => row.webtoon_id))]
    .filter((id) => !byId.has(id))
    .slice(0, SEARCH_LIMIT);

  if (missingIds.length > 0) {
    const { data: sourceWebtoons } = await supabase
      .from('webtoons')
      .select(`*, reviews(score), webtoon_sources(*)`)
      .in('id', missingIds)
      .limit(SEARCH_LIMIT);

    for (const row of sourceWebtoons ?? []) {
      const webtoon = withStats(row);
      byId.set(webtoon.id, webtoon);
    }
  }

  return [...byId.values()]
    .sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    .slice(0, SEARCH_LIMIT);
}
