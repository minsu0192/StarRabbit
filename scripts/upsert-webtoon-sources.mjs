/**
 * Upsert verified source rows into webtoons + webtoon_sources.
 *
 * Input JSON shape:
 * [
 *   {
 *     "platform": "kakao",
 *     "title": "나 혼자만 레벨업",
 *     "author": "추공",
 *     "external_id": "optional-platform-id",
 *     "source_url": "https://...",
 *     "genre": "판타지",
 *     "status": "completed"
 *   }
 * ]
 *
 * Usage:
 *   node --env-file=.env.local scripts/upsert-webtoon-sources.mjs data/sources/kakao.json
 */

import { readFile } from 'node:fs/promises';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const inputPath = process.argv[2];
const missingOnly = process.argv.includes('--missing-only');

const VALID_PLATFORMS = new Set(['naver', 'kakao', 'ridi', 'etc']);
const VALID_STATUSES = new Set(['ongoing', 'completed']);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!inputPath) {
  console.error('Usage: node --env-file=.env.local scripts/upsert-webtoon-sources.mjs <sources.json>');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

function normalizeTitle(title) {
  return String(title ?? '')
    .normalize('NFKC')
    .replace(/\[[^\]]*(?:단행본|개정판|완전판|완결|외전|소장판|컬러판|19세|15세)[^\]]*\]/gi, '')
    .replace(/\([^)]*(?:단행본|개정판|완전판|완결|외전|소장판|컬러판|19세|15세)[^)]*\)/gi, '')
    .replace(/[~!@#$%^&*_=+|\\:;"'<>,.?/`·ㆍ…\s-]/g, '')
    .trim()
    .toLowerCase();
}

function sanitizeRow(row) {
  const platform = String(row.platform ?? '').trim();
  const title = String(row.title ?? '').trim();
  const author = String(row.author ?? '').trim();
  const status = row.status ? String(row.status).trim() : null;

  if (!VALID_PLATFORMS.has(platform)) throw new Error(`Invalid platform: ${platform}`);
  if (!title) throw new Error('Missing title');
  if (!author) throw new Error(`Missing author for ${title}`);
  if (status && !VALID_STATUSES.has(status)) throw new Error(`Invalid status for ${title}: ${status}`);

  return {
    platform,
    title,
    author,
    external_id: row.external_id ? String(row.external_id).trim() : null,
    source_url: row.source_url ? String(row.source_url).trim() : null,
    genre: row.genre ? String(row.genre).trim() : null,
    status,
  };
}

async function readAllWebtoons() {
  const rows = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoons?select=id,title,author,platform,genre,status&order=title.asc`, {
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

async function readExistingSourceKeys() {
  const rows = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoon_sources?select=platform,external_id&order=platform.asc`, {
      headers: { ...headers, Range: `${from}-${from + pageSize - 1}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return new Set(rows.map((row) => `${row.platform}:${row.external_id}`));
}

async function insertWebtoon(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoons`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      title: row.title,
      author: row.author,
      platform: ['naver', 'kakao'].includes(row.platform) ? row.platform : 'etc',
      genre: row.genre,
      status: row.status,
    }),
  });

  if (!res.ok) {
    const message = await res.text();
    if (message.includes('webtoons_title_author_unique')) {
      const existing = await findWebtoonByTitleAuthor(row.title, row.author);
      if (existing) return existing;
    }
    throw new Error(message);
  }
  const [created] = await res.json();
  return created;
}

async function findWebtoonByTitleAuthor(title, author) {
  const params = new URLSearchParams({
    select: 'id,title,author,platform,genre,status',
    title: `eq.${title}`,
    author: `eq.${author}`,
    limit: '1',
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoons?${params}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  const [row] = await res.json();
  return row ?? null;
}

async function upsertSource(webtoon, row) {
  const externalId = row.external_id ?? row.source_url ?? `${webtoon.id}:${row.platform}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoon_sources?on_conflict=platform,external_id`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      webtoon_id: webtoon.id,
      platform: row.platform,
      external_id: externalId,
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

let input = JSON.parse(await readFile(inputPath, 'utf8')).map(sanitizeRow);
if (missingOnly) {
  const existingSourceKeys = await readExistingSourceKeys();
  input = input.filter((row) => {
    const externalId = row.external_id ?? row.source_url;
    return externalId && !existingSourceKeys.has(`${row.platform}:${externalId}`);
  });
  console.log(`Missing-only mode: ${input.length} source rows to insert.`);
}
const webtoons = await readAllWebtoons();
const byNormalizedTitle = new Map();

for (const webtoon of webtoons) {
  const key = normalizeTitle(webtoon.title);
  if (!byNormalizedTitle.has(key)) byNormalizedTitle.set(key, webtoon);
}

let created = 0;
let linked = 0;

for (const row of input) {
  const key = normalizeTitle(row.title);
  let webtoon = byNormalizedTitle.get(key);

  if (!webtoon) {
    webtoon = await insertWebtoon(row);
    byNormalizedTitle.set(key, webtoon);
    created++;
  }

  await upsertSource(webtoon, row);
  linked++;
}

console.log(`Linked ${linked} source rows. Created ${created} canonical webtoon rows.`);
