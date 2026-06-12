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
  road: { name: '길토끼', role: '저비용 몸막기', unitClass: '탱커', tier: '길토끼', cost: 10, hp: 22, attack: 4, attackIntervalMs: 1_100, range: 70, speed: 38, color: '#94a3b8', attackStyle: 'bonk' },
  grass: { name: '풀토끼', role: '빠른 근접 공격', unitClass: '근거리', tier: '풀토끼', cost: 20, hp: 30, attack: 8, attackIntervalMs: 850, range: 78, speed: 38, color: '#84cc16', attackStyle: 'leaf' },
  field: { name: '들토끼', role: '튼튼한 전열 방어', unitClass: '탱커', tier: '들토끼', cost: 35, hp: 55, attack: 11, attackIntervalMs: 1_250, range: 82, speed: 30, color: '#22c55e', attackStyle: 'dash' },
  moon: { name: '달토끼', role: '안정적인 중거리 공격', unitClass: '원거리', tier: '달토끼', cost: 80, hp: 85, attack: 32, attackIntervalMs: 1_250, range: 135, speed: 27, color: '#3b82f6', attackStyle: 'moon' },
  star: { name: '별토끼', role: '강력한 원거리 주력', unitClass: '원거리', tier: '별토끼', cost: 170, hp: 165, attack: 72, attackIntervalMs: 1_450, range: 155, speed: 24, color: '#f59e0b', attackStyle: 'star' },
  galaxy: { name: '은하토끼', role: '빠른 장거리 광선', unitClass: '원거리', tier: '은하토끼', cost: 250, hp: 220, attack: 105, attackIntervalMs: 1_300, range: 195, speed: 22, color: '#d946ef', attackStyle: 'beam' },
  space: { name: '우주토끼', role: '튼튼한 중장거리 화력', unitClass: '탱커', tier: '우주토끼', cost: 340, hp: 380, attack: 135, attackIntervalMs: 1_550, range: 170, speed: 21, color: '#8b5cf6', attackStyle: 'rocket' },
  legend: { name: '전설토끼', role: '최강의 근접 일격', unitClass: '근거리', tier: '전설토끼', cost: 450, hp: 520, attack: 220, attackIntervalMs: 1_650, range: 92, speed: 25, color: '#f43f5e', attackStyle: 'flame' },
  ninja: { name: '닌자토끼', role: '초장거리 표창 · 단일 대상 특화', unitClass: '원거리', tier: '들토끼', costume: 'ninja', cost: 95, hp: 28, attack: 15, attackIntervalMs: 750, range: 290, speed: 52, color: '#374151', attackStyle: 'shuriken', armorPierce: 22 },
  samurai: { name: '무사토끼', role: '피해 45% 감소 · 전열 유지', unitClass: '탱커', tier: '들토끼', costume: 'samurai', cost: 70, hp: 105, attack: 27, attackIntervalMs: 1_200, range: 68, speed: 27, color: '#991b1b', attackStyle: 'slash', armorPierce: 25 },
  princess: { name: '공주토끼', role: '4초마다 아군 회복 · 공격 강화', unitClass: '힐러', tier: '별토끼', costume: 'princess', cost: 125, hp: 90, attack: 26, attackIntervalMs: 1_350, range: 150, speed: 22, color: '#ec4899', attackStyle: 'heart', armorPierce: 25, splashTargets: 2 },
  mage: { name: '마법사토끼', role: '느린 광역 마법 · 3명 공격', unitClass: '원거리', tier: '은하토끼', costume: 'mage', cost: 150, hp: 68, attack: 58, attackIntervalMs: 1_750, range: 205, speed: 18, color: '#7c3aed', attackStyle: 'magic', armorPierce: 30, splashTargets: 3 },
  pirate: { name: '해적토끼', role: '처치 당근 보너스 · 2명 공격', unitClass: '원거리', tier: '별토끼', costume: 'pirate', cost: 110, hp: 100, attack: 35, attackIntervalMs: 1_150, range: 155, speed: 24, color: '#92400e', attackStyle: 'coin', armorPierce: 25, splashTargets: 2 },
  astronaut: { name: '우주비행사토끼', role: '장거리 레이저 · 2명 공격', unitClass: '원거리', tier: '우주토끼', costume: 'astronaut', cost: 185, hp: 135, attack: 62, attackIntervalMs: 1_350, range: 235, speed: 19, color: '#64748b', attackStyle: 'laser', armorPierce: 40, splashTargets: 2 },
  devil: { name: '악마토끼', role: '낮은 체력 · 빠른 고화력', unitClass: '근거리', tier: '전설토끼', costume: 'devil', cost: 140, hp: 65, attack: 72, attackIntervalMs: 900, range: 85, speed: 34, color: '#be123c', attackStyle: 'fire', armorPierce: 30, splashTargets: 2 },
  santa: { name: '산타토끼', role: '5초마다 전열 아군·토끼굴 회복 · 순수 지원가', unitClass: '힐러', tier: '별토끼', costume: 'santa', cost: 105, hp: 120, attack: 0, attackIntervalMs: 5_000, range: 180, speed: 23, color: '#dc2626', attackStyle: 'gift' },
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
