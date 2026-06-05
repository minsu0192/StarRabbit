type TierName = '길토끼' | '풀토끼' | '들토끼' | '달토끼' | '별토끼' | '은하토끼' | '우주토끼' | '전설토끼';

const THEMES: Record<TierName, {
  earOuter: string; earInner: string; face: string; cheek: string; stroke: string;
}> = {
  '길토끼': { earOuter: '#e2e8f0', earInner: '#94a3b8', face: '#f8fafc', cheek: '#fda4af', stroke: '#e2e8f0' },
  '풀토끼': { earOuter: '#bbf7d0', earInner: '#4ade80', face: '#f0fdf4', cheek: '#86efac', stroke: '#bbf7d0' },
  '들토끼': { earOuter: '#86efac', earInner: '#22c55e', face: '#f0fdf4', cheek: '#4ade80', stroke: '#86efac' },
  '달토끼': { earOuter: '#93c5fd', earInner: '#3b82f6', face: '#eff6ff', cheek: '#93c5fd', stroke: '#bfdbfe' },
  '별토끼': { earOuter: '#fde68a', earInner: '#f59e0b', face: '#fffbeb', cheek: '#fcd34d', stroke: '#fde68a' },
  '은하토끼': { earOuter: '#f0abfc', earInner: '#d946ef', face: '#fdf4ff', cheek: '#e879f9', stroke: '#f5d0fe' },
  '우주토끼': { earOuter: '#c4b5fd', earInner: '#7c3aed', face: '#f5f3ff', cheek: '#a78bfa', stroke: '#ddd6fe' },
  '전설토끼': { earOuter: '#fecdd3', earInner: '#f43f5e', face: '#fff1f2', cheek: '#fb7185', stroke: '#fecdd3' },
};

/* 귀 사이 왕관 영역 (x≈33~67, y≈2~28) 에 배치되는 등급 액세서리 */
function Crown({ tier }: { tier: TierName }) {
  switch (tier) {
    case '길토끼':
      return (
        /* 작은 발자국 세 개 — 이제 막 시작한 토끼 */
        <>
          <circle cx="44" cy="17" r="4" fill="#cbd5e1" opacity="0.7" />
          <circle cx="56" cy="17" r="4" fill="#cbd5e1" opacity="0.7" />
          <circle cx="50" cy="10" r="3.2" fill="#94a3b8" opacity="0.5" />
        </>
      );
    case '풀토끼':
      return (
        /* 새싹 — 귀 사이에서 쑥쑥 자라는 새 생명 */
        <>
          <line x1="50" y1="29" x2="50" y2="12" stroke="#65a30d" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="43" cy="19" rx="9" ry="4" fill="#84cc16" transform="rotate(-32,43,19)" />
          <ellipse cx="57" cy="16" rx="9" ry="4" fill="#a3e635" transform="rotate(32,57,16)" />
          <circle cx="50" cy="11" r="5" fill="#4ade80" />
          <circle cx="50" cy="11" r="2.5" fill="#166534" />
        </>
      );
    case '들토끼':
      return (
        /* 네잎클로버 — 행운 */
        <>
          <circle cx="50" cy="9"  r="6.5" fill="#4ade80" opacity="0.95" />
          <circle cx="50" cy="23" r="6.5" fill="#4ade80" opacity="0.95" />
          <circle cx="43" cy="16" r="6.5" fill="#22c55e" opacity="0.95" />
          <circle cx="57" cy="16" r="6.5" fill="#22c55e" opacity="0.95" />
          <circle cx="50" cy="16" r="4.5" fill="#16a34a" />
          <line x1="50" y1="23" x2="50" y2="31" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" />
        </>
      );
    case '달토끼':
      return (
        /* 황금 초승달 + 작은 별들 */
        <>
          <path
            fillRule="evenodd"
            d="M50,4 A12,12,0,1,0,50,28 A12,12,0,1,0,50,4 Z M55,7 A9,9,0,1,0,55,25 A9,9,0,1,0,55,7 Z"
            fill="#fcd34d"
          />
          <circle cx="36" cy="9"  r="2"   fill="#fde68a" opacity="0.9" />
          <circle cx="66" cy="14" r="1.7" fill="#fde68a" opacity="0.9" />
          <circle cx="39" cy="24" r="1.3" fill="#fde68a" opacity="0.6" />
        </>
      );
    case '별토끼':
      return (
        /* 오각별 + 반짝이 */
        <>
          <polygon
            transform="translate(50,16)"
            points="0,-13 3,-4.3 12.4,-4 5.1,1.6 7.6,11 0,5.5 -7.6,11 -5.1,1.6 -12.4,-4 -3,-4.3"
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="0.7"
          />
          <circle cx="35" cy="11" r="2.2" fill="#fcd34d" opacity="0.85" />
          <circle cx="65" cy="11" r="2.2" fill="#fcd34d" opacity="0.85" />
          <circle cx="33" cy="22" r="1.5" fill="#fde68a" opacity="0.6" />
          <circle cx="67" cy="22" r="1.5" fill="#fde68a" opacity="0.6" />
        </>
      );
    case '은하토끼':
      return (
        /* 마법 스파클 별 + 위성 */
        <>
          <path d="M50,4 L52,12 L59,14 L52,16 L50,24 L48,16 L41,14 L48,12 Z" fill="#e879f9" />
          <path d="M36,7 L37.2,11.5 L41,12 L37.2,12.5 L36,17 L34.8,12.5 L31,12 L34.8,11.5 Z" fill="#c084fc" opacity="0.9" />
          <path d="M64,7 L65.2,11.5 L69,12 L65.2,12.5 L64,17 L62.8,12.5 L59,12 L62.8,11.5 Z" fill="#c084fc" opacity="0.9" />
          <circle cx="44" cy="24" r="1.8" fill="#f0abfc" opacity="0.7" />
          <circle cx="56" cy="24" r="1.8" fill="#f0abfc" opacity="0.7" />
        </>
      );
    case '우주토끼':
      return (
        /* 토성형 행성 (링이 귀 뒤로 사라지는 효과) */
        <>
          {/* 링 뒷부분 (귀 뒤) */}
          <ellipse cx="50" cy="16" rx="20" ry="6" fill="none" stroke="#6d28d9" strokeWidth="3.5" opacity="0.35" />
          {/* 행성 본체 */}
          <circle cx="50" cy="16" r="11" fill="#6d28d9" />
          {/* 행성 표면 하이라이트 */}
          <ellipse cx="46" cy="12" rx="5" ry="3" fill="#7c3aed" opacity="0.6" transform="rotate(-20,46,12)" />
          <ellipse cx="55" cy="20" rx="3" ry="2" fill="#4c1d95" opacity="0.5" />
          {/* 링 앞부분 */}
          <ellipse cx="50" cy="16" rx="20" ry="6" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeDasharray="28 12" />
        </>
      );
    case '전설토끼':
      return (
        /* 왕관 + 보석 */
        <>
          <path d="M35,27 L37,14 L44,22 L50,10 L56,22 L63,14 L65,27 Z" fill="#f43f5e" />
          <rect x="35" y="25" width="30" height="5" rx="2" fill="#e11d48" />
          {/* 왕관 보석 */}
          <circle cx="50" cy="11.5" r="3.5" fill="#fbbf24" />
          <circle cx="37.5" cy="14.5" r="2.5" fill="#fb923c" />
          <circle cx="62.5" cy="14.5" r="2.5" fill="#fb923c" />
          {/* 띠 보석 */}
          <circle cx="43" cy="27.5" r="1.8" fill="#fcd34d" />
          <circle cx="50" cy="27.5" r="1.8" fill="#fcd34d" />
          <circle cx="57" cy="27.5" r="1.8" fill="#fcd34d" />
        </>
      );
    default:
      return null;
  }
}

