/**
 * Collect public Ridi webtoon source metadata from non-login API sections.
 *
 * Usage:
 *   node scripts/collect-ridi-sources.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';

const USER_AGENT = 'Mozilla/5.0';
const HOME_URL = 'https://ridibooks.com/webtoon/recommendation';
const OUTPUT = 'data/sources/ridi.json';

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

async function fetchJson(url) {
  const normalized = new URL(url);
  if (!normalized.searchParams.has('adults_only')) normalized.searchParams.set('adults_only', '0');
  if (!normalized.searchParams.has('platform')) normalized.searchParams.set('platform', 'web');

  let response = await fetch(normalized, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!response.ok && response.status === 400 && String(normalized) !== url) {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    });
  }
  if (!response.ok) throw new Error(`Ridi API failed ${response.status}: ${normalized}`);
  return response.json();
}

function collectApiUrls(nextData) {
  const urls = new Set();

  walk(nextData, (obj) => {
    for (const key of ['resourceUrl', 'adultExclude']) {
      if (typeof obj?.[key] === 'string' && obj[key].startsWith('https://api.ridibooks.com/')) {
        urls.add(obj[key]);
      }
    }
    if (obj?.fetchUrl?.adultExclude?.startsWith?.('https://api.ridibooks.com/')) {
      urls.add(obj.fetchUrl.adultExclude);
    }
  });

  return [...urls].filter((url) => !url.includes('needLogin=true'));
}

function roleOrder(role) {
  return ['story_writer', 'writer', 'original_author', 'illustrator'].indexOf(role);
}

function rowFromBook(book) {
  if (!book || book.adults_only) return null;
  const serial = book.serial;
  if (!serial?.serial_id || !serial?.title) return null;
  if (!book.file?.webtoon && book.file?.format !== 'webtoon') return null;

  const authors = [...(book.authors ?? [])]
    .filter((author) => author?.name)
    .sort((a, b) => {
      const ar = roleOrder(a.role);
      const br = roleOrder(b.role);
      return (ar === -1 ? 99 : ar) - (br === -1 ? 99 : br);
    })
    .map((author) => author.name);

  if (authors.length === 0) return null;

  return {
    platform: 'ridi',
    title: String(serial.title).trim(),
    author: [...new Set(authors)].join(' / '),
    external_id: String(serial.serial_id),
    source_url: `https://ridibooks.com/books/${serial.serial_id}`,
    genre: null,
    status: serial.completion ? 'completed' : 'ongoing',
  };
}

function collectRowsFromJson(json) {
  const byId = new Map();

  walk(json, (obj) => {
    const row = rowFromBook(obj?.book ?? obj);
    if (row) byId.set(row.external_id, row);
  });

  return [...byId.values()];
}

const home = await fetch(HOME_URL, { headers: { 'User-Agent': USER_AGENT } });
if (!home.ok) throw new Error(`Ridi home failed ${home.status}`);
const nextData = extractNextData(await home.text());
const apiUrls = collectApiUrls(nextData);
const rowsById = new Map();

console.log(`Ridi API urls: ${apiUrls.length}`);

for (const [index, url] of apiUrls.entries()) {
  try {
    const json = await fetchJson(url);
    for (const row of collectRowsFromJson(json)) rowsById.set(row.external_id, row);
  } catch (error) {
    console.warn(`skip ${url}: ${error.message}`);
  }
  console.log(`${index + 1}/${apiUrls.length}, rows=${rowsById.size}`);
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const rows = [...rowsById.values()].sort((a, b) => a.title.localeCompare(b.title, 'ko'));

await mkdir('data/sources', { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} Ridi source rows to ${OUTPUT}`);
