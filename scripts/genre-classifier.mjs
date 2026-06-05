const GENRE_RULES = [
  {
    genre: '무협',
    patterns: [
      /무림|무협|화산|천마|마교|강호|검성|검신|검귀|검제|검왕|검술|검객|검황|사파|정파|장문|비뢰도|고수|낭인|협객|혈마|구파일방/,
    ],
  },
  {
    genre: '판타지',
    patterns: [
      /판타지|마법|마왕|용사|던전|레벨|헌터|탑|드래곤|이세계|전생|환생|회귀|빙의|성좌|스킬|랭커|게이트|네크로|악마|신화|정령|공작|황제|황녀|성녀|대마법사/,
    ],
  },
  {
    genre: '액션',
    patterns: [
      /액션|싸움|격투|전쟁|전투|킬러|암살|히어로|빌런|갱|조폭|느와르|범죄|복수|경호|용병|파이터|스파이|서바이벌|생존/,
    ],
  },
  {
    genre: '스릴러',
    patterns: [
      /스릴러|미스터리|미스테리|추리|살인|사건|형사|탐정|감금|괴담|악몽|비밀|범인|시체|데스|게임/,
    ],
  },
  {
    genre: '공포',
    patterns: [
      /공포|귀신|괴물|좀비|유령|저주|악령|호러|괴기|심령/,
    ],
  },
  {
    genre: '로맨스',
    patterns: [
      /로맨스|사랑|연애|첫사랑|남친|여친|남편|아내|결혼|이혼|신부|신랑|커플|웨딩|짝사랑|고백|하트|키스|공주님|악녀|영애/,
    ],
  },
  {
    genre: '학원',
    patterns: [
      /학교|학원|고교|고등|중학|대학|학생|선생|교실|동급생|일진|전학생|입시|수업|캠퍼스/,
    ],
  },
  {
    genre: '스포츠',
    patterns: [
      /야구|축구|농구|배구|격투기|복싱|테니스|골프|수영|육상|스포츠|탁구|유도|검도|태권도|피겨|레이싱/,
    ],
  },
  {
    genre: '개그',
    patterns: [
      /개그|코믹|병맛|웃긴|유머|시트콤|바보|개그만화/,
    ],
  },
  {
    genre: '일상',
    patterns: [
      /일상|생활|밥|요리|카페|회사|직장|가족|육아|집사|동네|자취|반려|고양이|강아지|편의점/,
    ],
  },
  {
    genre: '드라마',
    patterns: [
      /드라마|인생|가족|성장|청춘|기억|비밀|친구|엄마|아빠|사람|우리|그녀|그놈|그남자|그여자/,
    ],
  },
];

const TITLE_OVERRIDES = new Map([
  ['신의 탑', '판타지'],
  ['전지적 독자 시점', '판타지'],
  ['나 혼자 만렙 뉴비', '판타지'],
  ['나 혼자 탑에서 농사', '판타지'],
  ['66666년만에 환생한 흑마법사', '판타지'],
  ['화산귀환', '무협'],
  ['나노마신', '무협'],
  ['광마회귀', '무협'],
  ['입학용병', '액션'],
  ['외모지상주의', '액션'],
  ['싸움독학', '액션'],
  ['퀘스트지상주의', '액션'],
  ['약한영웅', '액션'],
  ['캐슬', '액션'],
  ['프리드로우', '학원'],
  ['연애혁명', '로맨스'],
  ['여신강림', '로맨스'],
  ['내 아이디는 강남미인!', '로맨스'],
  ['윈드브레이커', '스포츠'],
  ['가비지타임', '스포츠'],
  ['소녀의 세계', '드라마'],
  ['유미의 세포들', '로맨스'],
]);

export const VALID_GENRES = ['로맨스', '드라마', '판타지', '액션', '무협', '학원', '일상', '개그', '스릴러', '공포', '스포츠'];

function normalizeTitle(title) {
  return String(title ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function inferGenre({ title, genre, sourceGenres = [] }) {
  const existing = normalizeTitle(genre);
  if (VALID_GENRES.includes(existing)) return existing;

  for (const sourceGenre of sourceGenres) {
    const normalized = normalizeTitle(sourceGenre);
    if (VALID_GENRES.includes(normalized)) return normalized;
  }

  const normalizedTitle = normalizeTitle(title);
  const override = TITLE_OVERRIDES.get(normalizedTitle);
  if (override) return override;

  for (const rule of GENRE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalizedTitle))) return rule.genre;
  }

  return null;
}
