import { ENEMY_CONFIG, GAME_CONFIG, STAGE_WAVES, UNIT_CONFIG, stageEnemyHpMultiplier } from './config';
import type { Combatant, EnemyKey, GameState, SpawnCommand, TickResult, UnitKey } from './types';

function addLog(state: GameState, message: string) {
  state.logs = [message, ...state.logs].slice(0, 20);
}

function waveFor(stage: number) {
  return STAGE_WAVES[stage - 1].map((enemy) => ({ ...enemy }));
}

export function createInitialGameState(): GameState {
  return {
    phase: 'ready',
    stage: 1,
    clearedStages: 0,
    stageElapsedMs: 0,
    phaseElapsedMs: 0,
    totalElapsedMs: 0,
    burrowHp: GAME_CONFIG.burrowMaxHp,
    carrots: GAME_CONFIG.startingCarrots,
    allies: [],
    enemies: [],
    pendingEnemies: waveFor(1),
    nextEntityId: 1,
    nextCommandSeq: 1,
    passiveCarrotElapsedMs: 0,
    logs: ['수호대를 준비하고 전투를 시작하세요.'],
  };
}

export function startGame(current: GameState): GameState {
  if (current.phase !== 'ready') return current;
  const state = structuredClone(current);
  state.phase = 'battle';
  state.phaseElapsedMs = 0;
  addLog(state, '1스테이지 전투 시작!');
  return state;
}

export function createSpawnCommand(state: GameState, unitKey: UnitKey): SpawnCommand {
  return { seq: state.nextCommandSeq, elapsedMs: state.totalElapsedMs, type: 'spawn', unitKey };
}

export function applySpawnCommand(current: GameState, command: SpawnCommand): TickResult {
  const state = structuredClone(current);
  const config = UNIT_CONFIG[command.unitKey];
  if (state.phase !== 'battle' && state.phase !== 'preparation') return { state: current, accepted: false, reason: '지금은 생산할 수 없어요' };
  if (command.seq !== state.nextCommandSeq) return { state: current, accepted: false, reason: '명령 순서가 맞지 않아요' };
  if (!config) return { state: current, accepted: false, reason: '알 수 없는 유닛이에요' };
  if (state.allies.length >= GAME_CONFIG.maxAllies) return { state: current, accepted: false, reason: '전장에는 최대 10마리까지 배치할 수 있어요' };
  if (state.carrots < config.cost) return { state: current, accepted: false, reason: '당근이 부족해요' };

  state.carrots -= config.cost;
  state.nextCommandSeq += 1;
  state.allies.push({
    id: `ally-${state.nextEntityId++}`,
    key: command.unitKey,
    hp: config.hp,
    maxHp: config.hp,
    x: GAME_CONFIG.burrowX - 55 - state.allies.length * 7,
    attackCooldownMs: 0,
    lastAttackAtMs: -10_000,
  });
  addLog(state, `${config.name} 출전 (-${config.cost} 당근)`);
  return { state, accepted: true };
}

function spawnPendingEnemies(state: GameState) {
  const ready = state.pendingEnemies.filter((enemy) => enemy.spawnAtMs <= state.stageElapsedMs);
  state.pendingEnemies = state.pendingEnemies.filter((enemy) => enemy.spawnAtMs > state.stageElapsedMs);
  for (const enemy of ready) {
    const config = ENEMY_CONFIG[enemy.key];
    const hp = Math.round(config.hp * stageEnemyHpMultiplier(state.stage));
    state.enemies.push({
      id: `enemy-${state.nextEntityId++}`,
      key: enemy.key,
      hp,
      maxHp: hp,
      x: 0,
      attackCooldownMs: 0,
      lastAttackAtMs: -10_000,
    });
  }
}

function closestEnemy(allies: Combatant[], enemy: Combatant) {
  return allies.filter((ally) => ally.x >= enemy.x).sort((a, b) => a.x - b.x)[0];
}

