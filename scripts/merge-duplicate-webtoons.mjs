/**
 * Merge canonical webtoon rows that normalize to the same title.
 *
 * Moves sources from duplicate rows to the keeper and deletes duplicate rows
 * only when they have no reviews.
 *
 * Usage:
 *   node --env-file=.env.local scripts/merge-duplicate-webtoons.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { normalizeTitle } from './title-normalization.mjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function readAll(table, select) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  return rows;
}

const [webtoons, sources, reviews] = await Promise.all([
  readAll('webtoons', 'id,title,author,platform,created_at'),
  readAll('webtoon_sources', 'id,webtoon_id,platform'),
  readAll('reviews', 'id,webtoon_id'),
]);

const sourceCountByWebtoon = new Map();
for (const source of sources) {
  sourceCountByWebtoon.set(source.webtoon_id, (sourceCountByWebtoon.get(source.webtoon_id) ?? 0) + 1);
}

const reviewCountByWebtoon = new Map();
for (const review of reviews) {
  reviewCountByWebtoon.set(review.webtoon_id, (reviewCountByWebtoon.get(review.webtoon_id) ?? 0) + 1);
}

const byTitle = new Map();
for (const webtoon of webtoons) {
  const key = normalizeTitle(webtoon.title);
  if (!key) continue;
  if (!byTitle.has(key)) byTitle.set(key, []);
  byTitle.get(key).push(webtoon);
}

let merged = 0;
let skippedWithReviews = 0;

for (const group of byTitle.values()) {
  if (group.length < 2) continue;

  group.sort((a, b) => {
    const reviewDelta = (reviewCountByWebtoon.get(b.id) ?? 0) - (reviewCountByWebtoon.get(a.id) ?? 0);
    if (reviewDelta !== 0) return reviewDelta;
    const sourceDelta = (sourceCountByWebtoon.get(b.id) ?? 0) - (sourceCountByWebtoon.get(a.id) ?? 0);
    if (sourceDelta !== 0) return sourceDelta;
    if (a.platform === 'naver' && b.platform !== 'naver') return -1;
    if (b.platform === 'naver' && a.platform !== 'naver') return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const [keeper, ...duplicates] = group;
  for (const duplicate of duplicates) {
    const reviewCount = reviewCountByWebtoon.get(duplicate.id) ?? 0;
    if (reviewCount > 0) {
      skippedWithReviews++;
      continue;
    }

    const { error: sourceError } = await supabase
      .from('webtoon_sources')
      .update({ webtoon_id: keeper.id })
      .eq('webtoon_id', duplicate.id);
    if (sourceError) throw sourceError;

    const { error: deleteError } = await supabase
      .from('webtoons')
      .delete()
      .eq('id', duplicate.id);
    if (deleteError) throw deleteError;

    merged++;
  }
}

console.log(`Merged ${merged} duplicate webtoon rows. Skipped ${skippedWithReviews} duplicates with reviews.`);
