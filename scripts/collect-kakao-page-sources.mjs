/**
 * Collect public KakaoPage webtoon source metadata.
 *
 * It only writes rows whose detail page exposes title/authors/category.
 *
 * Usage:
 *   node scripts/collect-kakao-page-sources.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';

const USER_AGENT = 'Mozilla/5.0';
const OUTPUT = 'data/sources/kakao-page.json';
const SEED_URLS = [
  'https://page.kakao.com',
  'https://page.kakao.com/menu/10000',
  'https://page.kakao.com/menu/10010',
];
const MENU_SCREEN_RE = /href="(\/menu\/100(?:00|10)\/screen\/\d+)"/g;

function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  return match ? JSON.parse(match[1]) : null;
}

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visit));
    return;
  }
  Object.values(value).forEach((item) => walk(item, visit));
}

async function fetchHtml(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`KakaoPage fetch failed ${response.status}: ${url}`);
  return response.text();
}

async function collectMenuUrls() {
  const urls = new Set(SEED_URLS);

  for (const url of SEED_URLS) {
    const html = await fetchHtml(url);
    for (const match of html.matchAll(MENU_SCREEN_RE)) {
      urls.add(new URL(match[1], 'https://page.kakao.com').href);
    }
    console.log(`${url}: menuUrls=${urls.size}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return [...urls];
}

async function collectSeriesIds() {
  const ids = new Set();
  const menuUrls = await collectMenuUrls();

  for (const [index, url] of menuUrls.entries()) {
    const html = await fetchHtml(url);
    const data = extractNextData(html);
    walk(data, (obj) => {
      if (
        obj &&
        obj.seriesId &&
        Array.isArray(obj.metaList) &&
        obj.metaList.includes('웹툰')
      ) {
        ids.add(String(obj.seriesId));
      }
      if (obj?.categoryType === 'Webtoon' && obj.seriesId) {
        ids.add(String(obj.seriesId));
      }
    });
    console.log(`menu ${index + 1}/${menuUrls.length}: candidates=${ids.size} (${url})`);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return [...ids];
}

async function fetchSeries(seriesId) {
  const url = `https://page.kakao.com/content/${seriesId}`;
  const html = await fetchHtml(url);
  const data = extractNextData(html);
  let content = null;

  walk(data, (obj) => {
    if (!content && obj?.categoryType === 'Webtoon' && String(obj.seriesId) === String(seriesId)) {
      content = obj;
    }
  });

  if (!content?.title || !content?.authors) return null;

  return {
    platform: 'kakao',
    title: String(content.title).trim(),
    author: String(content.authors).replace(/,/g, ' / ').trim(),
    external_id: String(content.seriesId),
    source_url: url,
    genre: content.subcategory ? String(content.subcategory).trim() : null,
    status: content.onIssue === 'End' ? 'completed' : 'ongoing',
  };
}

const seriesIds = await collectSeriesIds();
const rows = [];

for (const [index, seriesId] of seriesIds.entries()) {
  try {
    const row = await fetchSeries(seriesId);
    if (row) rows.push(row);
  } catch (error) {
    console.warn(`skip ${seriesId}: ${error.message}`);
  }
  if ((index + 1) % 20 === 0) console.log(`details ${index + 1}/${seriesIds.length}, rows=${rows.length}`);
  await new Promise((resolve) => setTimeout(resolve, 250));
}

rows.sort((a, b) => a.title.localeCompare(b.title, 'ko'));

await mkdir('data/sources', { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} KakaoPage source rows to ${OUTPUT}`);
