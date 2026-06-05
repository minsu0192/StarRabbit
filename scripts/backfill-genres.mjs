/**
 * Backfill missing or weak webtoon genres from source metadata and title rules.
 *
 * Usage:
 *   node --env-file=.env.local scripts/backfill-genres.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { inferGenre } from './genre-classifier.mjs';

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

const [webtoons, sources] = await Promise.all([
  readAll('webtoons', 'id,title,genre'),
  readAll('webtoon_sources', 'webtoon_id,title,genre'),
]);

const sourcesByWebtoon = new Map();
for (const source of sources) {
  if (!sourcesByWebtoon.has(source.webtoon_id)) sourcesByWebtoon.set(source.webtoon_id, []);
  sourcesByWebtoon.get(source.webtoon_id).push(source);
}

let updated = 0;
let unchanged = 0;

for (const webtoon of webtoons) {
  const relatedSources = sourcesByWebtoon.get(webtoon.id) ?? [];
  const genre = inferGenre({
    title: webtoon.title,
    genre: webtoon.genre,
    sourceGenres: relatedSources.flatMap((source) => [source.genre, source.title]),
  });

  if (!genre || genre === webtoon.genre) {
    unchanged++;
    continue;
  }

  const { error } = await supabase
    .from('webtoons')
    .update({ genre })
    .eq('id', webtoon.id);
  if (error) throw error;
  updated++;
}

console.log(`Backfilled ${updated} genres. Left ${unchanged} rows unchanged.`);
