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
} as const;

export type AttackStyle = 'bonk' | 'leaf' | 'dash' | 'moon' | 'star' | 'beam' | 'rocket' | 'flame' | 'shuriken' | 'slash' | 'heart' | 'magic' | 'coin' | 'laser' | 'fire' | 'gift';

export type GameUnitConfig = {
  name: string;
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

export const UNIT_CONFIG: Record<UnitKey, GameUnitConfig> = {
  road: { name: '길토끼', tier: '길토끼', cost: 10, hp: 20, attack: 5, attackIntervalMs: 1_000, range: 75, speed: 38, color: '#94a3b8', attackStyle: 'bonk' },
  grass: { name: '풀토끼', tier: '풀토끼', cost: 20, hp: 30, attack: 8, attackIntervalMs: 1_000, range: 80, speed: 36, color: '#84cc16', attackStyle: 'leaf' },
  field: { name: '들토끼', tier: '들토끼', cost: 35, hp: 48, attack: 13, attackIntervalMs: 1_200, range: 85, speed: 32, color: '#22c55e', attackStyle: 'dash' },
  moon: { name: '달토끼', tier: '달토끼', cost: 80, hp: 90, attack: 25, attackIntervalMs: 1_500, range: 120, speed: 28, color: '#3b82f6', attackStyle: 'moon' },
  star: { name: '별토끼', tier: '별토끼', cost: 170, hp: 170, attack: 48, attackIntervalMs: 1_800, range: 130, speed: 25, color: '#f59e0b', attackStyle: 'star' },
  galaxy: { name: '은하토끼', tier: '은하토끼', cost: 250, hp: 210, attack: 65, attackIntervalMs: 1_600, range: 150, speed: 23, color: '#d946ef', attackStyle: 'beam' },
  space: { name: '우주토끼', tier: '우주토끼', cost: 340, hp: 280, attack: 88, attackIntervalMs: 1_800, range: 165, speed: 22, color: '#8b5cf6', attackStyle: 'rocket' },
  legend: { name: '전설토끼', tier: '전설토끼', cost: 450, hp: 360, attack: 120, attackIntervalMs: 2_000, range: 180, speed: 20, color: '#f43f5e', attackStyle: 'flame' },
  ninja: { name: '닌자토끼', tier: '들토끼', costume: 'ninja', cost: 55, hp: 42, attack: 18, attackIntervalMs: 550, range: 115, speed: 48, color: '#374151', attackStyle: 'shuriken', armorPierce: 99 },
  samurai: { name: '무사토끼', tier: '들토끼', costume: 'samurai', cost: 65, hp: 88, attack: 30, attackIntervalMs: 1_100, range: 72, speed: 28, color: '#991b1b', attackStyle: 'slash', armorPierce: 25 },
  princess: { name: '공주토끼', tier: '별토끼', costume: 'princess', cost: 120, hp: 105, attack: 30, attackIntervalMs: 1_200, range: 135, speed: 23, color: '#ec4899', attackStyle: 'heart', armorPierce: 25, splashTargets: 2 },
  mage: { name: '마법사토끼', tier: '은하토끼', costume: 'mage', cost: 145, hp: 80, attack: 55, attackIntervalMs: 1_600, range: 190, speed: 19, color: '#7c3aed', attackStyle: 'magic', armorPierce: 30, splashTargets: 3 },
  pirate: { name: '해적토끼', tier: '별토끼', costume: 'pirate', cost: 105, hp: 115, attack: 38, attackIntervalMs: 1_100, range: 145, speed: 25, color: '#92400e', attackStyle: 'coin', armorPierce: 25, splashTargets: 2 },
  astronaut: { name: '우주비행사토끼', tier: '우주토끼', costume: 'astronaut', cost: 180, hp: 150, attack: 60, attackIntervalMs: 1_300, range: 220, speed: 20, color: '#64748b', attackStyle: 'laser', armorPierce: 40, splashTargets: 2 },
  devil: { name: '악마토끼', tier: '전설토끼', costume: 'devil', cost: 135, hp: 75, attack: 70, attackIntervalMs: 1_000, range: 130, speed: 30, color: '#be123c', attackStyle: 'fire', armorPierce: 30, splashTargets: 2 },
  santa: { name: '산타토끼', tier: '별토끼', costume: 'santa', cost: 100, hp: 130, attack: 30, attackIntervalMs: 1_100, range: 125, speed: 24, color: '#dc2626', attackStyle: 'gift', armorPierce: 25, splashTargets: 2 },
};

export const ENEMY_CONFIG: Record<EnemyKey, { name: string; hp: number; armor: number; attack: number; attackIntervalMs: number; range: number; speed: number; reward: number; color: string }> = {
  snake: { name: '뱀', hp: 20, armor: 0, attack: 5, attackIntervalMs: 1_500, range: 45, speed: 42, reward: 15, color: '#84cc16' },
  fox: { name: '여우', hp: 48, armor: 2, attack: 9, attackIntervalMs: 1_200, range: 50, speed: 64, reward: 25, color: '#f97316' },
  wolf: { name: '늑대', hp: 95, armor: 8, attack: 16, attackIntervalMs: 1_500, range: 55, speed: 50, reward: 40, color: '#64748b' },
  tiger: { name: '호랑이', hp: 190, armor: 18, attack: 29, attackIntervalMs: 2_000, range: 60, speed: 36, reward: 60, color: '#ea580c' },
  dragon: { name: '드래곤', hp: 10_000, armor: 38, attack: 58, attackIntervalMs: 2_500, range: 85, speed: 20, reward: 200, color: '#dc2626' },
};

export function stageEnemyHpMultiplier(stage: number) {
  if (stage <= 5) return 1;
  if (stage <= 10) return 1 + (stage - 5) * 0.12;
  if (stage <= 15) return 2 + (stage - 10) * 0.35;
  if (stage === 16) return 12;
  if (stage === 17) return 16;
  if (stage === 18) return 20;
  if (stage === 19) return 24;
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