const VALID_TIERS = Object.keys(THEMES) as TierName[];

export default function TierBunny({ tier, size = 96 }: { tier: string; size?: number }) {
  const name = (VALID_TIERS.includes(tier as TierName) ? tier : '길토끼') as TierName;
  const t = THEMES[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${name} 마스코트`}
    >
      {/* 귀 사이 액세서리 (귀 뒤에 렌더링) */}
      <Crown tier={name} />

      {/* 왼쪽 귀 */}
      <rect x="18" y="2" width="15" height="44" rx="7.5" fill={t.earOuter} stroke={t.stroke} strokeWidth="1.2" />
      <rect x="22" y="6" width="7" height="32" rx="3.5" fill={t.earInner} />
      {/* 오른쪽 귀 */}
      <rect x="67" y="2" width="15" height="44" rx="7.5" fill={t.earOuter} stroke={t.stroke} strokeWidth="1.2" />
      <rect x="71" y="6" width="7" height="32" rx="3.5" fill={t.earInner} />

      {/* 얼굴 */}
      <circle cx="50" cy="62" r="32" fill={t.face} stroke={t.stroke} strokeWidth="1.2" />

      {/* 볼터치 */}
      <circle cx="30" cy="66" r="6.5" fill={t.cheek} opacity="0.45" />
      <circle cx="70" cy="66" r="6.5" fill={t.cheek} opacity="0.45" />

      {/* 눈 */}
      <circle cx="38" cy="57" r="5.2" fill="#1e293b" />
      <circle cx="62" cy="57" r="5.2" fill="#1e293b" />
      <circle cx="40" cy="55" r="2.2" fill="white" />
      <circle cx="64" cy="55" r="2.2" fill="white" />

      {/* 코 */}
      <ellipse cx="50" cy="67.5" rx="3.2" ry="2.4" fill="#fda4af" />

      {/* 입 */}
      <path d="M44.5 72 Q50 77.5 55.5 72" stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
