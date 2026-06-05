type TierName = '길토끼' | '풀토끼' | '들토끼' | '달토끼' | '별토끼' | '은하토끼' | '우주토끼' | '전설토끼';

interface Props {
  tier: string;
  size?: number;
}

function Accessory({ tier }: { tier: TierName }) {
  switch (tier) {
    case '길토끼':
      return (
        <>
          <circle cx="43" cy="93" r="3.5" fill="#94a3b8" opacity="0.6" />
          <circle cx="57" cy="93" r="3.5" fill="#94a3b8" opacity="0.6" />
          <circle cx="50" cy="88" r="3" fill="#94a3b8" opacity="0.4" />
        </>
      );
    case '풀토끼':
      return (
        <>
          <line x1="50" y1="107" x2="50" y2="89" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="43.5" cy="95" rx="7" ry="3.5" fill="#84cc16" transform="rotate(-35,43.5,95)" />
          <ellipse cx="56.5" cy="92" rx="7" ry="3.5" fill="#a3e635" transform="rotate(35,56.5,92)" />
        </>
      );
    case '들토끼':
      return (
        <>
          <circle cx="50" cy="88" r="5.5" fill="#4ade80" opacity="0.9" />
          <circle cx="50" cy="99" r="5.5" fill="#4ade80" opacity="0.9" />
          <circle cx="44.5" cy="93.5" r="5.5" fill="#22c55e" opacity="0.9" />
          <circle cx="55.5" cy="93.5" r="5.5" fill="#22c55e" opacity="0.9" />
          <circle cx="50" cy="93.5" r="3.5" fill="#16a34a" />
          <line x1="50" y1="99" x2="50" y2="108" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case '달토끼':
      return (
        <path
          fillRule="evenodd"
          d="M 50 85 A 9 9 0 1 0 50 103 A 9 9 0 1 0 50 85 Z M 55 86 A 7.5 7.5 0 1 0 55 101 A 7.5 7.5 0 1 0 55 86 Z"
          fill="#0ea5e9"
        />
      );
    case '별토끼':
      return (
        <polygon
          points="50,82 52.8,89.5 60.5,89.5 54.3,94 56.6,101.5 50,97.2 43.4,101.5 45.7,94 39.5,89.5 47.2,89.5"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="0.8"
        />
      );
    case '은하토끼':
      return (
        <>
          <polygon points="50,83 51.8,88.5 57.5,88.5 52.9,91.8 54.7,97.3 50,94 45.3,97.3 47.1,91.8 42.5,88.5 48.2,88.5" fill="#e879f9" />
          <circle cx="62" cy="91" r="2.2" fill="#c084fc" opacity="0.85" />
          <circle cx="38" cy="95" r="1.8" fill="#c084fc" opacity="0.85" />
          <circle cx="65" cy="98" r="1.3" fill="#e879f9" opacity="0.7" />
          <circle cx="35" cy="88" r="1.3" fill="#e879f9" opacity="0.7" />
        </>
      );
    case '우주토끼':
      return (
        <>
          <circle cx="50" cy="93" r="8" fill="#7c3aed" />
          <ellipse cx="50" cy="93" rx="15" ry="5.5" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
          <ellipse cx="50" cy="93" rx="15" ry="5.5" fill="none" stroke="#ddd6fe" strokeWidth="1" strokeDasharray="8 22" />
        </>
      );
    case '전설토끼':
      return (
        <>
          <path d="M37 101 L38.5 88 L44 95 L50 86 L56 95 L61.5 88 L63 101 Z" fill="#f43f5e" stroke="#e11d48" strokeWidth="0.8" />
          <circle cx="50" cy="87.5" r="2.2" fill="#fbbf24" />
          <circle cx="39" cy="88.8" r="1.6" fill="#fbbf24" />
          <circle cx="61" cy="88.8" r="1.6" fill="#fbbf24" />
          <line x1="37" y1="101" x2="63" y2="101" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    default:
      return null;
  }
}

const TIER_THEMES: Record<TierName, {
  earOuter: string; earInner: string; face: string; cheek: string; faceStroke: string;
}> = {
  '길토끼': { earOuter: '#e2e8f0', earInner: '#94a3b8', face: '#f8fafc', cheek: '#fda4af', faceStroke: '#e2e8f0' },
  '풀토끼': { earOuter: '#d9f99d', earInner: '#84cc16', face: '#f7fee7', cheek: '#bef264', faceStroke: '#d9f99d' },
  '들토끼': { earOuter: '#bbf7d0', earInner: '#4ade80', face: '#f0fdf4', cheek: '#86efac', faceStroke: '#bbf7d0' },
  '달토끼': { earOuter: '#bae6fd', earInner: '#38bdf8', face: '#f0f9ff', cheek: '#7dd3fc', faceStroke: '#bae6fd' },
  '별토끼': { earOuter: '#fde68a', earInner: '#f59e0b', face: '#fffbeb', cheek: '#fcd34d', faceStroke: '#fde68a' },
  '은하토끼': { earOuter: '#f5d0fe', earInner: '#e879f9', face: '#fdf4ff', cheek: '#f0abfc', faceStroke: '#f5d0fe' },
  '우주토끼': { earOuter: '#ddd6fe', earInner: '#8b5cf6', face: '#f5f3ff', cheek: '#c4b5fd', faceStroke: '#ddd6fe' },
  '전설토끼': { earOuter: '#fecdd3', earInner: '#fb7185', face: '#fff1f2', cheek: '#fda4af', faceStroke: '#fecdd3' },
};

const VALID_TIERS = Object.keys(TIER_THEMES) as TierName[];

export default function TierBunny({ tier, size = 96 }: Props) {
  const name = (VALID_TIERS.includes(tier as TierName) ? tier : '길토끼') as TierName;
  const t = TIER_THEMES[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${name} 마스코트`}
    >
      {/* 왼쪽 귀 */}
      <rect x="18" y="2" width="15" height="44" rx="7.5" fill={t.earOuter} stroke={t.faceStroke} strokeWidth="1.2" />
      <rect x="22" y="6" width="7" height="32" rx="3.5" fill={t.earInner} />
      {/* 오른쪽 귀 */}
      <rect x="67" y="2" width="15" height="44" rx="7.5" fill={t.earOuter} stroke={t.faceStroke} strokeWidth="1.2" />
      <rect x="71" y="6" width="7" height="32" rx="3.5" fill={t.earInner} />
      {/* 얼굴 */}
      <circle cx="50" cy="62" r="32" fill={t.face} stroke={t.faceStroke} strokeWidth="1.2" />
      {/* 볼터치 */}
      <circle cx="30" cy="66" r="6" fill={t.cheek} opacity="0.4" />
      <circle cx="70" cy="66" r="6" fill={t.cheek} opacity="0.4" />
      {/* 눈 */}
      <circle cx="38" cy="57" r="4.5" fill="#1e293b" />
      <circle cx="62" cy="57" r="4.5" fill="#1e293b" />
      <circle cx="39.5" cy="55.5" r="1.8" fill="white" />
      <circle cx="63.5" cy="55.5" r="1.8" fill="white" />
      {/* 코 */}
      <ellipse cx="50" cy="67" rx="3" ry="2.2" fill="#fda4af" />
      {/* 입 */}
      <path d="M45 71.5 Q50 76 55 71.5" stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* 등급별 액세서리 */}
      <Accessory tier={name} />
    </svg>
  );
}
