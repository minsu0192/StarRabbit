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

function Crown({ tier }: { tier: TierName }) {
  switch (tier) {
    case '길토끼':
      return (
        <>
          <circle cx="44" cy="17" r="4" fill="#cbd5e1" opacity="0.7" />
          <circle cx="56" cy="17" r="4" fill="#cbd5e1" opacity="0.7" />
          <circle cx="50" cy="10" r="3.2" fill="#94a3b8" opacity="0.5" />
        </>
      );
    case '풀토끼':
      return (
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
        <>
          <path fillRule="evenodd" d="M50,4 A12,12,0,1,0,50,28 A12,12,0,1,0,50,4 Z M55,7 A9,9,0,1,0,55,25 A9,9,0,1,0,55,7 Z" fill="#fcd34d" />
          <circle cx="36" cy="9"  r="2"   fill="#fde68a" opacity="0.9" />
          <circle cx="66" cy="14" r="1.7" fill="#fde68a" opacity="0.9" />
          <circle cx="39" cy="24" r="1.3" fill="#fde68a" opacity="0.6" />
        </>
      );
    case '별토끼':
      return (
        <>
          <polygon transform="translate(50,16)" points="0,-13 3,-4.3 12.4,-4 5.1,1.6 7.6,11 0,5.5 -7.6,11 -5.1,1.6 -12.4,-4 -3,-4.3" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.7" />
          <circle cx="35" cy="11" r="2.2" fill="#fcd34d" opacity="0.85" />
          <circle cx="65" cy="11" r="2.2" fill="#fcd34d" opacity="0.85" />
          <circle cx="33" cy="22" r="1.5" fill="#fde68a" opacity="0.6" />
          <circle cx="67" cy="22" r="1.5" fill="#fde68a" opacity="0.6" />
        </>
      );
    case '은하토끼':
      return (
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
        <>
          <ellipse cx="50" cy="16" rx="20" ry="6" fill="none" stroke="#6d28d9" strokeWidth="3.5" opacity="0.35" />
          <circle cx="50" cy="16" r="11" fill="#6d28d9" />
          <ellipse cx="46" cy="12" rx="5" ry="3" fill="#7c3aed" opacity="0.6" transform="rotate(-20,46,12)" />
          <ellipse cx="55" cy="20" rx="3" ry="2" fill="#4c1d95" opacity="0.5" />
          <ellipse cx="50" cy="16" rx="20" ry="6" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeDasharray="28 12" />
        </>
      );
    case '전설토끼':
      return (
        <>
          <path d="M35,27 L37,14 L44,22 L50,10 L56,22 L63,14 L65,27 Z" fill="#f43f5e" />
          <rect x="35" y="25" width="30" height="5" rx="2" fill="#e11d48" />
          <circle cx="50" cy="11.5" r="3.5" fill="#fbbf24" />
          <circle cx="37.5" cy="14.5" r="2.5" fill="#fb923c" />
          <circle cx="62.5" cy="14.5" r="2.5" fill="#fb923c" />
          <circle cx="43" cy="27.5" r="1.8" fill="#fcd34d" />
          <circle cx="50" cy="27.5" r="1.8" fill="#fcd34d" />
          <circle cx="57" cy="27.5" r="1.8" fill="#fcd34d" />
        </>
      );
    default:
      return null;
  }
}

