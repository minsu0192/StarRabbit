const BLOCKED = [
  '씨발', '씨팔', '시발', '시팔', '씨바', '시바',
  '개새끼', '개새기', '개새',
  '병신', '병쉰', '븅신',
  '지랄',
  '미친놈', '미친년', '미친새끼', '미친넘',
  '느금마', '니애미', '니어미',
  '창녀', '창년',
  '찐따', '찐따',
  '보지', '자지',
  '섹스', '섹쓰',
];

const NORMALIZED = BLOCKED.map((w) => w.replace(/\s+/g, '').toLowerCase());

export function containsProfanity(text: string): boolean {
  const normalized = text.replace(/\s+/g, '').toLowerCase();
  return NORMALIZED.some((w) => normalized.includes(w));
}

// URL이나 외부 링크 홍보글 감지
export function containsPromoLink(text: string): boolean {
  return /https?:\/\/|www\.|\.com|\.net|\.xyz|카톡|텔레그램|라인 아이디|@[a-z0-9_]{3,}/i.test(text);
}
