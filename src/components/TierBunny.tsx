type TierName = '길토끼' | '풀토끼' | '들토끼' | '달토끼' | '별토끼' | '은하토끼' | '우주토끼' | '전설토끼';

type Theme = {
  fur: string;
  shade: string;
  innerEar: string;
  accent: string;
  cheek: string;
};

const THEMES: Record<TierName, Theme> = {
  길토끼: { fur: '#fffdf9', shade: '#e9e5df', innerEar: '#f8cbd3', accent: '#94a3b8', cheek: '#f9a8b8' },
  풀토끼: { fur: '#fbfff8', shade: '#dcefd5', innerEar: '#c9efb7', accent: '#65a30d', cheek: '#f9a8b8' },
  들토끼: { fur: '#fffdf7', shade: '#eadfc9', innerEar: '#e8bfa6', accent: '#22a35a', cheek: '#f3a9a9' },
  달토끼: { fur: '#f9fcff', shade: '#dbeafe', innerEar: '#bfd7ff', accent: '#4f7fd8', cheek: '#f6b6c8' },
  별토끼: { fur: '#fffdf5', shade: '#f7e7b0', innerEar: '#ffd7a3', accent: '#e8a20c', cheek: '#f7b2aa' },
  은하토끼: { fur: '#fffaff', shade: '#eedcf8', innerEar: '#e4b9ed', accent: '#b35ac7', cheek: '#f5b3d7' },
  우주토끼: { fur: '#faf9ff', shade: '#ddd8f7', innerEar: '#c9baf3', accent: '#7559c7', cheek: '#e9b4dc' },
  전설토끼: { fur: '#fff9f6', shade: '#f2d7cb', innerEar: '#f4b7ad', accent: '#e34f65', cheek: '#f39a9e' },
};