/* 코스튬 — 얼굴 요소 위에 렌더링 (마지막) */
function Costume({ costume }: { costume: string }) {
  switch (costume) {
    case 'ninja':
      return (
        <>
          {/* 머리띠 */}
          <rect x="13" y="39" width="74" height="8" rx="4" fill="#0f172a" />
          <rect x="13" y="39" width="74" height="8" rx="4" fill="none" stroke="#dc2626" strokeWidth="0.8" />
          <text x="50" y="45.5" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#dc2626" fontFamily="serif">忍</text>
          {/* 뒤로 묶인 끈 */}
          <path d="M13,41 L2,37 L4,47 Z" fill="#0f172a" />
          <path d="M87,41 L98,37 L96,47 Z" fill="#0f172a" />
          {/* 코/입 마스크 */}
          <rect x="16" y="66" width="68" height="15" rx="7.5" fill="#0f172a" />
        </>
      );
    case 'samurai':
      return (
        <>
          {/* 투구 측면 호위 */}
          <path d="M14,34 Q12,52 20,56 L22,38 Z" fill="#374151" />
          <path d="M86,34 Q88,52 80,56 L78,38 Z" fill="#374151" />
          {/* 투구 본체 */}
          <ellipse cx="50" cy="22" rx="37" ry="20" fill="#374151" />
          {/* 챙 */}
          <path d="M14,36 Q50,44 86,36 L86,42 Q50,50 14,42 Z" fill="#1f2937" />
          {/* 전립 장식 */}
          <path d="M50,2 L54,16 L50,12 L46,16 Z" fill="#fbbf24" />
          {/* 가운데 장식 */}
          <circle cx="50" cy="18" r="5.5" fill="#1f2937" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="50" cy="18" r="2.5" fill="#fbbf24" />
        </>
      );
    case 'princess':
      return (
        <>
          {/* 티아라 베이스 */}
          <path d="M22,37 Q50,33 78,37 L78,41 Q50,37 22,41 Z" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="0.8" />
          {/* 포인트 */}
          <path d="M30,37 L33,25 L36,37" fill="#f9a8d4" />
          <path d="M45,37 L50,17 L55,37" fill="#e879f9" />
          <path d="M64,37 L67,25 L70,37" fill="#f9a8d4" />
          {/* 보석 */}
          <circle cx="33" cy="26" r="3.5" fill="#c084fc" />
          <circle cx="50" cy="18.5" r="5" fill="#f43f5e" />
          <circle cx="67" cy="26" r="3.5" fill="#60a5fa" />
          {/* 작은 다이아 */}
          <polygon points="42,35 44,33 46,35 44,37" fill="#fbbf24" />
          <polygon points="54,35 56,33 58,35 56,37" fill="#fbbf24" />
        </>
      );
    case 'mage':
      return (
        <>
          {/* 뾰족 모자 */}
          <path d="M50,-6 L67,34 L33,34 Z" fill="#7c3aed" />
          {/* 챙 */}
          <ellipse cx="50" cy="34" rx="30" ry="7" fill="#6d28d9" />
          {/* 별 */}
          <polygon
            transform="translate(50,13)"
            points="0,-9 2.1,-2.9 8.6,-2.6 3.4,1.1 5.2,7.8 0,4 -5.2,7.8 -3.4,1.1 -8.6,-2.6 -2.1,-2.9"
            fill="#fbbf24"
          />
          {/* 버클 */}
          <rect x="43" y="30" width="14" height="7" rx="2" fill="#5b21b6" />
          <rect x="45" y="32" width="10" height="3" rx="1" fill="#fbbf24" opacity="0.85" />
          {/* 반짝이 */}
          <circle cx="35" cy="18" r="2" fill="#c4b5fd" opacity="0.9" />
          <circle cx="68" cy="14" r="1.5" fill="#c4b5fd" opacity="0.8" />
        </>
      );
    case 'pirate':
      return (
        <>
          {/* 삼각 해적 모자 */}
          <path d="M10,32 Q20,12 50,10 Q80,12 90,32 L84,40 Q50,46 16,40 Z" fill="#1c1917" />
          <path d="M10,32 Q20,12 50,10 Q80,12 90,32" fill="none" stroke="#78716c" strokeWidth="1.2" />
          {/* 해골 */}
          <ellipse cx="50" cy="22" rx="9" ry="7" fill="#f1f5f9" />
          <circle cx="46" cy="20" r="2.5" fill="#1c1917" />
          <circle cx="54" cy="20" r="2.5" fill="#1c1917" />
          <path d="M45,25 Q50,27.5 55,25" stroke="#1c1917" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* 안대 (오른쪽 눈) */}
          <ellipse cx="62" cy="57" rx="9.5" ry="7.5" fill="#1c1917" />
          <path d="M52,53 Q62,49 72,53" stroke="#78716c" strokeWidth="1.5" fill="none" />
          <line x1="52" y1="53" x2="52" y2="62" stroke="#78716c" strokeWidth="1.5" />
          <line x1="72" y1="53" x2="72" y2="62" stroke="#78716c" strokeWidth="1.5" />
        </>
      );
    case 'astronaut':
      return (
        <>
          {/* 어깨 우주복 */}
          <ellipse cx="13" cy="102" rx="16" ry="8" fill="#475569" />
          <ellipse cx="87" cy="102" rx="16" ry="8" fill="#475569" />
          {/* 목 링 */}
          <rect x="24" y="93" width="52" height="10" rx="5" fill="#64748b" />
          <rect x="26" y="95" width="48" height="6" rx="3" fill="#94a3b8" />
          {/* 헬멧 돔 */}
          <circle cx="50" cy="60" r="40" fill="rgba(148,163,184,0.1)" stroke="#94a3b8" strokeWidth="4.5" />
          {/* 반사광 */}
          <path d="M21,42 Q28,30 44,28" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
          {/* 우주기관 뱃지 */}
          <circle cx="80" cy="80" r="7" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
          <circle cx="80" cy="80" r="3" fill="#60a5fa" opacity="0.7" />
        </>
      );
    case 'devil':
      return (
        <>
          {/* 뿔 */}
          <path d="M28,40 Q20,22 28,6 Q36,20 34,40 Z" fill="#dc2626" />
          <path d="M30,40 Q22,22 28,6 Q32,18 31,40 Z" fill="#b91c1c" />
          <path d="M72,40 Q80,22 72,6 Q64,20 66,40 Z" fill="#dc2626" />
          <path d="M70,40 Q78,22 72,6 Q68,18 69,40 Z" fill="#b91c1c" />
          {/* 빨간 눈 */}
          <circle cx="38" cy="57" r="5.5" fill="#dc2626" />
          <circle cx="62" cy="57" r="5.5" fill="#dc2626" />
          <circle cx="40" cy="55" r="2.2" fill="white" />
          <circle cx="64" cy="55" r="2.2" fill="white" />
          {/* 꼬리 */}
          <path d="M50,102 Q60,108 64,100 Q68,110 62,110" stroke="#dc2626" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'santa':
      return (
        <>
          {/* 흰 테두리 */}
          <ellipse cx="50" cy="37" rx="36" ry="9" fill="white" />
          {/* 빨간 모자 */}
          <path d="M18,32 Q28,6 50,3 Q65,14 70,32 Z" fill="#dc2626" />
          {/* 폼폼 */}
          <circle cx="56" cy="6" r="8" fill="white" />
        </>
      );
    default:
      return null;
  }
}

const VALID_TIERS = Object.keys(THEMES) as TierName[];

export default function TierBunny({ tier, size = 96, costume }: { tier: string; size?: number; costume?: string | null }) {
  const name = (VALID_TIERS.includes(tier as TierName) ? tier : '길토끼') as TierName;
  const t = THEMES[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={costume ? `${costume} 코스튬 토끼` : `${name} 마스코트`}
    >
      {/* 등급 액세서리 (코스튬 없을 때만) */}
      {!costume && <Crown tier={name} />}

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

      {/* 코스튬 오버레이 (항상 최상단) */}
      {costume && <Costume costume={costume} />}
    </svg>
  );
}
