/**
 * Collect public KakaoPage webtoon source metadata.
 *
 * It only writes rows whose detail page exposes title/authors/category.
 *
 * Usage:
 *   node scripts/collect-kakao-page-sources.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { cleanDisplayTitle, isKakaoExcludedTitle } from './title-normalization.mjs';

const USER_AGENT = 'Mozilla/5.0';
const OUTPUT = 'data/sources/kakao-page.json';
const SEED_URLS = [
  'https://page.kakao.com',
  'https://page.kakao.com/menu/10000',
  'https://page.kakao.com/menu/10010',
];
const MENU_SCREEN_RE = /href="(\/menu\/100(?:00|10)\/screen\/\d+)"/g;
const SEARCH_API = 'https://page.kakao.com/api/gateway/api/v2/search/series';
const SEARCH_PAGE_SIZE = 50;
const SEARCH_PAGES_PER_TERM = 4;
const SEARCH_TERMS = [
  '로맨스',
  '로판',
  '판타지',
  '현판',
  '무협',
  '액션',
  '드라마',
  '학원',
  '일상',
  '개그',
  '스릴러',
  '공포',
  'BL',
  'GL',
  '성인',
  '회귀',
  '환생',
  '악녀',
  '공작',
  '대공',
  '황제',
  '먼치킨',
  '게임',
  '레벨',
  '헌터',
  '아이돌',
  '계약',
  '결혼',
  '웹툰',
];

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

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`KakaoPage API failed ${response.status}: ${url}`);
  return response.json();
}

function rowFromSearchItem(item) {
  if (!item?.series_id || item.category_uid !== 10 || item.category !== '웹툰') return null;
  if (!item.title || !item.authors) return null;
  const title = cleanDisplayTitle(item.title);
  if (!title || isKakaoExcludedTitle(title)) return null;

  return {
    platform: 'kakao',
    title,
    author: String(item.authors).replace(/,/g, ' / ').trim(),
    external_id: String(item.series_id),
    source_url: `https://page.kakao.com/content/${item.series_id}`,
    genre: item.sub_category ? String(item.sub_category).trim() : null,
    status: item.on_issue === 'N' || item.state === 'ST64' ? 'completed' : 'ongoing',
  };
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

async function collectSearchRows() {
  const rowsById = new Map();

  for (const term of SEARCH_TERMS) {
    for (const sortType of ['ACCURACY', 'LATEST']) {
      for (let page = 0; page < SEARCH_PAGES_PER_TERM; page += 1) {
        const url = new URL(SEARCH_API);
        url.search = new URLSearchParams({
          keyword: term,
          category_uid: '10',
          is_complete: 'false',
          sort_type: sortType,
          page: String(page),
          size: String(SEARCH_PAGE_SIZE),
        }).toString();

        try {
          const json = await fetchJson(url);
          for (const item of json.result?.list ?? []) {
            const row = rowFromSearchItem(item);
            if (row) rowsById.set(row.external_id, row);
          }
          console.log(`search ${term}/${sortType}/${page}: rows=${rowsById.size}`);
          if (json.result?.is_end) break;
        } catch (error) {
          console.warn(`skip search ${term}/${sortType}/${page}: ${error.message}`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  return rowsById;
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
  const title = cleanDisplayTitle(content.title);
  if (!title || isKakaoExcludedTitle(title)) return null;

  return {
    platform: 'kakao',
    title,
    author: String(content.authors).replace(/,/g, ' / ').trim(),
    external_id: String(content.seriesId),
    source_url: url,
    genre: content.subcategory ? String(content.subcategory).trim() : null,
    status: content.onIssue === 'End' ? 'completed' : 'ongoing',
  };
}

const seriesIds = await collectSeriesIds();
const rowsById = await collectSearchRows();

for (const [index, seriesId] of seriesIds.entries()) {
  try {
    const row = await fetchSeries(seriesId);
    if (row) rowsById.set(row.external_id, row);
  } catch (error) {
    console.warn(`skip ${seriesId}: ${error.message}`);
  }
  if ((index + 1) % 20 === 0) console.log(`details ${index + 1}/${seriesIds.length}, rows=${rowsById.size}`);
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const rows = [...rowsById.values()].sort((a, b) => a.title.localeCompare(b.title, 'ko'));

await mkdir('data/sources', { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} KakaoPage source rows to ${OUTPUT}`);
