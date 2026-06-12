import type { EnemyKey, TierUnitKey, UnitKey } from './types';

export const GAME_CONFIG = {
  tickMs: 100,
  maxStage: 20,
  stageDurationMs: 90_000,
  preparationDurationMs: 10_000,
  maxAllies: 10,
  burrowX: 950,
  burrowMaxHp: 100,
  startingCarrots: 30,
  passiveCarrotIntervalMs: 10_000,
  passiveCarrotAmount: 5,
  stageClearCarrotBase: 80,
  stageClearCarrotPerStage: 35,
} as const;

export type AttackStyle = 'bonk' | 'leaf' | 'dash' | 'moon' | 'star' | 'beam' | 'rocket' | 'flame' | 'shuriken' | 'slash' | 'heart' | 'magic' | 'coin' | 'laser' | 'fire' | 'gift';
export type UnitClass = '탱커' | '힐러' | '원거리' | '근거리';

export type GameUnitConfig = {
  name: string;
  role: string;
  unitClass: UnitClass;
  tier: string;
  costume?: string;
  cost: number;
  hp: number;
  attack: number;
  attackIntervalMs: number;
  range: number;
  speed: number;
  color: string;
  attackStyle: AttackStyle;
  armorPierce?: number;
  splashTargets?: number;
  damageReduction?: number;
  healAmount?: number;
  healIntervalMs?: number;
  healTargets?: number;
};

export const TIER_UNIT_KEYS: TierUnitKey[] = ['road', 'grass', 'field', 'moon', 'star', 'galaxy', 'space', 'legend'];

export function rangeLabel(range: number) {
  if (range >= 170) return '초장거리';
  if (range >= 125) return '장거리';
  if (range >= 90) return '중거리';
  return '근거리';
}

export function attackSpeedLabel(intervalMs: number) {
  const attacksPerSecond = 1000 / intervalMs;
  return `${attacksPerSecond.toFixed(attacksPerSecond >= 1 ? 1 : 2)}회/초`;
}