function Sparkle({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return <path d={`M${x} ${y - 5 * scale} L${x + 1.5 * scale} ${y - 1.5 * scale} L${x + 5 * scale} ${y} L${x + 1.5 * scale} ${y + 1.5 * scale} L${x} ${y + 5 * scale} L${x - 1.5 * scale} ${y + 1.5 * scale} L${x - 5 * scale} ${y} L${x - 1.5 * scale} ${y - 1.5 * scale} Z`} fill={color} />;
}

function TierCharm({ tier, color }: { tier: TierName; color: string }) {
  if (tier === '길토끼') return <path d="M103 34 q7 -5 10 2 q-4 7 -10 3" fill={color} opacity=".55" />;
  if (tier === '풀토끼') return <><path d="M105 42 Q105 29 111 23" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" /><ellipse cx="108" cy="28" rx="7" ry="3.5" fill="#84cc16" transform="rotate(-30 108 28)" /></>;
  if (tier === '들토끼') return <><circle cx="108" cy="28" r="5" fill="#55bd76" /><circle cx="113" cy="33" r="5" fill="#47a968" /><circle cx="103" cy="33" r="5" fill="#62c982" /><circle cx="108" cy="38" r="5" fill="#3fa45f" /></>;
  if (tier === '달토끼') return <path d="M112 22 a11 11 0 1 0 5 19 a9 9 0 1 1 -5 -19" fill="#f4c44e" />;
  if (tier === '별토끼') return <><Sparkle x={108} y={31} color="#f3b51b" scale={1.6} /><Sparkle x={98} y={21} color="#f8d36a" scale={0.55} /></>;
  if (tier === '은하토끼') return <><Sparkle x={109} y={28} color="#c56bd5" scale={1.45} /><circle cx="99" cy="39" r="3" fill="#e8a9ef" /></>;
  if (tier === '우주토끼') return <><circle cx="108" cy="30" r="8" fill="#8065d1" /><ellipse cx="108" cy="30" rx="14" ry="4" fill="none" stroke="#b8a8eb" strokeWidth="2.5" transform="rotate(-12 108 30)" /></>;
  return <><path d="M96 38 L98 25 L104 32 L109 20 L114 32 L119 25 L120 39 Z" fill="#ed5d70" /><circle cx="109" cy="25" r="2.4" fill="#ffd15c" /></>;
}

function CostumeBack({ costume }: { costume: string }) {
  switch (costume) {
    case 'ninja': return <><path d="M25 66 Q12 73 12 94 Q20 87 31 89" fill="#252a39" /><path d="M95 65 Q108 73 108 94 Q100 87 89 89" fill="#252a39" /></>;
    case 'samurai': return <>
      <path d="M91 68 L105 108" stroke="#4b2e2a" strokeWidth="8" strokeLinecap="round" />
      <path d="M92 65 L97 63 L101 74 L96 77 Z" fill="#d8aa4e" stroke="#7b542a" strokeWidth="1.5" />
      <path d="M98 75 L103 112" stroke="#18283e" strokeWidth="5" strokeLinecap="round" />
      <path d="M25 79 Q13 84 12 101 Q23 97 32 102 L35 85 Z" fill="#7f2f35" stroke="#4d2229" strokeWidth="2" />
      <path d="M95 79 Q107 84 108 101 Q97 97 88 102 L85 85 Z" fill="#7f2f35" stroke="#4d2229" strokeWidth="2" />
    </>;
    case 'princess': return <path d="M31 87 Q16 107 18 124 H102 Q104 107 89 87" fill="#f5a8cc" />;
    case 'mage': return <><path d="M29 84 Q14 101 18 123 H102 Q106 101 91 84" fill="#5c49a8" /><Sparkle x={17} y={78} color="#f6cf58" scale={0.65} /></>;
    case 'pirate': return <path d="M92 80 Q111 84 112 103 Q101 97 91 101" fill="#743d31" />;
    case 'astronaut': return <><rect x="20" y="78" width="80" height="48" rx="23" fill="#e4edf4" /><rect x="13" y="88" width="18" height="29" rx="9" fill="#c7d4df" /><rect x="89" y="88" width="18" height="29" rx="9" fill="#c7d4df" /></>;
    case 'devil': return <><path d="M22 77 Q8 88 15 105 Q21 93 33 94" fill="#852c48" /><path d="M98 77 Q112 88 105 105 Q99 93 87 94" fill="#852c48" /><path d="M93 105 Q117 110 106 122" fill="none" stroke="#d84a65" strokeWidth="4" strokeLinecap="round" /><path d="M104 119 l8 -3 -4 8 Z" fill="#d84a65" /></>;
    case 'santa': return <path d="M28 87 Q16 102 20 124 H100 Q104 102 92 87" fill="#d9484a" />;
    default: return null;
  }
}

function Outfit({ costume }: { costume: string }) {
  switch (costume) {
    case 'ninja': return <><path d="M31 85 Q60 75 89 85 L86 119 Q60 127 34 119 Z" fill="#303646" /><path d="M34 88 L86 115" stroke="#d85a5a" strokeWidth="5" /><rect x="52" y="99" width="16" height="12" rx="3" fill="#202432" /><path d="M38 69 Q60 76 82 69 V82 Q60 91 38 82 Z" fill="#262b39" /></>;
    case 'samurai': return <>
      <path d="M29 84 Q60 75 91 84 L88 119 Q60 128 32 119 Z" fill="#8f3439" stroke="#4d2229" strokeWidth="2" />
      <path d="M37 83 L43 120 M83 83 L77 120" stroke="#d8aa4e" strokeWidth="2" opacity=".9" />
      <path d="M41 88 Q60 96 79 88 L78 113 Q60 121 42 113 Z" fill="#a84243" stroke="#64282e" strokeWidth="1.8" />
      <path d="M43 96 H77 M42 104 H78 M42 112 H78" stroke="#f0c767" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M34 113 Q60 119 86 113 L86 121 Q60 128 34 121 Z" fill="#27384f" />
      <path d="M49 116 Q60 111 71 116 Q66 122 60 124 Q54 122 49 116 Z" fill="#d8aa4e" />
      <circle cx="60" cy="117" r="3" fill="#f7df91" />
    </>;
    case 'princess': return <><path d="M32 84 Q60 75 88 84 L96 123 H24 Z" fill="#f8b9d8" /><path d="M43 82 Q60 102 77 82" fill="#fff5fb" /><path d="M60 91 L66 99 L60 107 L54 99 Z" fill="#c77de2" /><circle cx="60" cy="99" r="3" fill="#fff" opacity=".75" /></>;
    case 'mage': return <><path d="M31 84 Q60 75 89 84 L96 123 H24 Z" fill="#6b56b8" /><path d="M42 82 Q60 99 78 82" stroke="#d8c8ff" strokeWidth="5" fill="none" /><Sparkle x={60} y={105} color="#f6d35f" scale={1.05} /><circle cx="42" cy="110" r="2.5" fill="#c8b6ff" /><circle cx="80" cy="112" r="2" fill="#c8b6ff" /></>;
    case 'pirate': return <><path d="M31 84 Q60 76 89 84 L87 121 H33 Z" fill="#f3eee3" /><path d="M39 83 L49 121 H71 L81 83" fill="#b44843" /><path d="M60 84 V120" stroke="#71362e" strokeWidth="3" /><circle cx="60" cy="96" r="2.5" fill="#e6b84c" /><circle cx="60" cy="108" r="2.5" fill="#e6b84c" /></>;
    case 'astronaut': return <><rect x="30" y="82" width="60" height="43" rx="18" fill="#f7fafc" stroke="#9fb2c3" strokeWidth="2.5" /><rect x="45" y="91" width="30" height="20" rx="5" fill="#586e82" /><circle cx="53" cy="99" r="3" fill="#ef6a6a" /><circle cx="61" cy="99" r="3" fill="#62c894" /><rect x="51" y="105" width="18" height="3" rx="1.5" fill="#9bb6cc" /></>;
    case 'devil': return <><path d="M30 84 Q60 75 90 84 L88 122 H32 Z" fill="#8d3151" /><path d="M42 81 L60 99 L78 81" fill="#3f2438" /><path d="M60 101 L66 110 L60 118 L54 110 Z" fill="#e85c70" /></>;
    case 'santa': return <><path d="M30 84 Q60 76 90 84 L94 123 H26 Z" fill="#df4a4c" /><path d="M35 84 Q60 96 85 84" stroke="#fff9ef" strokeWidth="8" fill="none" /><rect x="55" y="91" width="10" height="32" fill="#513b38" /><rect x="50" y="102" width="20" height="13" rx="3" fill="#e9bc4f" /><rect x="55" y="106" width="10" height="5" fill="#513b38" /></>;
    default: return null;
  }
}

function Headwear({ costume }: { costume: string }) {
  switch (costume) {
    case 'ninja': return <><path d="M25 48 Q60 39 95 48 V60 Q60 52 25 60 Z" fill="#252a39" /><rect x="47" y="45" width="26" height="13" rx="5" fill="#be454d" /><path d="M91 51 l18 -8 -8 15 11 8 -22 -3" fill="#be454d" /></>;
    case 'samurai': return <>
      <path d="M30 49 Q34 27 60 25 Q86 27 90 49 Q60 43 30 49 Z" fill="#2a3d58" stroke="#17263a" strokeWidth="2.2" />
      <path d="M31 46 Q60 36 89 46 L86 54 Q60 47 34 54 Z" fill="#3b526f" opacity=".8" />
      <path d="M24 50 Q60 58 96 50 L92 57 Q60 66 28 57 Z" fill="#18283e" stroke="#101d2e" strokeWidth="1.5" />
      <path d="M37 51 Q31 59 33 68 L42 63 L45 54 Z" fill="#24364f" />
      <path d="M83 51 Q89 59 87 68 L78 63 L75 54 Z" fill="#24364f" />
      <path d="M41 31 Q48 17 60 13 Q72 17 79 31 Q69 24 60 35 Q51 24 41 31 Z" fill="#e2b650" stroke="#9a6c28" strokeWidth="1.5" />
      <path d="M48 29 Q60 20 72 29 Q66 27 60 36 Q54 27 48 29 Z" fill="#f6d77f" />
      <circle cx="60" cy="43" r="6" fill="#9b343c" stroke="#f0c767" strokeWidth="2" />
      <circle cx="60" cy="43" r="2.2" fill="#f7df91" />
    </>;
    case 'princess': return <><path d="M35 51 L39 34 L50 44 L60 25 L70 44 L81 34 L85 51 Z" fill="#f6cf5e" stroke="#d79d2c" strokeWidth="2" /><circle cx="60" cy="29" r="4" fill="#ed6ca4" /><circle cx="40" cy="37" r="3" fill="#7cc4e8" /><circle cx="80" cy="37" r="3" fill="#ac78de" /></>;
    case 'mage': return <><path d="M30 52 L58 2 Q64 29 87 48 Z" fill="#6651b7" /><path d="M55 9 Q67 20 73 39" stroke="#8875d2" strokeWidth="5" fill="none" /><ellipse cx="59" cy="52" rx="39" ry="9" fill="#59469f" /><Sparkle x={57} y={29} color="#f5d25c" scale={1.15} /><circle cx="73" cy="19" r="3" fill="#d7c7ff" /></>;
    case 'pirate': return <><path d="M20 50 Q29 25 60 27 Q91 25 100 50 Q81 46 70 58 Q60 50 50 58 Q39 46 20 50" fill="#3b2b2a" stroke="#201919" strokeWidth="2" /><path d="M37 40 Q60 23 83 40" stroke="#bd4b47" strokeWidth="5" fill="none" /><circle cx="60" cy="39" r="7" fill="#f1e8d8" /><circle cx="57" cy="38" r="2" fill="#3b2b2a" /><circle cx="63" cy="38" r="2" fill="#3b2b2a" /><path d="M55 44 H65" stroke="#3b2b2a" strokeWidth="2" /></>;
    case 'astronaut': return <><circle cx="60" cy="62" r="45" fill="#dff4ff" fillOpacity=".22" stroke="#a9bfce" strokeWidth="4" /><path d="M28 43 Q40 21 62 20" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".75" /><rect x="30" y="91" width="60" height="10" rx="5" fill="#9fb2c3" /></>;
    case 'devil': return <><path d="M34 49 Q20 35 29 13 Q43 29 45 49" fill="#d84a65" stroke="#9f304e" strokeWidth="2" /><path d="M86 49 Q100 35 91 13 Q77 29 75 49" fill="#d84a65" stroke="#9f304e" strokeWidth="2" /></>;
    case 'santa': return <><path d="M27 49 Q34 16 68 13 Q84 23 87 48 Z" fill="#df4a4c" /><path d="M25 50 Q60 40 92 51" stroke="#fffaf1" strokeWidth="10" strokeLinecap="round" /><circle cx="72" cy="15" r="10" fill="#fffaf1" /></>;
    default: return null;
  }
}

const VALID_TIERS = Object.keys(THEMES) as TierName[];

export default function TierBunny({ tier, size = 96, costume }: { tier: string; size?: number; costume?: string | null }) {
  const name = (VALID_TIERS.includes(tier as TierName) ? tier : '길토끼') as TierName;
  const t = THEMES[name];

  return (
    <svg width={size} height={size} viewBox="0 0 120 132" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={costume ? `${costume} 코스튬을 입은 ${name}` : `${name} 마스코트`}>
      <ellipse cx="60" cy="124" rx="34" ry="6" fill="#1f2937" opacity=".09" />
      {!costume && <TierCharm tier={name} color={t.accent} />}
      <CostumeBack costume={costume ?? ''} />

      <ellipse cx="28" cy="39" rx="13" ry="32" fill={t.fur} stroke={t.shade} strokeWidth="2.5" transform="rotate(-9 28 39)" />
      <ellipse cx="92" cy="39" rx="13" ry="32" fill={t.fur} stroke={t.shade} strokeWidth="2.5" transform="rotate(9 92 39)" />
      <ellipse cx="29" cy="37" rx="6" ry="23" fill={t.innerEar} opacity=".82" transform="rotate(-9 29 37)" />
      <ellipse cx="91" cy="37" rx="6" ry="23" fill={t.innerEar} opacity=".82" transform="rotate(9 91 37)" />

      <circle cx="96" cy="91" r="12" fill={t.fur} stroke={t.shade} strokeWidth="2.5" />
      <ellipse cx="60" cy="98" rx="33" ry="28" fill={t.fur} stroke={t.shade} strokeWidth="2.5" />
      <ellipse cx="38" cy="119" rx="15" ry="8" fill={t.fur} stroke={t.shade} strokeWidth="2.5" />
      <ellipse cx="82" cy="119" rx="15" ry="8" fill={t.fur} stroke={t.shade} strokeWidth="2.5" />
      <Outfit costume={costume ?? ''} />

      <path d="M21 66 Q22 42 43 37 Q60 30 77 37 Q98 42 99 66 Q101 91 83 100 Q60 111 37 100 Q19 91 21 66 Z" fill={t.fur} stroke={t.shade} strokeWidth="2.7" />
      <ellipse cx="35" cy="75" rx="9" ry="6" fill={t.cheek} opacity=".48" />
      <ellipse cx="85" cy="75" rx="9" ry="6" fill={t.cheek} opacity=".48" />
      <ellipse cx="44" cy="65" rx="4.8" ry="6" fill="#30313b" />
      <ellipse cx="76" cy="65" rx="4.8" ry="6" fill="#30313b" />
      <circle cx="42.5" cy="63" r="1.8" fill="#fff" />
      <circle cx="74.5" cy="63" r="1.8" fill="#fff" />
      <ellipse cx="60" cy="75" rx="4.5" ry="3.3" fill="#e98e9b" />
      <path d="M60 78 V81 M60 81 Q54 86 50 81 M60 81 Q66 86 70 81" stroke="#8b6670" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M31 84 Q39 90 47 85" stroke="#fff" strokeWidth="2" fill="none" opacity=".75" strokeLinecap="round" />
      <Headwear costume={costume ?? ''} />

      {!costume && <><ellipse cx="42" cy="101" rx="9" ry="6" fill={t.fur} stroke={t.shade} strokeWidth="2" transform="rotate(12 42 101)" /><ellipse cx="78" cy="101" rx="9" ry="6" fill={t.fur} stroke={t.shade} strokeWidth="2" transform="rotate(-12 78 101)" /></>}
    </svg>
  );
}
