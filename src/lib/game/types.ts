export type TierUnitKey = 'road' | 'grass' | 'field' | 'moon' | 'star' | 'galaxy' | 'space' | 'legend';
export type CostumeUnitKey = 'ninja' | 'samurai' | 'princess' | 'mage' | 'pirate' | 'astronaut' | 'devil' | 'santa';
export type UnitKey = TierUnitKey | CostumeUnitKey;
export type EnemyKey = 'snake' | 'fox' | 'wolf' | 'tiger' | 'dragon';
export type GamePhase = 'ready' | 'battle' | 'preparation' | 'won' | 'lost';

export type Combatant = {
  id: string;
  key: UnitKey | EnemyKey;
  hp: number;
  maxHp: number;
  x: number;
  attackCooldownMs: number;
  lastAttackAtMs: number;
};

export type SpawnCommand = {
  seq: number;
  elapsedMs: number;
  type: 'spawn';
  unitKey: UnitKey;
};

export type GameState = {
  phase: GamePhase;
  stage: number;
  clearedStages: number;
  stageElapsedMs: number;
  phaseElapsedMs: number;
  totalElapsedMs: number;
  burrowHp: number;
  carrots: number;
  allies: Combatant[];
  enemies: Combatant[];
  pendingEnemies: Array<{ key: EnemyKey; spawnAtMs: number }>;
  nextEntityId: number;
  nextCommandSeq: number;
  passiveCarrotElapsedMs: number;
  logs: string[];
};

export type TickResult = {
  state: GameState;
  accepted: boolean;
  reason?: string;
};