export const UNIT_CONFIG: Record<UnitKey, GameUnitConfig> = {
  road: { name: '길토끼', role: '저비용 방패 · 피해 20% 감소', unitClass: '탱커', tier: '길토끼', cost: 10, hp: 55, attack: 2, attackIntervalMs: 1_400, range: 70, speed: 34, color: '#94a3b8', attackStyle: 'bonk', damageReduction: 0.2 },
  grass: { name: '풀토끼', role: '빠른 근접 단일 딜러', unitClass: '근거리', tier: '풀토끼', cost: 20, hp: 26, attack: 14, attackIntervalMs: 700, range: 78, speed: 42, color: '#84cc16', attackStyle: 'leaf', armorPierce: 4 },
  field: { name: '들토끼', role: '전열 방어 · 피해 32% 감소', unitClass: '탱커', tier: '들토끼', cost: 35, hp: 135, attack: 5, attackIntervalMs: 1_500, range: 75, speed: 28, color: '#22c55e', attackStyle: 'dash', damageReduction: 0.32 },
  moon: { name: '달토끼', role: '안정적인 중거리 딜러', unitClass: '원거리', tier: '달토끼', cost: 80, hp: 58, attack: 52, attackIntervalMs: 1_100, range: 145, speed: 27, color: '#3b82f6', attackStyle: 'moon', armorPierce: 10 },
  star: { name: '별토끼', role: '강력한 장거리 순수 딜러', unitClass: '원거리', tier: '별토끼', cost: 170, hp: 88, attack: 110, attackIntervalMs: 1_200, range: 175, speed: 24, color: '#f59e0b', attackStyle: 'star', armorPierce: 18 },
  galaxy: { name: '은하토끼', role: '초장거리 고화력 광선', unitClass: '원거리', tier: '은하토끼', cost: 250, hp: 105, attack: 155, attackIntervalMs: 1_050, range: 220, speed: 22, color: '#d946ef', attackStyle: 'beam', armorPierce: 28 },
  space: { name: '우주토끼', role: '최상급 방패 · 피해 42% 감소', unitClass: '탱커', tier: '우주토끼', cost: 340, hp: 680, attack: 24, attackIntervalMs: 1_800, range: 95, speed: 20, color: '#8b5cf6', attackStyle: 'rocket', damageReduction: 0.42 },
  legend: { name: '전설토끼', role: '최강의 근접 한방 딜러', unitClass: '근거리', tier: '전설토끼', cost: 450, hp: 210, attack: 350, attackIntervalMs: 1_300, range: 92, speed: 27, color: '#f43f5e', attackStyle: 'flame', armorPierce: 42 },
  ninja: { name: '닌자토끼', role: '초장거리 표창 · 보스 저격', unitClass: '원거리', tier: '들토끼', costume: 'ninja', cost: 95, hp: 34, attack: 58, attackIntervalMs: 650, range: 290, speed: 46, color: '#374151', attackStyle: 'shuriken', armorPierce: 35 },
  samurai: { name: '무사토끼', role: '철벽 전열 · 피해 55% 감소', unitClass: '탱커', tier: '들토끼', costume: 'samurai', cost: 70, hp: 270, attack: 10, attackIntervalMs: 1_600, range: 68, speed: 25, color: '#991b1b', attackStyle: 'slash', damageReduction: 0.55 },
  princess: { name: '공주토끼', role: '3초마다 아군 5명 회복 · 화력 강화', unitClass: '힐러', tier: '별토끼', costume: 'princess', cost: 125, hp: 105, attack: 0, attackIntervalMs: 3_000, range: 190, speed: 22, color: '#ec4899', attackStyle: 'heart', healAmount: 18, healIntervalMs: 3_000, healTargets: 5 },
  mage: { name: '마법사토끼', role: '강력한 광역 마법 · 3명 공격', unitClass: '원거리', tier: '은하토끼', costume: 'mage', cost: 150, hp: 72, attack: 105, attackIntervalMs: 1_550, range: 215, speed: 18, color: '#7c3aed', attackStyle: 'magic', armorPierce: 30, splashTargets: 3 },
  pirate: { name: '해적토끼', role: '고화력 쌍포 · 처치 당근 보너스', unitClass: '원거리', tier: '별토끼', costume: 'pirate', cost: 110, hp: 86, attack: 72, attackIntervalMs: 1_050, range: 165, speed: 24, color: '#92400e', attackStyle: 'coin', armorPierce: 24, splashTargets: 2 },
  astronaut: { name: '우주비행사토끼', role: '초장거리 쌍열 레이저', unitClass: '원거리', tier: '우주토끼', costume: 'astronaut', cost: 185, hp: 108, attack: 125, attackIntervalMs: 1_150, range: 245, speed: 19, color: '#64748b', attackStyle: 'laser', armorPierce: 45, splashTargets: 2 },
  devil: { name: '악마토끼', role: '극단적인 유리대포 · 2명 공격', unitClass: '근거리', tier: '전설토끼', costume: 'devil', cost: 140, hp: 72, attack: 150, attackIntervalMs: 700, range: 88, speed: 36, color: '#be123c', attackStyle: 'fire', armorPierce: 38, splashTargets: 2 },
  santa: { name: '산타토끼', role: '4초마다 전열 3명·토끼굴 대량 회복', unitClass: '힐러', tier: '별토끼', costume: 'santa', cost: 105, hp: 145, attack: 0, attackIntervalMs: 4_000, range: 190, speed: 23, color: '#dc2626', attackStyle: 'gift', healAmount: 30, healIntervalMs: 4_000, healTargets: 3 },
};

