const TITLE_METADATA_TERMS = [
  '이용권',
  '단행본',
  '개정판',
  '완전판',
  '완결',
  '외전',
  '소장판',
  '컬러판',
  '고화질',
  '웹툰',
  '웹툰판',
  '19세',
  '15세',
  'bl',
  'gl',
  '라르고',
  '솔트',
  '인디고',
  '볼레로',
  '블러',
  '미즈',
  '페어리',
  '코믹',
  '코이',
  '코이돌체',
  '그레이로맨스',
  '할리퀸',
  '황성',
  '소장세트',
  '할인세트',
  '시즌완결',
  '올컬러',
];

function isMetadataChunk(value) {
  const normalized = String(value ?? '').normalize('NFKC').trim().toLowerCase();
  if (!normalized) return false;
  if (/총\s*\d+\s*권/.test(normalized)) return true;
  if (/^\d+%\s*[▼↓]?\s*(소장|할인)?세트$/.test(normalized)) return true;
  return TITLE_METADATA_TERMS.some((term) => normalized.includes(term));
}

function removeMetadataSuffixes(title) {
  return title
    .replace(/(?:\s+|[-–—]\s*)(?:개정판|웹툰판|완전판|컬러웹툰)\s*$/gi, '')
    .replace(/(?:\s+|[-–—]\s*)(?:완결|시즌완결)\s*$/gi, '')
    .trim();
}

export function cleanDisplayTitle(title) {
  let cleaned = String(title ?? '').normalize('NFKC').trim();
  if (!cleaned) return '';

  cleaned = cleaned.replace(/^\s*\(\s*이용권\s*\)\s*/gi, '');
  cleaned = removeMetadataSuffixes(cleaned);

  let previous = '';
  while (previous !== cleaned) {
    previous = cleaned;
    cleaned = cleaned
      .replace(/\s*\[[^\]]+\]\s*/g, ' ')
      .replace(/\s*\(([^\)]+)\)\s*/g, (match, content) => (isMetadataChunk(content) ? ' ' : match));
    cleaned = removeMetadataSuffixes(cleaned);
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

export function isKakaoExcludedTitle(title) {
  const normalized = cleanDisplayTitle(title).replace(/\s+/g, '');
  return /(?:작가모음|모음전|모음집|컬렉션|패키지|세트$|소장세트|할인세트|총\d+권|스페셜웹툰|공모전|수상작|옴니버스|웹툰창작아카데미|웹툰총력전|ost|콜라보웹툰|단편집)/i.test(normalized);
}

export function normalizeTitle(title) {
  return cleanDisplayTitle(title)
    .replace(/[~!@#$%^&*_=+|\\:;"'<>,.?/`·ㆍ…\s-]/g, '')
    .trim()
    .toLowerCase();
}
