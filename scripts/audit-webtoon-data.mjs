/**
 * Audit webtoon platform data in Supabase.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-webtoon-data.mjs
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NAVER_WEEKDAY_API = 'https://comic.naver.com/api/webtoon/titlelist/weekday';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const VERIFIED_KAKAO_TITLES = new Set([
  '나 혼자만 레벨업',
  '데뷔 못 하면 죽는 병 걸림',
]);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

function normalizeTitle(title) {
  return String(title ?? '').replace(/\s+/g, '').trim().toLowerCase();
}

async function fetchDbWebtoons() {
  const rows = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/webtoons?select=id,title,author,platform,status,reviews(id)&order=title.asc`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          Range: `${from}-${from + pageSize - 1}`,
        },
      }
    );
    if (!res.ok) throw new Error(`Supabase read failed: ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function fetchNaverOngoingIndex() {
  const byTitle = new Map();

  for (const day of DAYS) {
    const url = `${NAVER_WEEKDAY_API}?week=${day}&order=VIEW&startIndex=0&perPage=500`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Naver API failed: ${res.status} day=${day}`);
    const json = await res.json();
    for (const item of json.titleList ?? []) {
      const title = item.titleName ?? '';
      const author = item.author ?? item.writers?.map((w) => w.name).join(' / ') ?? '';
      byTitle.set(normalizeTitle(title), { title, author, status: item.finish ? 'completed' : 'ongoing' });
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return byTitle;
}

function printRows(title, rows) {
  console.log(`\n${title} (${rows.length})`);
  for (const row of rows) {
    console.log(
      `- ${row.title} / ${row.author} / ${row.platform} / ${row.status} / reviews=${row.reviews?.length ?? 0} / ${row.id}`
    );
  }
}

const rows = await fetchDbWebtoons();
const naverOngoing = await fetchNaverOngoingIndex();

const counts = rows.reduce((acc, row) => {
  acc[row.platform] = (acc[row.platform] ?? 0) + 1;
  return acc;
}, {});

const byTitle = new Map();
for (const row of rows) {
  const key = normalizeTitle(row.title);
  if (!byTitle.has(key)) byTitle.set(key, []);
  byTitle.get(key).push(row);
}

const crossPlatformDuplicates = [...byTitle.values()]
  .filter((group) => new Set(group.map((row) => row.platform)).size > 1)
  .flat();

const naverTitleButNotNaver = rows.filter(
  (row) => row.platform !== 'naver' && naverOngoing.has(normalizeTitle(row.title))
);

const kakaoRows = rows.filter((row) => row.platform === 'kakao');
const unverifiedKakaoRows = kakaoRows.filter((row) => !VERIFIED_KAKAO_TITLES.has(row.title));

console.log('=== Webtoon Data Audit ===');
console.log(`Total: ${rows.length}`);
console.log('By platform:', counts);
console.log(`Naver ongoing source index: ${naverOngoing.size}`);

printRows('Cross-platform duplicate titles', crossPlatformDuplicates);
printRows('Rows found in Naver ongoing source but not marked naver', naverTitleButNotNaver);
printRows('Kakao rows', kakaoRows);
printRows('Unverified Kakao rows; manually verify before keeping', unverifiedKakaoRows);

console.log('\nNotes:');
console.log('- Naver ongoing source is machine-checkable through the Naver public title list endpoint.');
console.log('- Completed Naver titles and most Kakao/KakaoPage titles still need crawler or manual source URL verification.');
console.log('- Do not run scripts/seed-kakao.mjs for production data.');
