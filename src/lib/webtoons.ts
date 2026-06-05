import { createClient } from '@/lib/supabase/server';
import { Webtoon, WebtoonSource, WebtoonWithStats, SortOption, ReviewWithProfile } from '@/types';

const VALID_PLATFORMS = ['naver', 'kakao', 'ridi', 'etc'];
const VALID_STATUSES = ['ongoing', 'completed'];
const VALID_AUDIENCES = ['general', 'all'];
const VALID_GENRES = ['로맨스', '드라마', '판타지', '액션', '무협', '학원', '일상', '개그', '스릴러', '공포', '스포츠'];
const DEFAULT_LIST_LIMIT = 100;
const VALID_LIST_LIMITS = [50, 100, 200];
const SEARCH_LIMIT = 80;
const LIST_CANDIDATE_LIMIT = 1000;
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
  reviews?: { score: number; created_at?: string; comment?: string | null }[];
  webtoon_sources?: WebtoonSource[];
};
type ReviewRowData = Omit<ReviewWithProfile, 'score'> & { score: number | string };

function withStats(webtoon: WebtoonRowData): WebtoonWithStats {
  const scores = (webtoon.reviews ?? []).map((r) => Number(r.score));
  const low_score_count = scores.filter((score) => score >= 1 && score <= 4).length;
  const high_score_count = scores.filter((score) => score >= 8 && score <= 10).length;
  const one_score_count = scores.filter((score) => score === 1).length;
  const ten_score_count = scores.filter((score) => score === 10).length;
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyScores = (webtoon.reviews ?? [])
    .filter((r) => r.created_at && new Date(r.created_at).getTime() >= weekStart)
    .map((r) => Number(r.score));
  const weekly_comment_count = (webtoon.reviews ?? []).filter(
    (r) => r.created_at && new Date(r.created_at).getTime() >= weekStart && String(r.comment ?? '').trim().length > 0
  ).length;
  const avg_score = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;
  const weekly_avg_score = weeklyScores.length > 0
    ? Math.round((weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length) * 10) / 10
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
    weekly_avg_score,
    weekly_review_count: weeklyScores.length,
    weekly_comment_count,
    low_score_count,
    high_score_count,
    one_score_count,
    ten_score_count,
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

function isBlGlWebtoon(webtoon: WebtoonWithStats) {
  const value = [
    webtoon.title,
    webtoon.genre,
    ...webtoon.sources.flatMap((source) => [source.title, source.genre]),
  ].filter(Boolean).join(' ').toLowerCase();
  return /(^|[^a-z])(?:bl|gl)([^a-z]|$)|비엘|백합/.test(value);
}

function sourceWeight(webtoon: WebtoonWithStats) {
  const platforms = new Set(webtoon.sources.map((source) => source.platform));
  return (
    (platforms.has('naver') ? 40 : 0) +
    (platforms.has('kakao') ? 24 : 0) +
    (platforms.has('ridi') ? 8 : 0) +
    Math.max(platforms.size - 1, 0) * 12
  );
}

function featuredScore(webtoon: WebtoonWithStats) {
  return sourceWeight(webtoon) + webtoon.review_count * 8 + (webtoon.avg_score ?? 0);
}

function sortWebtoons(items: WebtoonWithStats[], sort: SortOption) {
  const byTitle = (a: WebtoonWithStats, b: WebtoonWithStats) => a.title.localeCompare(b.title, 'ko');

  return [...items].sort((a, b) => {
    if (sort === 'score') {
      return (b.avg_score ?? -1) - (a.avg_score ?? -1) || b.review_count - a.review_count || byTitle(a, b);
    }
    if (sort === 'popular') {
      return b.review_count - a.review_count || (b.avg_score ?? -1) - (a.avg_score ?? -1) || featuredScore(b) - featuredScore(a) || byTitle(a, b);
    }
    if (sort === 'weekly_score') {
      return (b.weekly_avg_score ?? -1) - (a.weekly_avg_score ?? -1) || b.weekly_review_count - a.weekly_review_count || byTitle(a, b);
    }
    if (sort === 'weekly_comments') {
      return b.weekly_comment_count - a.weekly_comment_count || b.weekly_review_count - a.weekly_review_count || (b.weekly_avg_score ?? -1) - (a.weekly_avg_score ?? -1) || byTitle(a, b);
    }
    if (sort === 'latest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sort === 'title') {
      return byTitle(a, b);
    }
    return featuredScore(b) - featuredScore(a) || byTitle(a, b);
  });
}

export async function getWebtoons(
  sort: SortOption = 'featured',
  platform?: string,
  status?: string,
  page = 1,
  limit?: number,
  initial?: string,
  genre?: string,
  audience: string = 'general',
): Promise<{ items: WebtoonWithStats[]; total: number; page: number; limit: number }> {
  const supabase = await createClient();
  const safeLimit = normalizeListLimit(limit);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase
    .from('webtoons')
    .select(platform && VALID_PLATFORMS.includes(platform)
      ? `*, reviews(score, created_at, comment), webtoon_sources!inner(*)`
      : `*, reviews(score, created_at, comment), webtoon_sources(*)`, { count: 'exact' });

  if (platform && VALID_PLATFORMS.includes(platform)) {
    query = query.eq('webtoon_sources.platform', platform);
  }

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('status', status);
  }
  if (genre && VALID_GENRES.includes(genre)) {
    query = query.eq('genre', genre);
  }
  query = applyInitialFilter(query, initial);

  query = query.order(sort === 'latest' ? 'created_at' : 'title', { ascending: sort !== 'latest' });

  const needsClientSort = ['featured', 'score', 'popular', 'weekly_score', 'weekly_comments'].includes(sort);
  query = needsClientSort ? query.range(0, LIST_CANDIDATE_LIMIT - 1) : query.range(from, to);

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
    if (genre && VALID_GENRES.includes(genre)) {
      countQuery = countQuery.eq('genre', genre);
    }
    countQuery = applyInitialFilter(countQuery, initial);

    const { count } = await countQuery;
    total = count ?? data?.length ?? 0;
  }

  if (error?.message?.includes('webtoon_sources')) {
    let fallbackQuery = supabase.from('webtoons').select(`*, reviews(score, created_at, comment)`);
    if (status && VALID_STATUSES.includes(status)) {
      fallbackQuery = fallbackQuery.eq('status', status);
    }
    if (genre && VALID_GENRES.includes(genre)) {
      fallbackQuery = fallbackQuery.eq('genre', genre);
    }
    fallbackQuery = applyInitialFilter(fallbackQuery, initial);
    fallbackQuery = fallbackQuery
      .order(sort === 'latest' ? 'created_at' : 'title', { ascending: sort !== 'latest' })
      .range(needsClientSort ? 0 : from, needsClientSort ? LIST_CANDIDATE_LIMIT - 1 : to);
    const fallback = await fallbackQuery;
    data = fallback.data;
    error = fallback.error;

    let fallbackCount = supabase.from('webtoons').select('id', { count: 'exact', head: true });
    if (status && VALID_STATUSES.includes(status)) {
      fallbackCount = fallbackCount.eq('status', status);
    }
    if (genre && VALID_GENRES.includes(genre)) {
      fallbackCount = fallbackCount.eq('genre', genre);
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

  if (!VALID_AUDIENCES.includes(audience) || audience === 'general') {
    webtoons = webtoons.filter((webtoon) => !isBlGlWebtoon(webtoon));
  }

  const sorted = sortWebtoons(webtoons, sort);
  const pageItems = needsClientSort ? sorted.slice(from, to + 1) : sorted;

  return { items: pageItems, total: audience === 'all' ? total : sorted.length, page: safePage, limit: safeLimit };
}

export async function getWebtoon(id: string): Promise<WebtoonWithStats | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webtoons')
    .select(`*, reviews(score, created_at, comment), webtoon_sources(*)`)
    .eq('id', id)
    .single();

  if (error?.message?.includes('webtoon_sources')) {
    const fallback = await supabase
      .from('webtoons')
      .select(`*, reviews(score, created_at, comment)`)
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
    .select(`*, reviews(score, created_at, comment), webtoon_sources(*)`)
    .or(`title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%`)
    .order('title', { ascending: true })
    .limit(SEARCH_LIMIT);

  if (error?.message?.includes('webtoon_sources')) {
    const fallback = await supabase
      .from('webtoons')
      .select(`*, reviews(score, created_at, comment)`)
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
      .select(`*, reviews(score, created_at, comment), webtoon_sources(*)`)
      .in('id', missingIds)
      .limit(SEARCH_LIMIT);

    for (const row of sourceWebtoons ?? []) {
      const webtoon = withStats(row);
      byId.set(webtoon.id, webtoon);
    }
  }

  return [...byId.values()]
    .filter((webtoon) => !isBlGlWebtoon(webtoon))
    .sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    .slice(0, SEARCH_LIMIT);
}
