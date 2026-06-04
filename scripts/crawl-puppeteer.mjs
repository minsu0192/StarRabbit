/**
 * Playwright로 네이버 완결 웹툰 + 카카오 웹툰을 크롤링해 Supabase에 upsert하는 스크립트
 *
 * 실행 방법:
 *   node --env-file=.env.local scripts/crawl-puppeteer.mjs
 */

import { chromium } from 'playwright';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수 누락 (.env.local 확인)');
  process.exit(1);
}

// ─── Supabase upsert ──────────────────────────────────────────────────────

async function upsertWebtoons(rows) {
  if (rows.length === 0) return 0;
  const BATCH = 300;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/webtoons?on_conflict=title,author`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) console.warn(`  ⚠️  ${await res.text()}`);
    done += batch.length;
    console.log(`  ${done}/${rows.length} 처리됨`);
  }
  return done;
}

// ─── 네이버 완결 웹툰 ────────────────────────────────────────────────────

async function crawlNaverCompleted(browser) {
  console.log('\n[1/3] 네이버 완결 웹툰 수집 중...');
  const page = await browser.newPage();
  const captured = new Map();
  let foundEndpoint = null;

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('comic.naver.com/api/webtoon/titlelist')) return;
    try {
      const json = await response.json();
      const items = json.titleList ?? [];
      if (items.length > 0) {
        foundEndpoint = url;
        items.forEach((w) => captured.set(w.titleId, w));
        process.stdout.write(`\r  수집 중... ${captured.size}개`);
      }
    } catch {}
  });

  await page.goto('https://comic.naver.com/webtoon?tab=finish', { waitUntil: 'domcontentloaded' });

  // 스크롤로 페이지 내 전체 로드
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1000);
  await page.close();

  // 발견된 API 엔드포인트로 나머지 페이지 직접 수집
  if (foundEndpoint) {
    try {
      const baseUrl = new URL(foundEndpoint);
      const perPage = Number(baseUrl.searchParams.get('perPage') ?? 100);
      let startIndex = perPage;
      let emptyRounds = 0;
      while (emptyRounds < 2) {
        baseUrl.searchParams.set('startIndex', String(startIndex));
        const res = await fetch(baseUrl.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) break;
        const json = await res.json();
        const more = json.titleList ?? [];
        if (more.length === 0) break;
        const before = captured.size;
        more.forEach((w) => captured.set(w.titleId, w));
        if (captured.size === before) { emptyRounds++; } else { emptyRounds = 0; }
        process.stdout.write(`\r  수집 중... ${captured.size}개`);
        startIndex += perPage;
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch {}
  }

  const all = [...captured.values()];
  console.log(`\n  완료: ${all.length}개`);
  return all.map((w) => ({
    title: (w.titleName ?? '').trim(),
    author: (w.author ?? w.writers?.map((x) => x.name).join(', ') ?? '').trim(),
    platform: 'naver',
    genre: null,
    status: w.finish ? 'completed' : 'ongoing',
  })).filter((r) => r.title && r.author);
}

// ─── 카카오 웹툰 ─────────────────────────────────────────────────────────

async function crawlKakao(browser) {
  console.log('\n[2/3] 카카오 웹툰 수집 중...');
  const page = await browser.newPage();
  const captured = new Map();

  page.on('response', async (response) => {
    const ct = response.headers()['content-type'] ?? '';
    if (!ct.includes('application/json')) return;
    const url = response.url();
    if (!url.includes('kakao')) return;
    try {
      const json = await response.json();
      const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(walk); return; }
        // 카카오 웹툰 아이템 패턴
        if (obj.title && obj.id && (obj.author !== undefined || obj.singleDescription !== undefined)) {
          captured.set(String(obj.id), obj);
          process.stdout.write(`\r  수집 중... ${captured.size}개`);
        }
        Object.values(obj).forEach(walk);
      };
      walk(json);
    } catch {}
  });

  await page.goto('https://webtoon.kakao.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);

  // 장르 버튼 클릭 시도
  try {
    const buttons = await page.locator('[class*="genre"], [class*="category"]').all();
    for (const btn of buttons.slice(0, 8)) {
      await btn.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }
  } catch {}

  await page.close();

  const all = [...captured.values()];
  console.log(`\n  완료: ${all.length}개`);
  return all.map((w) => ({
    title: (w.title ?? '').trim(),
    author: (w.author ?? w.artists?.[0]?.name ?? '').trim(),
    platform: 'kakao',
    genre: w.genre ?? w.genres?.[0] ?? null,
    status: w.isEnd ? 'completed' : 'ongoing',
  })).filter((r) => r.title && r.author);
}

// ─── 카카오페이지 ────────────────────────────────────────────────────────

async function crawlKakaoPage(browser) {
  console.log('\n[3/3] 카카오페이지 수집 중...');
  const page = await browser.newPage();
  const captured = new Map();

  page.on('response', async (response) => {
    const ct = response.headers()['content-type'] ?? '';
    if (!ct.includes('application/json')) return;
    try {
      const json = await response.json();
      const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(walk); return; }
        if (obj.title && (obj.writingAuthorName || obj.authorName)) {
          const id = String(obj.id ?? obj.productId ?? obj.contentId ?? Math.random());
          captured.set(id, obj);
          process.stdout.write(`\r  수집 중... ${captured.size}개`);
        }
        Object.values(obj).forEach(walk);
      };
      walk(json);
    } catch {}
  });

  for (const menuId of ['10011', '10012', '10013']) {
    await page.goto(`https://page.kakao.com/menu/${menuId}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
      .catch(() => {});
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(1000);
  }
  await page.close();

  const all = [...captured.values()];
  console.log(`\n  완료: ${all.length}개`);
  return all.map((w) => ({
    title: (w.title ?? '').trim(),
    author: (w.writingAuthorName ?? w.authorName ?? '').trim(),
    platform: 'kakao',
    genre: w.genreName ?? null,
    status: w.isEnd || w.isComplete ? 'completed' : 'ongoing',
  })).filter((r) => r.title && r.author);
}

// ─── 메인 ────────────────────────────────────────────────────────────────

(async () => {
  console.log('=== 별토끼 크롤러 (Playwright) ===\n');

  const browser = await chromium.launch({ headless: true });

  try {
    const naverRows  = await crawlNaverCompleted(browser);
    const kakaoRows  = await crawlKakao(browser);
    const kpRows     = await crawlKakaoPage(browser);

    const total = naverRows.length + kakaoRows.length + kpRows.length;
    console.log(`\n수집 합계: 네이버완결 ${naverRows.length} + 카카오 ${kakaoRows.length} + 카카오페이지 ${kpRows.length} = ${total}개`);
    console.log('\nSupabase에 저장 중...');

    await upsertWebtoons(naverRows);
    await upsertWebtoons(kakaoRows);
    await upsertWebtoons(kpRows);

    console.log('\n✅ 완료!');
  } finally {
    await browser.close();
  }
})();
