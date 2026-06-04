import { createClient } from '@/lib/supabase/server';
import { WebtoonWithStats, SortOption, ReviewWithProfile } from '@/types';

export async function getWebtoons(sort: SortOption = 'score'): Promise<WebtoonWithStats[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webtoons')
    .select(`
      *,
      reviews(score)
    `);

  if (error || !data) return [];

  const withStats: WebtoonWithStats[] = data.map((w) => {
    const scores: number[] = (w.reviews ?? []).map((r: { score: number }) => r.score);
    const avg_score = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    return {
      ...w,
      reviews: undefined,
      avg_score,
      review_count: scores.length,
    };
  });

  if (sort === 'score') {
    return withStats.sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0));
  } else if (sort === 'popular') {
    return withStats.sort((a, b) => b.review_count - a.review_count);
  } else {
    return withStats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  const scores: number[] = (data.reviews ?? []).map((r: { score: number }) => r.score);
  const avg_score = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;

  return { ...data, reviews: undefined, avg_score, review_count: scores.length };
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

  const { data, error } = await supabase
    .from('webtoons')
    .select(`*, reviews(score)`)
    .or(`title.ilike.%${query}%,author.ilike.%${query}%`);

  if (error || !data) return [];

  return data.map((w) => {
    const scores: number[] = (w.reviews ?? []).map((r: { score: number }) => r.score);
    const avg_score = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    return { ...w, reviews: undefined, avg_score, review_count: scores.length };
  });
}
