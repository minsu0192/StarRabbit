/**
 * Remove Kakao platform metadata from stored source/canonical titles.
 *
 * Usage:
 *   node --env-file=.env.local scripts/clean-kakao-titles.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { cleanDisplayTitle, isKakaoExcludedTitle } from './title-normalization.mjs';

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
  readAll('webtoons', 'id,title,author,platform'),
  readAll('webtoon_sources', 'id,webtoon_id,platform,title'),
  readAll('reviews', 'id,webtoon_id'),
]);

const kakaoWebtoonIds = new Set(
  sources
    .filter((source) => source.platform === 'kakao')
    .map((source) => source.webtoon_id)
);
const reviewCountByWebtoon = new Map();
for (const review of reviews) {
  reviewCountByWebtoon.set(review.webtoon_id, (reviewCountByWebtoon.get(review.webtoon_id) ?? 0) + 1);
}

let sourceUpdated = 0;
let sourceDeleted = 0;
let webtoonUpdated = 0;
let webtoonDeleted = 0;
let webtoonSkipped = 0;

for (const source of sources.filter((row) => row.platform === 'kakao')) {
  const title = cleanDisplayTitle(source.title);
  if (isKakaoExcludedTitle(title)) {
    const { error } = await supabase
      .from('webtoon_sources')
      .delete()
      .eq('id', source.id);
    if (error) throw error;
    sourceDeleted++;
    continue;
  }
  if (!title || title === source.title) continue;

  const { error } = await supabase
    .from('webtoon_sources')
    .update({ title })
    .eq('id', source.id);
  if (error) throw error;
  sourceUpdated++;
}

for (const webtoon of webtoons.filter((row) => row.platform === 'kakao' || kakaoWebtoonIds.has(row.id))) {
  const title = cleanDisplayTitle(webtoon.title);
  if (isKakaoExcludedTitle(title)) {
    if ((reviewCountByWebtoon.get(webtoon.id) ?? 0) > 0) {
      webtoonSkipped++;
      console.warn(`skip excluded canonical title with reviews: "${webtoon.title}" (${webtoon.author})`);
      continue;
    }

    const { error } = await supabase
      .from('webtoons')
      .delete()
      .eq('id', webtoon.id);
    if (error) throw error;
    webtoonDeleted++;
    continue;
  }
  if (!title || title === webtoon.title) continue;

  const conflict = webtoons.find(
    (row) => row.id !== webtoon.id && row.title === title && row.author === webtoon.author
  );
  if (conflict) {
    webtoonSkipped++;
    console.warn(`skip canonical conflict: "${webtoon.title}" -> "${title}" (${webtoon.author})`);
    continue;
  }

  const { error } = await supabase
    .from('webtoons')
    .update({ title })
    .eq('id', webtoon.id);
  if (error) throw error;
  webtoon.title = title;
  webtoonUpdated++;
}

console.log(`Cleaned ${sourceUpdated} Kakao source titles and ${webtoonUpdated} canonical titles. Deleted ${sourceDeleted} excluded Kakao sources and ${webtoonDeleted} excluded canonical rows. Skipped ${webtoonSkipped} canonical rows.`);
