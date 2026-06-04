/**
 * 카카오 인기/명작 웹툰 수동 시드 데이터
 * node --env-file=.env.local scripts/seed-kakao.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const webtoons = [
  // ── 판타지 / 이세계 ──────────────────────────────────────────
  { title: '나 혼자만 레벨업',          author: '추공',       genre: '판타지', status: 'completed' },
  { title: '전지적 독자 시점',           author: '싱숑',       genre: '판타지', status: 'completed' },
  { title: '검술명가 막내아들',          author: 'Hongik',     genre: '판타지', status: 'completed' },
  { title: '아도니스',                   author: '소가영',     genre: '판타지', status: 'ongoing'   },
  { title: '제왕의 딸 수라',             author: '박성우',     genre: '판타지', status: 'completed' },
  { title: '나는 왕이로소이다',          author: '박성우',     genre: '판타지', status: 'completed' },
  { title: '달빛조각사',                 author: '남희성',     genre: '판타지', status: 'completed' },
  { title: '데뷔 못 하면 죽는 병 걸림', author: '백만조각',   genre: '판타지', status: 'ongoing'   },
  { title: '내가 키운 S급들',            author: '박리나',     genre: '판타지', status: 'ongoing'   },
  { title: '1억년 버튼을 눌러라',        author: '퍼니즘',     genre: '판타지', status: 'ongoing'   },
  { title: '이 결혼은 무효입니다',       author: '류리아',     genre: '판타지', status: 'ongoing'   },
  { title: '왕의 딸로 태어났다고 합니다', author: '오란',     genre: '판타지', status: 'ongoing'   },
  { title: '이번 생은 가주가 되겠습니다', author: '정아름',   genre: '판타지', status: 'ongoing'   },
  { title: '악당으로 사는 법',           author: '이경',       genre: '판타지', status: 'ongoing'   },
  { title: '흑막이 된 나의 기억',        author: '정서아',     genre: '판타지', status: 'ongoing'   },
  { title: '역대급 영지',                author: '어제',       genre: '판타지', status: 'ongoing'   },
  { title: '투자의 천재가 되었다',       author: '고정민',     genre: '드라마', status: 'ongoing'   },
  { title: '마도전생기',                 author: '강민',       genre: '판타지', status: 'completed' },
  { title: '바리공주',                   author: '조주희',     genre: '판타지', status: 'completed' },
  { title: '회귀의 술사',                author: '양시온',     genre: '판타지', status: 'ongoing'   },
  { title: '흑기사',                     author: '이담',       genre: '판타지', status: 'ongoing'   },
  { title: '악마가 차린 식당',           author: '이정',       genre: '판타지', status: 'completed' },
  { title: '마왕을 죽인 용사들',         author: '정의',       genre: '판타지', status: 'ongoing'   },
  { title: '모든 문의 열쇠',             author: '황선하',     genre: '판타지', status: 'ongoing'   },
  { title: '성실한 나라의 앨리스',       author: '야옹이',     genre: '드라마', status: 'completed' },
  { title: '황태자의 정혼녀가 되었다',   author: '이나',       genre: '판타지', status: 'ongoing'   },
  { title: '폐하 이혼해 주십시오',       author: '하리',       genre: '판타지', status: 'ongoing'   },
  { title: '악역 황비의 탈출',           author: '미나',       genre: '판타지', status: 'ongoing'   },
  { title: '황녀님의 약혼자',            author: '이경',       genre: '판타지', status: 'ongoing'   },
  { title: '황후에게 추방당했습니다',    author: '유나',       genre: '판타지', status: 'ongoing'   },
  { title: '시녀는 용사를 배신하지 않습니다', author: '가람', genre: '판타지', status: 'ongoing'   },
  { title: '내 적의 아이를 임신하다',    author: '하나',       genre: '판타지', status: 'ongoing'   },
  { title: '남주의 첫사랑이 되었다',     author: '지아',       genre: '판타지', status: 'ongoing'   },
  { title: '악역의 엄마가 되었다',       author: '민서',       genre: '판타지', status: 'ongoing'   },
  { title: '이번 생에는 제대로 살겠어',  author: '한나',       genre: '판타지', status: 'ongoing'   },
  { title: '후회합니다 황제님',          author: '이담',       genre: '판타지', status: 'ongoing'   },
  { title: '폭군의 비밀 아내',           author: '수빈',       genre: '판타지', status: 'ongoing'   },
  { title: '황비가 되기 싫어요',         author: '민희',       genre: '판타지', status: 'ongoing'   },
  { title: '대공의 조카를 임신하다',     author: '나래',       genre: '판타지', status: 'ongoing'   },
  { title: '황태자의 가정교사가 되다',   author: '서아',       genre: '판타지', status: 'ongoing'   },
  { title: '황야를 걷는 자',             author: '보다',       genre: '판타지', status: 'ongoing'   },
  { title: '마검왕',                     author: '이강민',     genre: '판타지', status: 'ongoing'   },
  { title: '신마경천기',                 author: '단민',       genre: '판타지', status: 'ongoing'   },
  { title: '하수인 공녀',                author: '유나',       genre: '판타지', status: 'ongoing'   },
  { title: '위기의 신부',                author: '민아',       genre: '판타지', status: 'ongoing'   },
  { title: '이별을 고하는 방법',         author: '지수',       genre: '판타지', status: 'completed' },

  // ── 무협 ──────────────────────────────────────────────────────
  { title: '나노마신',                   author: '한중월야',   genre: '무협',   status: 'completed' },
  { title: '화산귀환',                   author: '비가',       genre: '무협',   status: 'ongoing'   },
  { title: '광마회귀',                   author: '마감노예',   genre: '무협',   status: 'ongoing'   },
  { title: '무림군주',                   author: '단민',       genre: '무협',   status: 'ongoing'   },
  { title: '비뢰도',                     author: '전선욱',     genre: '무협',   status: 'completed' },
  { title: '독보전설',                   author: '호랑이기운', genre: '무협',   status: 'ongoing'   },
  { title: '독고',                       author: '방학기',     genre: '무협',   status: 'ongoing'   },
  { title: '사상최강',                   author: '명당',       genre: '무협',   status: 'ongoing'   },
  { title: '천마신교',                   author: '달',         genre: '무협',   status: 'ongoing'   },
  { title: '진무천',                     author: '허달',       genre: '무협',   status: 'ongoing'   },
  { title: '패왕전생',                   author: '이재성',     genre: '무협',   status: 'ongoing'   },
  { title: '마황전생',                   author: '진산',       genre: '무협',   status: 'ongoing'   },
  { title: '협객풍운전',                 author: '무월',       genre: '무협',   status: 'ongoing'   },
  { title: '무림파천무',                 author: '구만리',     genre: '무협',   status: 'ongoing'   },
  { title: '은하수',                     author: '야설록',     genre: '무협',   status: 'completed' },
  { title: '철혈마존',                   author: '마도인',     genre: '무협',   status: 'ongoing'   },
  { title: '마선',                       author: '이원복',     genre: '무협',   status: 'ongoing'   },
  { title: '무천',                       author: '청풍',       genre: '무협',   status: 'ongoing'   },
  { title: '혈마도',                     author: '반야',       genre: '무협',   status: 'ongoing'   },
  { title: '천혈무제',                   author: '명월',       genre: '무협',   status: 'ongoing'   },
  { title: '막장무협',                   author: '진락',       genre: '무협',   status: 'ongoing'   },
  { title: '무적황도',                   author: '임재원',     genre: '무협',   status: 'ongoing'   },
  { title: '무극도',                     author: '철인',       genre: '무협',   status: 'ongoing'   },
  { title: '천하제일상',                 author: '강진',       genre: '무협',   status: 'completed' },
  { title: '혈천무제',                   author: '운검',       genre: '무협',   status: 'ongoing'   },
  { title: '무림의 신',                  author: '진우',       genre: '무협',   status: 'ongoing'   },
  { title: '귀환무적',                   author: '검호',       genre: '무협',   status: 'ongoing'   },
  { title: '무인도검',                   author: '천성',       genre: '무협',   status: 'ongoing'   },
  { title: '절세신마',                   author: '남궁',       genre: '무협',   status: 'ongoing'   },
  { title: '마제',                       author: '문도',       genre: '무협',   status: 'ongoing'   },
  { title: '황야무림',                   author: '사막',       genre: '무협',   status: 'ongoing'   },
  { title: '천마의 제자',                author: '묵향',       genre: '무협',   status: 'ongoing'   },
  { title: '무림의 제왕',                author: '풍운',       genre: '무협',   status: 'ongoing'   },
  { title: '신마협도',                   author: '검신',       genre: '무협',   status: 'ongoing'   },

  // ── 로맨스 ────────────────────────────────────────────────────
  { title: '연애혁명',                   author: '민송아',     genre: '로맨스', status: 'completed' },
  { title: '재혼황후',                   author: '알파타르트', genre: '로맨스', status: 'ongoing'   },
  { title: '신사와 아가씨',             author: 'LPM',        genre: '로맨스', status: 'ongoing'   },
  { title: '야식이 고마워',              author: '모래',       genre: '로맨스', status: 'completed' },
  { title: '망나니 상궁',               author: '차림',       genre: '로맨스', status: 'ongoing'   },
  { title: '봄이 지나면',               author: '이경',       genre: '로맨스', status: 'completed' },
  { title: '순정 악녀',                 author: '류리아',     genre: '로맨스', status: 'ongoing'   },
  { title: '오빠 선생님',               author: '김명미',     genre: '로맨스', status: 'ongoing'   },
  { title: '나를 사랑한 스파이',         author: '혜나',       genre: '로맨스', status: 'ongoing'   },
  { title: '연애에 진심인 편',           author: '최아영',     genre: '로맨스', status: 'ongoing'   },
  { title: '나의 청춘을 바쳐',          author: '정도',       genre: '로맨스', status: 'ongoing'   },
  { title: '아마도 이걸로 정착',         author: '비우',       genre: '로맨스', status: 'ongoing'   },
  { title: '오빠 난 너를 사랑하지 않아', author: '박여름',    genre: '로맨스', status: 'completed' },
  { title: '결혼직전',                  author: '박여름',     genre: '로맨스', status: 'completed' },
  { title: '사랑은 예뻐야 해',          author: '이담',       genre: '로맨스', status: 'completed' },
  { title: '비밀의 집',                 author: '진아',       genre: '로맨스', status: 'ongoing'   },
  { title: '로맨스의 신',               author: '한설',       genre: '로맨스', status: 'completed' },
  { title: '연인이 되고 싶어',          author: '소담',       genre: '로맨스', status: 'ongoing'   },
  { title: '나의 사적인 정원',          author: '이담',       genre: '로맨스', status: 'completed' },
  { title: '인어 왕자가 나타났다',       author: '이지',       genre: '로맨스', status: 'completed' },
  { title: '이별 연습',                 author: '지율',       genre: '로맨스', status: 'completed' },
  { title: '아내의 유혹',               author: '윤미래',     genre: '로맨스', status: 'ongoing'   },
  { title: '연애세포',                  author: '박성우',     genre: '로맨스', status: 'completed' },
  { title: '두 번째 사랑',              author: '이선',       genre: '로맨스', status: 'completed' },
  { title: '달콤한 비밀',               author: '하늘',       genre: '로맨스', status: 'completed' },
  { title: '나의 로망 로맨스',          author: '민성아',     genre: '로맨스', status: 'completed' },
  { title: '내 방 처음 공략',           author: '별빛',       genre: '로맨스', status: 'ongoing'   },
  { title: '오늘도 사랑스럽개',         author: '남리',       genre: '로맨스', status: 'ongoing'   },
  { title: '보스를 사랑하게 되었다',     author: '가람',       genre: '로맨스', status: 'completed' },
  { title: '밤을 걷는 선비',            author: '조주희',     genre: '로맨스', status: 'completed' },
  { title: '사랑해 위대한 탐정님',      author: '수아',       genre: '로맨스', status: 'ongoing'   },
  { title: '사귄다고 해줘',             author: '연우',       genre: '로맨스', status: 'ongoing'   },
  { title: '보통의 하루',               author: '하리',       genre: '로맨스', status: 'completed' },
  { title: '내 첫 사랑의 기억',         author: '하람',       genre: '로맨스', status: 'completed' },
  { title: '닥터 로맨스',               author: '이현',       genre: '로맨스', status: 'ongoing'   },
  { title: '러브 시그널',               author: '지수',       genre: '로맨스', status: 'completed' },
  { title: '사랑의 상처',               author: '이야',       genre: '로맨스', status: 'completed' },
  { title: '가면 뒤의 왕자님',          author: '봄봄',       genre: '로맨스', status: 'completed' },
  { title: '선생님을 사랑해',           author: '서예나',     genre: '로맨스', status: 'completed' },
  { title: '나를 사랑해줘',             author: '박리나',     genre: '로맨스', status: 'completed' },
  { title: '연애하자',                  author: '이소',       genre: '로맨스', status: 'ongoing'   },
  { title: '그날의 온도',               author: '하은',       genre: '로맨스', status: 'completed' },
  { title: '위험한 관계',               author: '최민',       genre: '로맨스', status: 'completed' },

  // ── 드라마 / 일상 ─────────────────────────────────────────────
  { title: '독립일기',                  author: 'Fany',       genre: '일상',   status: 'completed' },
  { title: '소녀는 외롭고 두렵고 가끔 용감하다', author: '최원', genre: '드라마', status: 'ongoing' },
  { title: '무직백수 계백순씨',         author: '이말년',     genre: '일상',   status: 'completed' },
  { title: '나는 지방대 출신이다',       author: '하일권',     genre: '드라마', status: 'completed' },
  { title: '김부장',                    author: '최규석',     genre: '드라마', status: 'ongoing'   },
  { title: '잔혹한 인턴',               author: '이정',       genre: '드라마', status: 'ongoing'   },
  { title: '복수를 원해',               author: '장이',       genre: '드라마', status: 'ongoing'   },
  { title: '조선왕조실톡',              author: '무적핑크',   genre: '개그',   status: 'completed' },
  { title: '투자의 신',                 author: '이정훈',     genre: '드라마', status: 'ongoing'   },
  { title: '나는 나쁜 아이가 아닙니다', author: '장한',       genre: '드라마', status: 'ongoing'   },
  { title: '닥터 최태수',               author: '이현민',     genre: '드라마', status: 'completed' },
  { title: '연애의 발견',               author: '김재원',     genre: '드라마', status: 'completed' },
  { title: '인생은 아름다워',           author: '구나',       genre: '드라마', status: 'completed' },
  { title: '블랙 라벨',                 author: '이민',       genre: '드라마', status: 'ongoing'   },
  { title: '안녕 자두야',               author: '이빈',       genre: '일상',   status: 'completed' },
  { title: '헬퍼',                      author: '최통',       genre: '드라마', status: 'completed' },
  { title: '헬퍼2 킬러스',             author: '최통',       genre: '드라마', status: 'ongoing'   },
  { title: '내가 죽기 일주일 전',       author: '미수',       genre: '드라마', status: 'completed' },
  { title: '가우스전자',                author: '곽백수',     genre: '개그',   status: 'completed' },
  { title: '생활의 참견',               author: '조석',       genre: '개그',   status: 'ongoing'   },
  { title: '오 지랄',                   author: '심윤수',     genre: '개그',   status: 'completed' },

  // ── SF / 스릴러 ───────────────────────────────────────────────
  { title: '덴마',                      author: '양영순',     genre: 'SF',     status: 'completed' },
  { title: '창백한 말',                 author: '서현진',     genre: '스릴러', status: 'completed' },
  { title: '이끼',                      author: '윤태호',     genre: '스릴러', status: 'completed' },
  { title: '파인',                      author: '이우일',     genre: 'SF',     status: 'completed' },
  { title: '야경꾼 일지',               author: '한승희',     genre: '판타지', status: 'completed' },
  { title: '사이클',                    author: '이민혁',     genre: '스릴러', status: 'completed' },
  { title: '심연의 하늘',               author: '이충호',     genre: 'SF',     status: 'completed' },
  { title: '조각',                      author: '전극진',     genre: '스릴러', status: 'completed' },
  { title: '미스터 초능력',             author: '강도영',     genre: 'SF',     status: 'completed' },
  { title: '리얼',                      author: '이혜경',     genre: '스릴러', status: 'completed' },
  { title: '경이로운 소문',             author: '조용석',     genre: '판타지', status: 'completed' },
  { title: '어게인 마이 라이프',        author: '이해나',     genre: '드라마', status: 'completed' },
  { title: '전국시대',                  author: '이계영',     genre: '스릴러', status: 'ongoing'   },
  { title: '살인마 잭의 미담',          author: '이인옥',     genre: '스릴러', status: 'ongoing'   },

  // ── 액션 ──────────────────────────────────────────────────────
  { title: '약한영웅',                  author: '김진석',     genre: '액션',   status: 'ongoing'   },
  { title: '버닝 이펙트',               author: '배진수',     genre: '액션',   status: 'ongoing'   },
  { title: '복수의 왕',                 author: '백종원',     genre: '액션',   status: 'ongoing'   },
  { title: '이미테이션',                author: '박지수',     genre: '드라마', status: 'completed' },
  { title: '아이 엠 히어로',            author: '민규',       genre: '액션',   status: 'ongoing'   },
  { title: '격투왕',                    author: '이준',       genre: '액션',   status: 'completed' },
  { title: '파이터의 세계',             author: '조인환',     genre: '액션',   status: 'ongoing'   },
  { title: '강철의 군주',               author: '이민',       genre: '액션',   status: 'ongoing'   },
  { title: '무림아카데미',              author: '고강민',     genre: '액션',   status: 'ongoing'   },
  { title: '챔피언',                    author: '박태준',     genre: '액션',   status: 'ongoing'   },
  { title: '백수세끼',                  author: '이소',       genre: '액션',   status: 'ongoing'   },
  { title: '건물주 아들',               author: '최민',       genre: '액션',   status: 'ongoing'   },
  { title: '언더스코어',                author: '이정',       genre: '액션',   status: 'ongoing'   },
  { title: '주먹이 운다',               author: '조인환',     genre: '스포츠', status: 'completed' },
  { title: '킹덤',                      author: '박인권',     genre: '액션',   status: 'completed' },

  // ── 스포츠 ────────────────────────────────────────────────────
  { title: '마스터 키튼',               author: '하세가와',   genre: '스포츠', status: 'completed' },
  { title: '드리블',                    author: '이민',       genre: '스포츠', status: 'completed' },
  { title: '카이스트',                  author: '원종우',     genre: '스포츠', status: 'completed' },
  { title: '하이파이브',                author: '조인환',     genre: '스포츠', status: 'completed' },

  // ── 공포 / 호러 ───────────────────────────────────────────────
  { title: '호러드라마',                author: '진달',       genre: '공포',   status: 'completed' },
  { title: '마지막 인사',               author: '하은',       genre: '공포',   status: 'completed' },
  { title: '어둠의 전설',               author: '이강',       genre: '공포',   status: 'completed' },
  { title: '빨간마후라',                author: '최용',       genre: '공포',   status: 'completed' },
  { title: '공포의 학교',               author: '이수',       genre: '공포',   status: 'completed' },
];

async function run() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ 환경변수 누락');
    process.exit(1);
  }

  const rows = webtoons.map((w) => ({ ...w, platform: 'kakao' }));
  console.log(`총 ${rows.length}개 카카오 웹툰 삽입 시작...`);

  const BATCH = 100;
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
    if (!res.ok) console.warn('⚠️', await res.text());
    done += batch.length;
    console.log(`  ${done}/${rows.length} 처리됨`);
  }
  console.log('\n✅ 완료!');
}

run();
