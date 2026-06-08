import { createClient } from '@/lib/supabase/server';
import { Webtoon, WebtoonSource, WebtoonWithStats, SortOption, ReviewWithProfile, Origin } from '@/types';

const VALID_PLATFORMS = ['naver', 'kakao', 'ridi', 'etc'];
const VALID_STATUSES = ['ongoing', 'completed'];
const VALID_ORIGINS = ['korea', 'japan', 'china', 'unknown'];
const VALID_GENRES = ['로맨스', '드라마', '판타지', '액션', '무협', '학원', '일상', '개그', '스릴러', '공포', '스포츠'];
const DEFAULT_LIST_LIMIT = 20;
const VALID_LIST_LIMITS = [10, 20, 50, 100];
const SEARCH_LIMIT = 80;
// Cloudflare Workers CPU 한도 안에서 정렬한다.
// 리뷰가 있는 작품은 아래 reviewedIds 쿼리로 별도 병합되므로 랭킹 대상에서 빠지지 않는다.
const LIST_CANDIDATE_LIMIT = 1000;
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

function featuredScore(webtoon: WebtoonWithStats & { cached_review_count?: number }) {
  // cached_review_count: DB에서 직접 온 숫자 (권한 문제 없음), 없으면 computed 값 사용
  const rc = webtoon.cached_review_count ?? webtoon.review_count;
  if (rc > 0) {
    return 2_000_000 + rc * 1000 + (webtoon.avg_score ?? 0) * 10 + platformTier(webtoon);
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

function mergeById<T extends { id: string }>(base: T[], extra: T[]) {
  const byId = new Map(base.map((item) => [item.id, item]));
  for (const item of extra) byId.set(item.id, item);
  return [...byId.values()];
}

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 인기순은 DB의 리뷰 수/평균 점수 캐시로 직접 페이지네이션한다.
  // 전체 작품을 Worker 메모리로 가져오지 않으므로 뒤쪽 페이지도 유지되고 CPU 사용도 작다.
  if (sort === 'popular' && !origin) {
    const runPageQuery = async (includeSources: boolean, cacheSort: 'full' | 'count' | 'none') => {
      const selectClause = includeSources
        ? platform && VALID_PLATFORMS.includes(platform)
          ? `*, webtoon_sources!inner(*)`
          : `*, webtoon_sources(*)`
        : '*';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase.from('webtoons').select(selectClause, { count: 'exact' });
      if (includeSources && platform && VALID_PLATFORMS.includes(platform)) {
        q = q.eq('webtoon_sources.platform', platform);
      }
      if (status && VALID_STATUSES.includes(status)) q = q.eq('status', status);
      if (genre && VALID_GENRES.includes(genre)) q = q.eq('genre', genre);
      q = applyInitialFilter(q, initial);
      if (cacheSort === 'full') {
        q = q
          .order('cached_review_count', { ascending: false })
          .order('cached_avg_score', { ascending: false, nullsFirst: false });
      } else if (cacheSort === 'count') {
        q = q.order('cached_review_count', { ascending: false });
      }
      return q.order('title', { ascending: true }).range(from, to);
    };

    let pageResult = await runPageQuery(true, 'full');
    if (pageResult.error?.message?.includes('webtoon_sources')) {
      pageResult = await runPageQuery(false, 'full');
    }
    if (pageResult.error) {
      pageResult = await runPageQuery(true, 'count');
      if (pageResult.error?.message?.includes('webtoon_sources')) {
        pageResult = await runPageQuery(false, 'count');
      }
    }
    if (pageResult.error) {
      const reviewRows = await fetch(
        `${supabaseUrl}/rest/v1/reviews?select=webtoon_id,score`,
        { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }, cache: 'no-store' },
      )
        .then(async (response) => response.ok
          ? await response.json() as { webtoon_id: string; score: string | number }[]
          : [])
        .catch(() => []);

      const reviewMap = new Map<string, ReviewStat[]>();
      for (const review of reviewRows) {
        const list = reviewMap.get(review.webtoon_id) ?? [];
        list.push({ score: Number(review.score) });
        reviewMap.set(review.webtoon_id, list);
      }

      const reviewedIds = [...reviewMap.keys()];
      const reviewedRows: WebtoonRowData[] = [];
      for (let i = 0; i < reviewedIds.length; i += 200) {
        const ids = reviewedIds.slice(i, i + 200);
        let reviewedQuery = supabase
          .from('webtoons')
          .select(platform && VALID_PLATFORMS.includes(platform)
            ? `*, webtoon_sources!inner(*)`
            : `*, webtoon_sources(*)`)
          .in('id', ids);
        if (platform && VALID_PLATFORMS.includes(platform)) {
          reviewedQuery = reviewedQuery.eq('webtoon_sources.platform', platform);
        }
        if (status && VALID_STATUSES.includes(status)) reviewedQuery = reviewedQuery.eq('status', status);
        if (genre && VALID_GENRES.includes(genre)) reviewedQuery = reviewedQuery.eq('genre', genre);
        reviewedQuery = applyInitialFilter(reviewedQuery, initial);
        let reviewedResult = await reviewedQuery;
        if (reviewedResult.error?.message?.includes('webtoon_sources')) {
          let fallback = supabase.from('webtoons').select('*').in('id', ids);
          if (status && VALID_STATUSES.includes(status)) fallback = fallback.eq('status', status);
          if (genre && VALID_GENRES.includes(genre)) fallback = fallback.eq('genre', genre);
          fallback = applyInitialFilter(fallback, initial);
          reviewedResult = await fallback;
        }
        if (reviewedResult.data) reviewedRows.push(...reviewedResult.data as WebtoonRowData[]);
      }

      let countQuery = supabase
        .from('webtoons')
        .select(platform && VALID_PLATFORMS.includes(platform) ? `id, webtoon_sources!inner(*)` : 'id', {
          count: 'exact',
          head: true,
        });
      if (platform && VALID_PLATFORMS.includes(platform)) {
        countQuery = countQuery.eq('webtoon_sources.platform', platform);
      }
      if (status && VALID_STATUSES.includes(status)) countQuery = countQuery.eq('status', status);
      if (genre && VALID_GENRES.includes(genre)) countQuery = countQuery.eq('genre', genre);
      countQuery = applyInitialFilter(countQuery, initial);
      let countResult: { count: number | null; error: { message?: string } | null } = await countQuery;
      if (countResult.error?.message?.includes('webtoon_sources')) {
        let fallbackCount = supabase.from('webtoons').select('id', { count: 'exact', head: true });
        if (status && VALID_STATUSES.includes(status)) fallbackCount = fallbackCount.eq('status', status);
        if (genre && VALID_GENRES.includes(genre)) fallbackCount = fallbackCount.eq('genre', genre);
        fallbackCount = applyInitialFilter(fallbackCount, initial);
        countResult = await fallbackCount;
      }

      const reviewedItems = reviewedRows
        .map((webtoon) => withStats({ ...webtoon, reviews: reviewMap.get(webtoon.id) ?? [] }))
        .sort((a, b) => b.review_count - a.review_count || (b.avg_score ?? -1) - (a.avg_score ?? -1) || a.title.localeCompare(b.title, 'ko'));

      const pageItems = reviewedItems.slice(from, to + 1);
      if (pageItems.length < safeLimit) {
        const reviewedSet = new Set(reviewedItems.map((webtoon) => webtoon.id));
        const needed = safeLimit - pageItems.length;
        const skipUnreviewed = Math.max(0, from - reviewedItems.length);
        const unreviewed: WebtoonRowData[] = [];
        let scanned = 0;
        let offset = 0;
        while (unreviewed.length < needed && offset < LIST_CANDIDATE_LIMIT) {
          let fillQuery = supabase
            .from('webtoons')
            .select(platform && VALID_PLATFORMS.includes(platform)
              ? `*, webtoon_sources!inner(*)`
              : `*, webtoon_sources(*)`);
          if (platform && VALID_PLATFORMS.includes(platform)) {
            fillQuery = fillQuery.eq('webtoon_sources.platform', platform);
          }
          if (status && VALID_STATUSES.includes(status)) fillQuery = fillQuery.eq('status', status);
          if (genre && VALID_GENRES.includes(genre)) fillQuery = fillQuery.eq('genre', genre);
          fillQuery = applyInitialFilter(fillQuery, initial);
          let fillResult = await fillQuery.order('title', { ascending: true }).range(offset, offset + 199);
          if (fillResult.error?.message?.includes('webtoon_sources')) {
            let fallback = supabase.from('webtoons').select('*');
            if (status && VALID_STATUSES.includes(status)) fallback = fallback.eq('status', status);
            if (genre && VALID_GENRES.includes(genre)) fallback = fallback.eq('genre', genre);
            fallback = applyInitialFilter(fallback, initial);
            fillResult = await fallback.order('title', { ascending: true }).range(offset, offset + 199);
          }
          const rows = (fillResult.data ?? []) as WebtoonRowData[];
          if (rows.length === 0) break;
          for (const row of rows) {
            if (reviewedSet.has(row.id)) continue;
            if (scanned++ < skipUnreviewed) continue;
            unreviewed.push(row);
            if (unreviewed.length >= needed) break;
          }
          offset += 200;
        }
        pageItems.push(...unreviewed.map((webtoon) => withStats({ ...webtoon, reviews: [] })));
      }

      return {
        items: pageItems,
        total: countResult.count ?? reviewedItems.length,
        page: safePage,
        limit: safeLimit,
      };
    }

    if (pageResult.error || !pageResult.data) {
      return { items: [], total: 0, page: safePage, limit: safeLimit };
    }

    const pageData = pageResult.data as WebtoonRowData[];
    const pageIds = pageData.map((row) => row.id);
    const idsParam = pageIds.map((id) => `"${id}"`).join(',');
    const reviewRows = pageIds.length === 0
      ? []
      : await fetch(
          `${supabaseUrl}/rest/v1/reviews?select=webtoon_id,score,created_at,comment&webtoon_id=in.(${idsParam})`,
          { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }, cache: 'no-store' },
        )
          .then(async (response) => response.ok
            ? await response.json() as { webtoon_id: string; score: string | number; created_at: string | null; comment: string | null }[]
            : [])
          .catch(() => []);

    const pageReviewMap = new Map<string, ReviewStat[]>();
    for (const review of reviewRows) {
      const list = pageReviewMap.get(review.webtoon_id) ?? [];
      list.push({
        score: Number(review.score),
        created_at: review.created_at ?? undefined,
        comment: review.comment,
      });
      pageReviewMap.set(review.webtoon_id, list);
    }

    const items = pageData.map((webtoon) => withStats({
      ...webtoon,
      reviews: pageReviewMap.get(webtoon.id) ?? [],
    }));

    return {
      items,
      total: pageResult.count ?? 0,
      page: safePage,
      limit: safeLimit,
    };
  }

  // PostgREST REST API 직접 호출 — Supabase 클라이언트 권한 문제 완전 우회
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

    // PostgREST caps responses at 1000 rows — fetch remaining pages in parallel
    if (needsClientSort && data && data.length === 1000 && total > 1000) {
      const PAGE_SIZE = 1000;
      const maxItems = Math.min(total, LIST_CANDIDATE_LIMIT);
      const extraPageCount = Math.ceil((maxItems - PAGE_SIZE) / PAGE_SIZE);
      const selectClause = platform && VALID_PLATFORMS.includes(platform)
        ? `*, webtoon_sources!inner(*)`
        : `*, webtoon_sources(*)`;

      const extraPagePromises = Array.from({ length: extraPageCount }, (_, i) => {
        const pageFrom = (i + 1) * PAGE_SIZE;
        const pageTo = Math.min(pageFrom + PAGE_SIZE - 1, LIST_CANDIDATE_LIMIT - 1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = supabase.from('webtoons').select(selectClause);
        if (platform && VALID_PLATFORMS.includes(platform)) q = q.eq('webtoon_sources.platform', platform);
        if (status && VALID_STATUSES.includes(status)) q = q.eq('status', status);
        if (genre && VALID_GENRES.includes(genre)) q = q.eq('genre', genre);
        q = applyInitialFilter(q, initial);
        q = q.order('title', { ascending: true });
        return q.range(pageFrom, pageTo);
      });

      const extraResults = await Promise.all(extraPagePromises);
      for (const result of extraResults) {
        if (result.data) data = mergeById(data, result.data);
      }
    }
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

    // PostgREST 1000-row cap — fetch remaining pages in parallel (fallback path)
    if (needsClientSort && data && data.length === 1000 && total > 1000) {
      const PAGE_SIZE = 1000;
      const maxItems = Math.min(total, LIST_CANDIDATE_LIMIT);
      const extraPageCount = Math.ceil((maxItems - PAGE_SIZE) / PAGE_SIZE);

      const extraPagePromises = Array.from({ length: extraPageCount }, (_, i) => {
        const pageFrom = (i + 1) * PAGE_SIZE;
        const pageTo = Math.min(pageFrom + PAGE_SIZE - 1, LIST_CANDIDATE_LIMIT - 1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = supabase.from('webtoons').select('*');
        if (status && VALID_STATUSES.includes(status)) q = q.eq('status', status);
        if (genre && VALID_GENRES.includes(genre)) q = q.eq('genre', genre);
        q = applyInitialFilter(q, initial);
        q = q.order('title', { ascending: true });
        return q.range(pageFrom, pageTo);
      });

      const extraResults = await Promise.all(extraPagePromises);
      for (const result of extraResults) {
        if (result.data) data = mergeById(data, result.data);
      }
    }
  }

  if (error || !data) return { items: [], total: 0, page: safePage, limit: safeLimit };

  const reviewedIds = [...reviewMap.keys()];
  if (needsClientSort && reviewedIds.length > 0) {
    let reviewedQuery = supabase
      .from('webtoons')
      .select(platform && VALID_PLATFORMS.includes(platform)
        ? `*, webtoon_sources!inner(*)`
        : `*, webtoon_sources(*)`)
      .in('id', reviewedIds);

    if (platform && VALID_PLATFORMS.includes(platform)) {
      reviewedQuery = reviewedQuery.eq('webtoon_sources.platform', platform);
    }
    if (status && VALID_STATUSES.includes(status)) {
      reviewedQuery = reviewedQuery.eq('status', status);
    }
    if (genre && VALID_GENRES.includes(genre)) {
      reviewedQuery = reviewedQuery.eq('genre', genre);
    }
    reviewedQuery = applyInitialFilter(reviewedQuery, initial);

    const reviewedResult = await reviewedQuery;
    if (reviewedResult.data) {
      data = mergeById(data, reviewedResult.data);
    } else if (reviewedResult.error?.message?.includes('webtoon_sources')) {
      let fallbackReviewed = supabase.from('webtoons').select('*').in('id', reviewedIds);
      if (status && VALID_STATUSES.includes(status)) {
        fallbackReviewed = fallbackReviewed.eq('status', status);
      }
      if (genre && VALID_GENRES.includes(genre)) {
        fallbackReviewed = fallbackReviewed.eq('genre', genre);
      }
      fallbackReviewed = applyInitialFilter(fallbackReviewed, initial);
      const fallbackReviewedResult = await fallbackReviewed;
      if (fallbackReviewedResult.data) data = mergeById(data, fallbackReviewedResult.data);
    }
  }

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/reviews?select=*,profiles(nickname,total_recommends,points)&webtoon_id=eq.${webtoonId}&order=recommend_count.desc`,
    {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    }
  ).catch(() => null);

  if (!res?.ok) return [];

  const data = await res.json() as ReviewRowData[];

  return data
    .map((review) => ({ ...review, score: Number(review.score) }))
    .sort((a, b) => {
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

  const [exactResult, broadResult] = await Promise.all([
    supabase
      .from('webtoons')
      .select(`*, webtoon_sources(*)`)
      .ilike('title', safeQuery)
      .limit(10),
    supabase
      .from('webtoons')
      .select(`*, webtoon_sources(*)`)
      .or(`title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%`)
      .order('title', { ascending: true })
      .limit(SEARCH_LIMIT),
  ]);

  let rows = mergeById(exactResult.data ?? [], broadResult.data ?? []);
  const error = broadResult.error;

  if (error?.message?.includes('webtoon_sources')) {
    const [exactFallback, broadFallback] = await Promise.all([
      supabase.from('webtoons').select('*').ilike('title', safeQuery).limit(10),
      supabase
        .from('webtoons')
        .select('*')
        .or(`title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%`)
        .order('title', { ascending: true })
        .limit(SEARCH_LIMIT),
    ]);
    const fallback = broadFallback;
    if (fallback.error || !fallback.data) return [];
    rows = mergeById(exactFallback.data ?? [], fallback.data);
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

  const normalizedQuery = safeQuery.toLocaleLowerCase('ko');

  return [...byId.values()]
    .map((w) => withStats({ ...w, reviews: reviewMap.get(w.id) ?? [] }))
    .sort((a, b) => {
      const aTitle = a.title.toLocaleLowerCase('ko');
      const bTitle = b.title.toLocaleLowerCase('ko');
      const aRank = aTitle === normalizedQuery ? 0 : aTitle.startsWith(normalizedQuery) ? 1 : 2;
      const bRank = bTitle === normalizedQuery ? 0 : bTitle.startsWith(normalizedQuery) ? 1 : 2;
      return aRank - bRank || a.title.localeCompare(b.title, 'ko');
    })
    .slice(0, SEARCH_LIMIT);
}
