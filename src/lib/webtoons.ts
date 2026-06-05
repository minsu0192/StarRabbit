import { createClient } from '@/lib/supabase/server';
import { Webtoon, WebtoonSource, WebtoonWithStats, SortOption, ReviewWithProfile, Origin } from '@/types';

const VALID_PLATFORMS = ['naver', 'kakao', 'ridi', 'etc'];
const VALID_STATUSES = ['ongoing', 'completed'];
const VALID_ORIGINS = ['korea', 'japan', 'china', 'unknown'];
const VALID_GENRES = ['로맨스', '드라마', '판타지', '액션', '무협', '학원', '일상', '개그', '스릴러', '공포', '스포츠'];
const DEFAULT_LIST_LIMIT = 20;
const VALID_LIST_LIMITS = [10, 20, 50, 100];
const SEARCH_LIMIT = 80;
const LIST_CANDIDATE_LIMIT = 7000;
const VALID_SORTS: SortOption[] = ['featured', 'score', 'popular', 'daily_score', 'daily_popular', 'weekly_score', 'weekly_comments', 'monthly_score', 'monthly_popular', 'yearly_score', 'yearly_popular', 'latest'];
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
  const now = Date.now();
  const dayStart = now - 24 * 60 * 60 * 1000;
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  const monthStart = now - 30 * 24 * 60 * 60 * 1000;
  const yearStart = now - 365 * 24 * 60 * 60 * 1000;

  const dailyScores = (webtoon.reviews ?? [])
    .filter((r) => r.created_at && new Date(r.created_at).getTime() >= dayStart)
    .map((r) => Number(r.score));

  const weeklyScores = (webtoon.reviews ?? [])
    .filter((r) => r.created_at && new Date(r.created_at).getTime() >= weekStart)
    .map((r) => Number(r.score));
  const weekly_comment_count = (webtoon.reviews ?? []).filter(
    (r) => r.created_at && new Date(r.created_at).getTime() >= weekStart && String(r.comment ?? '').trim().length > 0
  ).length;

  const monthlyScores = (webtoon.reviews ?? [])
    .filter((r) => r.created_at && new Date(r.created_at).getTime() >= monthStart)
    .map((r) => Number(r.score));
  const yearlyScores = (webtoon.reviews ?? [])
    .filter((r) => r.created_at && new Date(r.created_at).getTime() >= yearStart)
    .map((r) => Number(r.score));
  const avg_score = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;
  const daily_avg_score = dailyScores.length > 0
    ? Math.round((dailyScores.reduce((a, b) => a + b, 0) / dailyScores.length) * 10) / 10
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
  const sources = webtoonSources?.length ? webtoonSources : [fallbackSource];

  const monthly_avg_score = monthlyScores.length > 0
    ? Math.round((monthlyScores.reduce((a, b) => a + b, 0) / monthlyScores.length) * 10) / 10
    : null;
  const yearly_avg_score = yearlyScores.length > 0
    ? Math.round((yearlyScores.reduce((a, b) => a + b, 0) / yearlyScores.length) * 10) / 10
    : null;

  return {
    ...rest,
    avg_score,
    review_count: scores.length,
    daily_avg_score,
    daily_review_count: dailyScores.length,
    weekly_avg_score,
    weekly_review_count: weeklyScores.length,
    weekly_comment_count,
    monthly_avg_score,
    monthly_review_count: monthlyScores.length,
    yearly_avg_score,
    yearly_review_count: yearlyScores.length,
    low_score_count,
    high_score_count,
    one_score_count,
    ten_score_count,
    origin: inferOrigin({ ...webtoon, sources }),
    sources,
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

function inferOrigin(webtoon: Webtoon & { sources: WebtoonSource[] }): Origin {
  const platforms = new Set(webtoon.sources.map((source) => source.platform));
  const value = [
    webtoon.title,
    webtoon.author,
    webtoon.genre,
    ...webtoon.sources.flatMap((source) => [source.title, source.author, source.genre]),
  ].filter(Boolean).join(' ').toLowerCase();

  if (platforms.has('naver')) return 'korea';
  if (/중국|중화|대륙|무협만화|텐센트|콰이칸|kuaikan|bilibili|빌리빌리/.test(value)) return 'china';
  if (/일본|일본판|코믹스|망가|만화판|슈에이샤|카도카와|고단샤|소학관|shueisha|kadokawa|kodansha|shogakukan|라르고|인디고|볼레로|페어리|from red|ihertz/.test(value)) return 'japan';
  if (webtoon.platform === 'kakao' || webtoon.platform === 'ridi') return 'korea';
  return 'unknown';
}

function platformTier(webtoon: WebtoonWithStats): number {
  const platforms = new Set(webtoon.sources.map((s) => s.platform));
  if (platforms.has('naver')) return 3;
  if (platforms.has('kakao')) return 2;
  if (platforms.has('ridi')) return 1;
  return 0;
}

function featuredScore(webtoon: WebtoonWithStats) {
  // 리뷰 있는 작품 우선 — 리뷰수 많고 평점 높을수록 위
  // 리뷰 없으면 플랫폼 순(네이버 > 카카오 > 리디 > 기타)으로 하단 정렬
  if (webtoon.review_count > 0) {
    return 2_000_000 + webtoon.review_count * 1000 + (webtoon.avg_score ?? 0) * 10 + platformTier(webtoon);
  }
  return platformTier(webtoon) * 100_000;
}

function sortWebtoons(items: WebtoonWithStats[], sort: SortOption) {
  const byTitle = (a: WebtoonWithStats, b: WebtoonWithStats) => a.title.localeCompare(b.title, 'ko');

  return [...items].sort((a, b) => {
    // 평점순: 평점 있는 것 > 없는 것 (avg_score null → -1로 처리)
    if (sort === 'score') {
      const hasA = a.avg_score !== null ? 1 : 0;
      const hasB = b.avg_score !== null ? 1 : 0;
      return hasB - hasA || (b.avg_score ?? 0) - (a.avg_score ?? 0) || b.review_count - a.review_count || byTitle(a, b);
    }
    // 인기순: 리뷰 많은 순 (점수 무관)
    if (sort === 'popular') {
      return b.review_count - a.review_count || (b.avg_score ?? -1) - (a.avg_score ?? -1) || byTitle(a, b);
    }
    if (sort === 'daily_score') {
      const hasA = a.daily_avg_score !== null ? 1 : 0;
      const hasB = b.daily_avg_score !== null ? 1 : 0;
      return hasB - hasA || (b.daily_avg_score ?? 0) - (a.daily_avg_score ?? 0) || b.daily_review_count - a.daily_review_count || byTitle(a, b);
    }
    if (sort === 'daily_popular') {
      return b.daily_review_count - a.daily_review_count || (b.daily_avg_score ?? -1) - (a.daily_avg_score ?? -1) || byTitle(a, b);
    }
    if (sort === 'weekly_score') {
      const hasA = a.weekly_avg_score !== null ? 1 : 0;
      const hasB = b.weekly_avg_score !== null ? 1 : 0;
      return hasB - hasA || (b.weekly_avg_score ?? 0) - (a.weekly_avg_score ?? 0) || b.weekly_review_count - a.weekly_review_count || byTitle(a, b);
    }
    if (sort === 'weekly_comments') {
      return b.weekly_comment_count - a.weekly_comment_count || b.weekly_review_count - a.weekly_review_count || byTitle(a, b);
    }
    if (sort === 'monthly_score') {
      const hasA = a.monthly_avg_score !== null ? 1 : 0;
      const hasB = b.monthly_avg_score !== null ? 1 : 0;
      return hasB - hasA || (b.monthly_avg_score ?? 0) - (a.monthly_avg_score ?? 0) || b.monthly_review_count - a.monthly_review_count || byTitle(a, b);
    }
    if (sort === 'monthly_popular') {
      return b.monthly_review_count - a.monthly_review_count || (b.monthly_avg_score ?? -1) - (a.monthly_avg_score ?? -1) || byTitle(a, b);
    }
    if (sort === 'yearly_score') {
      const hasA = a.yearly_avg_score !== null ? 1 : 0;
      const hasB = b.yearly_avg_score !== null ? 1 : 0;
      return hasB - hasA || (b.yearly_avg_score ?? 0) - (a.yearly_avg_score ?? 0) || b.yearly_review_count - a.yearly_review_count || byTitle(a, b);
    }
    if (sort === 'yearly_popular') {
      return b.yearly_review_count - a.yearly_review_count || (b.yearly_avg_score ?? -1) - (a.yearly_avg_score ?? -1) || byTitle(a, b);
    }
    if (sort === 'latest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // 기본순: 네이버 > 카카오 > 리디 > 기타, 같은 tier 내 리뷰수순
    return featuredScore(b) - featuredScore(a) || byTitle(a, b);
  });
}

type ReviewStat = { score: number; created_at?: string; comment?: string | null };

export async function getWebtoons(
  sort: SortOption = 'featured',
  platform?: string,
  status?: string,
  page = 1,
  limit?: number,
  initial?: string,
  genre?: string,
  origin?: string,
): Promise<{ items: WebtoonWithStats[]; total: number; page: number; limit: number }> {
  const supabase = await createClient();
  const safeLimit = normalizeListLimit(limit);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  // PostgREST REST API 직접 호출 — Supabase 클라이언트 권한 문제 완전 우회
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const reviewsPromise = fetch(
    `${supabaseUrl}/rest/v1/reviews?select=webtoon_id,score,created_at,comment`,
    {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    }
  ).then(async (res) => {
    const map = new Map<string, ReviewStat[]>();
    if (!res.ok) return map;
    const rows = await res.json() as { webtoon_id: string; score: string | number; created_at: string | null; comment: string | null }[];
    for (const r of rows) {
      const list = map.get(r.webtoon_id) ?? [];
      list.push({ score: Number(r.score), created_at: r.created_at ?? undefined, comment: r.comment });
      map.set(r.webtoon_id, list);
    }
    return map;
  }).catch(() => new Map<string, ReviewStat[]>());

  let query = supabase
    .from('webtoons')
    .select(platform && VALID_PLATFORMS.includes(platform)
      ? `*, webtoon_sources!inner(*)`
      : `*, webtoon_sources(*)`, { count: 'exact' });

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

  const needsClientSort = (VALID_SORTS as string[]).includes(sort) && sort !== 'latest';
  query = needsClientSort ? query.range(0, LIST_CANDIDATE_LIMIT - 1) : query.range(from, to);

  const [webtoonResult, reviewMap] = await Promise.all([query, reviewsPromise]);
  let { data, error } = webtoonResult;
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
    let fallbackQuery = supabase.from('webtoons').select('*');
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

  // 별도로 가져온 reviews 를 각 webtoon 에 주입
  let webtoons = data.map((w) => withStats({ ...w, reviews: reviewMap.get(w.id) ?? [] }));

  if (platform && VALID_PLATFORMS.includes(platform)) {
    webtoons = webtoons.filter((webtoon) => webtoon.sources.some((source) => source.platform === platform));
  }

  if (origin && VALID_ORIGINS.includes(origin)) {
    webtoons = webtoons.filter((webtoon) => webtoon.origin === origin);
  }

  const sorted = sortWebtoons(webtoons, sort);
  const pageItems = needsClientSort ? sorted.slice(from, to + 1) : sorted;

  return { items: pageItems, total: origin ? sorted.length : total, page: safePage, limit: safeLimit };
}

export async function getWebtoon(id: string): Promise<WebtoonWithStats | null> {
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const [webtoonResult, reviewsRes] = await Promise.all([
    supabase.from('webtoons').select(`*, webtoon_sources(*)`).eq('id', id).single(),
    fetch(
      `${supabaseUrl}/rest/v1/reviews?select=webtoon_id,score,created_at,comment&webtoon_id=eq.${id}`,
      { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }, cache: 'no-store' }
    ),
  ]);

  let { data, error } = webtoonResult;

  if (error?.message?.includes('webtoon_sources')) {
    const fallback = await supabase.from('webtoons').select('*').eq('id', id).single();
    if (fallback.error || !fallback.data) return null;
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) return null;

  const reviewRows = reviewsRes.ok
    ? await reviewsRes.json() as { score: string | number; created_at: string | null; comment: string | null }[]
    : [];

  const reviews = reviewRows.map((r) => ({
    score: Number(r.score),
    created_at: r.created_at ?? undefined,
    comment: r.comment,
  }));

  return withStats({ ...data, reviews });
}

export async function getReviewsByWebtoon(webtoonId: string): Promise<ReviewWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select(`*, profiles(nickname, total_recommends)`)
    .eq('webtoon_id', webtoonId)
    .order('recommend_count', { ascending: false });

  if (error || !data) return [];

  return (data as ReviewRowData[])
    .map((review) => ({ ...review, score: Number(review.score) }))
    .sort((a, b) => {
      // 댓글 있으면 추천수 3개 보너스 — 댓글 없는 건 추천이 많아야 위로 올라옴
      const aW = (a.recommend_count ?? 0) + (String(a.comment ?? '').trim() ? 3 : 0);
      const bW = (b.recommend_count ?? 0) + (String(b.comment ?? '').trim() ? 3 : 0);
      return bW - aW || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });
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
    .select(`*, webtoon_sources(*)`)
    .or(`title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%`)
    .order('title', { ascending: true })
    .limit(SEARCH_LIMIT);

  let rows = data ?? [];

  if (error?.message?.includes('webtoon_sources')) {
    const fallback = await supabase
      .from('webtoons')
      .select('*')
      .or(`title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%`)
      .order('title', { ascending: true })
      .limit(SEARCH_LIMIT);
    if (fallback.error || !fallback.data) return [];
    rows = fallback.data;
  } else if (error) {
    return [];
  }

  const byId = new Map<string, (typeof rows)[number]>();
  for (const row of rows) byId.set(row.id, row);

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
      .select(`*, webtoon_sources(*)`)
      .in('id', missingIds)
      .limit(SEARCH_LIMIT);

    for (const row of sourceWebtoons ?? []) byId.set(row.id, row);
  }

  const allIds = [...byId.keys()];
  const supabaseUrl2 = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apiKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const idsParam = allIds.map((id) => `"${id}"`).join(',');
  const reviewRes2 = await fetch(
    `${supabaseUrl2}/rest/v1/reviews?select=webtoon_id,score,created_at,comment&webtoon_id=in.(${idsParam})`,
    { headers: { apikey: apiKey2, Authorization: `Bearer ${apiKey2}` }, cache: 'no-store' }
  ).catch(() => null);
  const reviewData = reviewRes2?.ok ? await reviewRes2.json() as { webtoon_id: string; score: string | number; created_at: string | null; comment: string | null }[] : [];

  const reviewMap = new Map<string, ReviewStat[]>();
  for (const r of reviewData) {
    const list = reviewMap.get(r.webtoon_id) ?? [];
    list.push({ score: Number(r.score), created_at: r.created_at ?? undefined, comment: r.comment });
    reviewMap.set(r.webtoon_id, list);
  }

  return [...byId.values()]
    .map((w) => withStats({ ...w, reviews: reviewMap.get(w.id) ?? [] }))
    .sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    .slice(0, SEARCH_LIMIT);
}
