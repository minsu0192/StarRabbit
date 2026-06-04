/**
 * Backfill webtoon_sources from the current webtoons table.
 *
 * Run after applying supabase/add-webtoon-sources.sql:
 *   node --env-file=.env.local scripts/backfill-webtoon-sources.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

async function readWebtoons() {
  const rows = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoons?select=*&order=title.asc`, {
      headers: { ...headers, Range: `${from}-${from + pageSize - 1}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function upsertSources(rows) {
  const BATCH = 300;
  let done = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map((webtoon) => ({
      webtoon_id: webtoon.id,
      platform: webtoon.platform,
      external_id: webtoon.id,
      source_url: null,
      title: webtoon.title,
      author: webtoon.author,
      genre: webtoon.genre,
      status: webtoon.status,
      source_checked_at: new Date().toISOString(),
    }));

    const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoon_sources?on_conflict=platform,external_id`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(await res.text());
    done += batch.length;
    console.log(`${done}/${rows.length}`);
  }
}

const webtoons = await readWebtoons();
await upsertSources(webtoons);
console.log(`Backfilled ${webtoons.length} source rows.`);
