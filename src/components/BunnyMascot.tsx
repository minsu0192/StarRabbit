export default function BunnyMascot({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="별토끼 마스코트"
    >
      {/* 왼쪽 귀 */}
      <rect x="18" y="2" width="15" height="44" rx="7.5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.2"/>
      <rect x="22" y="6" width="7" height="32" rx="3.5" fill="#fda4af"/>
      {/* 오른쪽 귀 */}
      <rect x="67" y="2" width="15" height="44" rx="7.5" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.2"/>
      <rect x="71" y="6" width="7" height="32" rx="3.5" fill="#fda4af"/>
      {/* 얼굴 */}
      <circle cx="50" cy="62" r="32" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2"/>
      {/* 볼터치 */}
      <circle cx="30" cy="66" r="6" fill="#fda4af" opacity="0.35"/>
      <circle cx="70" cy="66" r="6" fill="#fda4af" opacity="0.35"/>
      {/* 눈 */}
      <circle cx="38" cy="57" r="4.5" fill="#1e293b"/>
      <circle cx="62" cy="57" r="4.5" fill="#1e293b"/>
      <circle cx="39.5" cy="55.5" r="1.8" fill="white"/>
      <circle cx="63.5" cy="55.5" r="1.8" fill="white"/>
      {/* 코 */}
      <ellipse cx="50" cy="67" rx="3" ry="2.2" fill="#fda4af"/>
      {/* 입 */}
      <path d="M45 71.5 Q50 76 55 71.5" stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* 별 */}
      <polygon
        points="50,82 52.8,89.5 60.5,89.5 54.3,94 56.6,101.5 50,97.2 43.4,101.5 45.7,94 39.5,89.5 47.2,89.5"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth="0.8"
      />
    </svg>
  );
}