export const ENEMY_CONFIG: Record<EnemyKey, { name: string; hp: number; armor: number; attack: number; attackIntervalMs: number; range: number; speed: number; reward: number; color: string }> = {
  snake: { name: '뱀', hp: 20, armor: 0, attack: 5, attackIntervalMs: 1_500, range: 45, speed: 42, reward: 15, color: '#84cc16' },
  fox: { name: '여우', hp: 48, armor: 2, attack: 9, attackIntervalMs: 1_200, range: 50, speed: 64, reward: 25, color: '#f97316' },
  wolf: { name: '늑대', hp: 95, armor: 8, attack: 16, attackIntervalMs: 1_500, range: 55, speed: 50, reward: 40, color: '#64748b' },
  tiger: { name: '호랑이', hp: 190, armor: 18, attack: 29, attackIntervalMs: 2_000, range: 60, speed: 36, reward: 60, color: '#ea580c' },
  dragon: { name: '드래곤', hp: 6_000, armor: 38, attack: 40, attackIntervalMs: 2_500, range: 85, speed: 20, reward: 200, color: '#dc2626' },
};

export function stageEnemyHpMultiplier(stage: number) {
  if (stage <= 5) return 1;
  if (stage <= 10) return 1 + (stage - 5) * 0.12;
  if (stage <= 15) return 2 + (stage - 10) * 0.35;
  if (stage === 16) return 5;
  if (stage === 17) return 7;
  if (stage === 18) return 9;
  if (stage === 19) return 5;
  return 1;
}

function spaced(keys: EnemyKey[], intervalMs: number) {
  return keys.map((key, index) => ({ key, spawnAtMs: index * intervalMs }));
}

export const STAGE_WAVES: ReadonlyArray<ReadonlyArray<{ key: EnemyKey; spawnAtMs: number }>> = [
  spaced(['snake', 'snake', 'snake', 'snake', 'snake'], 2_000),
  spaced(['snake', 'snake', 'snake', 'snake', 'snake', 'snake', 'snake'], 1_800),
  spaced(['snake', 'snake', 'fox', 'snake', 'snake', 'fox', 'snake'], 1_800),
  spaced(['snake', 'fox', 'snake', 'fox', 'snake', 'fox', 'snake', 'fox'], 1_600),
  spaced(['fox', 'snake', 'fox', 'snake', 'fox', 'snake', 'fox', 'snake', 'fox'], 1_500),
  spaced(['fox', 'fox', 'snake', 'fox', 'fox', 'snake', 'fox', 'fox', 'snake'], 1_450),
  spaced(['fox', 'fox', 'fox', 'snake', 'fox', 'fox', 'fox', 'snake', 'fox', 'fox'], 1_400),
  spaced(['fox', 'fox', 'wolf', 'fox', 'fox', 'wolf', 'fox', 'fox'], 1_650),
  spaced(['fox', 'wolf', 'fox', 'wolf', 'fox', 'wolf', 'fox', 'wolf'], 1_650),
  spaced(['wolf', 'fox', 'wolf', 'fox', 'wolf', 'fox', 'wolf', 'fox', 'wolf'], 1_600),
  spaced(['wolf', 'wolf', 'fox', 'wolf', 'wolf', 'fox', 'wolf', 'wolf'], 1_650),
  spaced(['wolf', 'wolf', 'wolf', 'fox', 'wolf', 'wolf', 'wolf', 'fox'], 1_600),
  spaced(['wolf', 'wolf', 'tiger', 'wolf', 'wolf', 'tiger', 'wolf'], 1_850),
  spaced(['wolf', 'tiger', 'wolf', 'tiger', 'wolf', 'tiger', 'wolf'], 1_850),
  spaced(['tiger', 'wolf', 'tiger', 'wolf', 'tiger', 'wolf', 'tiger'], 1_900),
  spaced(['tiger', 'tiger', 'wolf', 'tiger', 'tiger', 'wolf'], 2_000),
  spaced(['tiger', 'tiger', 'tiger', 'wolf', 'tiger', 'tiger'], 2_000),
  spaced(['tiger', 'tiger', 'tiger', 'tiger', 'wolf', 'wolf'], 1_900),
  spaced(['tiger', 'tiger', 'tiger', 'tiger', 'tiger', 'wolf'], 1_850),
  spaced(['dragon'], 0),
];