function foremostEnemy(enemies: Combatant[]) {
  return [...enemies].sort((a, b) => b.x - a.x)[0];
}

function runMovement(state: GameState, dtSeconds: number) {
  for (const ally of state.allies) {
    const target = foremostEnemy(state.enemies);
    if (!target) continue;
    const config = UNIT_CONFIG[ally.key as UnitKey];
    if (Math.abs(ally.x - target.x) > config.range) {
      ally.x = Math.max(target.x + config.range, ally.x - config.speed * dtSeconds);
    }
  }

  for (const enemy of state.enemies) {
    const config = ENEMY_CONFIG[enemy.key as EnemyKey];
    const target = closestEnemy(state.allies, enemy);
    const targetX = target?.x ?? GAME_CONFIG.burrowX;
    if (targetX - enemy.x > config.range) {
      enemy.x = Math.min(targetX - config.range, enemy.x + config.speed * dtSeconds);
    }
  }
}

function runCombat(state: GameState, tickMs: number) {
  const damage = new Map<string, number>();
  let burrowDamage = 0;
  const princessCount = state.allies.filter((ally) => ally.key === 'princess').length;
  const costumeCount = state.allies.filter((ally) => UNIT_CONFIG[ally.key as UnitKey].costume).length;
  const partyDamageMultiplier = 1 + Math.min(princessCount * 0.06 + costumeCount * 0.025, 0.45);

  for (const unit of [...state.allies, ...state.enemies]) {
    unit.attackCooldownMs = Math.max(0, unit.attackCooldownMs - tickMs);
  }

  for (const ally of state.allies) {
    const config = UNIT_CONFIG[ally.key as UnitKey];
    const targets = state.enemies
      .filter((enemy) => Math.abs(ally.x - enemy.x) <= config.range)
      .sort((a, b) => b.x - a.x)
      .slice(0, config.splashTargets ?? 1);
    if (targets.length > 0 && ally.attackCooldownMs <= 0) {
      for (const target of targets) {
        const enemyConfig = ENEMY_CONFIG[target.key as EnemyKey];
        const effectiveArmor = Math.max(0, enemyConfig.armor - (config.armorPierce ?? 0));
        const dealtDamage = Math.max(1, Math.round((config.attack - effectiveArmor) * partyDamageMultiplier));
        damage.set(target.id, (damage.get(target.id) ?? 0) + dealtDamage);
      }
      ally.attackCooldownMs = config.attackIntervalMs;
      ally.lastAttackAtMs = state.totalElapsedMs;
    }
  }

  for (const enemy of state.enemies) {
    const config = ENEMY_CONFIG[enemy.key as EnemyKey];
    const target = closestEnemy(state.allies, enemy);
    if (target && target.x - enemy.x <= config.range && enemy.attackCooldownMs <= 0) {
      damage.set(target.id, (damage.get(target.id) ?? 0) + config.attack);
      enemy.attackCooldownMs = config.attackIntervalMs;
      enemy.lastAttackAtMs = state.totalElapsedMs;
    } else if (!target && GAME_CONFIG.burrowX - enemy.x <= config.range && enemy.attackCooldownMs <= 0) {
      burrowDamage += config.attack;
      enemy.attackCooldownMs = config.attackIntervalMs;
      enemy.lastAttackAtMs = state.totalElapsedMs;
    }
  }

  for (const combatant of [...state.allies, ...state.enemies]) {
    const rawDamage = damage.get(combatant.id) ?? 0;
    const isShieldedDragon = combatant.key === 'dragon' && state.stageElapsedMs < 20_000;
    const unitDamage = combatant.key === 'samurai'
      ? Math.floor(rawDamage * 0.55)
      : combatant.key === 'ninja'
        ? Math.floor(rawDamage * 0.75)
        : rawDamage;
    combatant.hp -= isShieldedDragon ? Math.floor(unitDamage * 0.7) : unitDamage;
  }
  state.burrowHp = Math.max(0, state.burrowHp - burrowDamage);

  const santaCount = state.allies.filter((ally) => ally.key === 'santa').length;
  if (santaCount > 0 && state.totalElapsedMs % 5_000 < tickMs) {
    const heal = santaCount * 4;
    for (const ally of state.allies) ally.hp = Math.min(ally.maxHp, ally.hp + heal);
    state.burrowHp = Math.min(GAME_CONFIG.burrowMaxHp, state.burrowHp + Math.min(5, santaCount));
  }

  const defeatedEnemies = state.enemies.filter((enemy) => enemy.hp <= 0);
  const pirateCount = state.allies.filter((ally) => ally.key === 'pirate').length;
  for (const enemy of defeatedEnemies) {
    const config = ENEMY_CONFIG[enemy.key as EnemyKey];
    const reward = Math.round(config.reward * (1 + Math.min(pirateCount * 0.08, 0.4)));
    state.carrots += reward;
    addLog(state, `${config.name} 처치 (+${reward} 당근)`);
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  state.allies = state.allies.filter((ally) => ally.hp > 0);
}

function finishStage(state: GameState) {
  state.clearedStages = state.stage;
  if (state.stage >= GAME_CONFIG.maxStage) {
    state.phase = 'won';
    state.phaseElapsedMs = 0;
    addLog(state, '토끼굴을 지켜냈습니다!');
    return;
  }
  const returningAllies = state.allies.length;
  const supply = GAME_CONFIG.stageClearCarrotBase + state.stage * GAME_CONFIG.stageClearCarrotPerStage;
  state.allies = [];
  state.carrots += supply;
  addLog(state, `${state.stage}스테이지 클리어 · 수호대 ${returningAllies}마리 귀환`);
  addLog(state, `다음 작전 보급 (+${supply} 당근)`);
  state.phase = 'preparation';
  state.phaseElapsedMs = 0;
}

function beginNextStage(state: GameState) {
  state.stage += 1;
  state.stageElapsedMs = 0;
  state.phaseElapsedMs = 0;
  state.pendingEnemies = waveFor(state.stage);
  state.phase = 'battle';
  addLog(state, `${state.stage}스테이지 전투 시작!`);
}

export function advanceGame(current: GameState, tickMs = GAME_CONFIG.tickMs): GameState {
  if (current.phase === 'ready' || current.phase === 'won' || current.phase === 'lost') return current;
  const state = structuredClone(current);
  state.totalElapsedMs += tickMs;
  state.phaseElapsedMs += tickMs;

  if (state.phase === 'preparation') {
    if (state.phaseElapsedMs >= GAME_CONFIG.preparationDurationMs) beginNextStage(state);
    return state;
  }

  state.stageElapsedMs += tickMs;
  state.passiveCarrotElapsedMs += tickMs;
  while (state.passiveCarrotElapsedMs >= GAME_CONFIG.passiveCarrotIntervalMs) {
    state.passiveCarrotElapsedMs -= GAME_CONFIG.passiveCarrotIntervalMs;
    state.carrots += GAME_CONFIG.passiveCarrotAmount;
    addLog(state, `시간 보급 (+${GAME_CONFIG.passiveCarrotAmount} 당근)`);
  }

  spawnPendingEnemies(state);
  runMovement(state, tickMs / 1000);
  runCombat(state, tickMs);

  if (state.enemies.length === 0 && state.pendingEnemies.length === 0) {
    finishStage(state);
  } else if (state.burrowHp <= 0) {
    state.phase = 'lost';
    addLog(state, '토끼굴이 무너졌습니다.');
  } else if (state.stageElapsedMs >= GAME_CONFIG.stageDurationMs) {
    state.phase = 'lost';
    addLog(state, '제한 시간 안에 적을 막지 못했습니다.');
  }
  return state;
}
