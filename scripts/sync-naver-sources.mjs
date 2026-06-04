/**
 * Sync Naver weekday webtoon source rows.
 *
 * This keeps source-level Naver IDs/URLs in webtoon_sources while preserving
 * canonical webtoon rows and reviews.
 *
 * Usage:
 *   node --env-file=.env.local scripts/sync-naver-sources.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NAVER_API = 'https://comic.naver.com/api/webtoon/titlelist/weekday';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

function normalizeTitle(title) {
  return String(title ?? '').replace(/\s+/g, '').trim().toLowerCase();
}

async function fetchDay(day) {
  const res = await fetch(`${NAVER_API}?week=${day}&order=VIEW&startIndex=0&perPage=500`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`Naver API ${res.status} day=${day}`);
  const json = await res.json();
  return json.titleList ?? [];
}

async function fetchNaverRows() {
  const byId = new Map();

  for (const day of DAYS) {
    const items = await fetchDay(day);
    for (const item of items) byId.set(String(item.titleId), item);
    console.log(`${day}: ${items.length}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return [...byId.values()].map((item) => ({
    platform: 'naver',
    external_id: String(item.titleId),
    source_url: `https://comic.naver.com/webtoon/list?titleId=${item.titleId}`,
    title: String(item.titleName ?? '').trim(),
    author: String(item.author ?? item.writers?.map((w) => w.name).join(' / ') ?? '').trim(),
    genre: null,
    status: item.finish ? 'completed' : 'ongoing',
  })).filter((row) => row.title && row.author);
}

async function readAllWebtoons() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoons?select=id,title,author,platform,genre,status&limit=5000`, {
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function insertWebtoon(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoons`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      title: row.title,
      author: row.author,
      platform: 'naver',
      genre: row.genre,
      status: row.status,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const [created] = await res.json();
  return created;
}

async function upsertSource(webtoon, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoon_sources?on_conflict=platform,external_id`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      webtoon_id: webtoon.id,
      platform: row.platform,
      external_id: row.external_id,
      source_url: row.source_url,
      title: row.title,
      author: row.author,
      genre: row.genre,
      status: row.status,
      source_checked_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

const sourceRows = await fetchNaverRows();
const webtoons = await readAllWebtoons();
const byTitle = new Map(webtoons.map((webtoon) => [normalizeTitle(webtoon.title), webtoon]));
let created = 0;
let linked = 0;

for (const row of sourceRows) {
  const key = normalizeTitle(row.title);
  let webtoon = byTitle.get(key);
  if (!webtoon) {
    webtoon = await insertWebtoon(row);
    byTitle.set(key, webtoon);
    created++;
  }
  await upsertSource(webtoon, row);
  linked++;
}

console.log(`Synced ${linked} Naver sources. Created ${created} canonical webtoon rows.`);
