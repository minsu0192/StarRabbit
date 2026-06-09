export default function BunnyMascot({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="별토끼 마스코트"
    >
      {/* 왼쪽 귀 — 살짝 바깥으로 기울임 */}
      <g transform="rotate(-7, 27, 48)">
        <rect x="18" y="3" width="17" height="46" rx="8.5" fill="#fce7f3" stroke="#fbcfe8" strokeWidth="1.2"/>
        <rect x="22" y="8" width="9" height="34" rx="4.5" fill="#f9a8d4"/>
      </g>
      {/* 오른쪽 귀 */}
      <g transform="rotate(7, 73, 48)">
        <rect x="65" y="3" width="17" height="46" rx="8.5" fill="#fce7f3" stroke="#fbcfe8" strokeWidth="1.2"/>
        <rect x="69" y="8" width="9" height="34" rx="4.5" fill="#f9a8d4"/>
      </g>

      {/* 얼굴 */}
      <circle cx="50" cy="66" r="34" fill="#fffbfc" stroke="#fce7f3" strokeWidth="1.5"/>

      {/* 볼터치 */}
      <ellipse cx="27" cy="71" rx="9" ry="6" fill="#fda4af" opacity="0.3"/>
      <ellipse cx="73" cy="71" rx="9" ry="6" fill="#fda4af" opacity="0.3"/>

      {/* 눈 */}
      <circle cx="37" cy="59" r="7" fill="#1a1625"/>
      <circle cx="63" cy="59" r="7" fill="#1a1625"/>
      {/* 눈 반짝임 크게 */}
      <circle cx="40" cy="56" r="3.2" fill="white"/>
      <circle cx="66" cy="56" r="3.2" fill="white"/>
      {/* 눈 반짝임 작게 */}
      <circle cx="36" cy="63" r="1.4" fill="white" opacity="0.55"/>
      <circle cx="62" cy="63" r="1.4" fill="white" opacity="0.55"/>

      {/* 코 (하트) */}
      <circle cx="47.5" cy="69.5" r="3.2" fill="#f9a8d4"/>
      <circle cx="52.5" cy="69.5" r="3.2" fill="#f9a8d4"/>
      <polygon points="44.5,69.5 55.5,69.5 50,76" fill="#f9a8d4"/>

      {/* 입 (ω 모양) */}
      <path
        d="M43,79 Q46.5,85 50,80.5 Q53.5,85 57,79"
        stroke="#f0abbc" strokeWidth="1.8" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />

      {/* 반짝이 */}
      <circle cx="83" cy="9" r="2.5" fill="#fbbf24" opacity="0.9"/>
      <circle cx="83" cy="9" r="1" fill="white" opacity="0.6"/>
      <circle cx="20" cy="14" r="1.8" fill="#fbbf24" opacity="0.55"/>
      <circle cx="24" cy="8" r="1.2" fill="#fcd34d" opacity="0.45"/>
    </svg>
  );
}
