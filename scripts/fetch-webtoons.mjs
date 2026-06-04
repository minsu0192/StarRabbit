/**
 * 네이버 웹툰 공개 API에서 연재 중인 웹툰을 가져와 Supabase에 upsert하는 스크립트.
 *
 * 실행 방법:
 *   node --env-file=.env.local scripts/fetch-webtoons.mjs
 *
 * 필요한 환경변수 (.env.local에 추가):
 *   SUPABASE_SERVICE_ROLE_KEY=...  (Supabase 대시보드 > Project Settings > API > service_role)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NAVER_API = 'https://comic.naver.com/api/webtoon/titlelist/weekday';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수 누락:');
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!SERVICE_ROLE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY (Supabase 대시보드 > Project Settings > API > service_role)');
  process.exit(1);
}

async function fetchDayWebtoons(day) {
  const url = `${NAVER_API}?week=${day}&order=VIEW&startIndex=0&perPage=300`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for day=${day}`);
  const json = await res.json();
  return json.titleList ?? [];
}

async function fetchAllNaverWebtoons() {
  const seen = new Set();
  const all = [];

  for (const day of DAYS) {
    process.stdout.write(`  ${day} 로드 중...`);
    const items = await fetchDayWebtoons(day);
    let added = 0;
    for (const item of items) {
      if (!seen.has(item.titleId)) {
        seen.add(item.titleId);
        all.push(item);
        added++;
      }
    }
    console.log(` ${items.length}개 (신규 ${added}개)`);
    await new Promise((r) => setTimeout(r, 300));
  }

  return all;
}

function mapNaverWebtoon(item) {
  const author = item.author ?? item.writers?.map((w) => w.name).join(', ') ?? '미상';
  return {
    title: item.titleName.trim(),
    author: author.trim(),
    platform: 'naver',
    genre: null,
    status: item.finish ? 'completed' : 'ongoing',
  };
}

async function upsertBatch(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoons?on_conflict=title,author`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase 오류: ${text}`);
  }
}

(async () => {
  console.log('=== 별토끼 웹툰 데이터 수집 ===\n');
  console.log('[1/2] 네이버 웹툰 수집 중...');

  const items = await fetchAllNaverWebtoons();
  console.log(`\n총 ${items.length}개 수집 완료 (중복 제거됨)\n`);

  console.log('[2/2] Supabase에 저장 중...');
  const rows = items.map(mapNaverWebtoon).filter((r) => r.title && r.author);

  const BATCH = 200;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    await upsertBatch(rows.slice(i, i + BATCH));
    done += Math.min(BATCH, rows.length - i);
    console.log(`  ${done}/${rows.length} 처리됨`);
  }

  console.log('\n✅ 완료! Supabase 대시보드 > Table Editor > webtoons 에서 확인하세요.');
})();
