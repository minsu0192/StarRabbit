'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import TierBunny from '@/components/TierBunny';
import { ENEMY_CONFIG, GAME_CONFIG, UNIT_CONFIG, rangeLabel } from '@/lib/game/config';
import { advanceGame, applySpawnCommand, createInitialGameState, createSpawnCommand, startGame } from '@/lib/game/engine';
import type { AttackStyle } from '@/lib/game/config';
import type { EnemyKey, GameState, UnitKey } from '@/lib/game/types';
import type { SpawnCommand } from '@/lib/game/types';
import { finishGameRun, startGameRun } from './actions';

type Props = {
  nickname: string;
  tierLabel: string;
  unlockedUnits: UnitKey[];
  initialAttemptsUsed: number;
  initialBestStage: number;
  gameDatabaseReady: boolean;
};

const ATTACK_MARK: Record<AttackStyle, string> = {
  bonk: '✦', leaf: '🍃', dash: '💨', moon: '☾', star: '★', beam: '━', rocket: '🚀', flame: '🔥',
  shuriken: '✥', slash: '╱', heart: '♥', magic: '●', coin: '●', laser: '━', fire: '◆', gift: '🎁',
};

const ENEMY_MARK: Record<EnemyKey, string> = {
  snake: '🐍', fox: '🦊', wolf: '🐺', tiger: '🐯', dragon: '🐲',
};

function formatTime(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function GameClient({ nickname, tierLabel, unlockedUnits, initialAttemptsUsed, initialBestStage, gameDatabaseReady }: Props) {
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [feedback, setFeedback] = useState('토끼 카드를 눌러 수호대를 보내세요.');
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const [runId, setRunId] = useState<string | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(initialAttemptsUsed);
  const [bestStage, setBestStage] = useState(initialBestStage);
  const [starting, setStarting] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const clockRef = useRef<number | null>(null);
  const commandsRef = useRef<SpawnCommand[]>([]);
  const finishingRunRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.phase !== 'battle' && state.phase !== 'preparation') return;
    clockRef.current = window.setInterval(() => {
      setState((current) => {
        let next = current;
        for (let i = 0; i < speed; i += 1) next = advanceGame(next);
        return next;
      });
    }, GAME_CONFIG.tickMs);
    return () => { if (clockRef.current !== null) window.clearInterval(clockRef.current); };
  }, [speed, state.phase]);

  useEffect(() => {
    if (!runId || (state.phase !== 'won' && state.phase !== 'lost') || finishingRunRef.current === runId) return;
    finishingRunRef.current = runId;
    finishGameRun(runId, commandsRef.current, state.totalElapsedMs).then((result) => {
      if (result.error) {
        setResultMessage(`검증 실패: ${result.error}`);
        return;
      }
      setBestStage(result.bestStage ?? state.clearedStages);
      setResultMessage(result.rewardStars
        ? `서버 검증 완료 · ${result.rewardStars}스타 지급`
        : '서버 검증 완료 · 지급할 스타가 없습니다');
    });
  }, [runId, state.clearedStages, state.phase, state.totalElapsedMs]);

  const remainingMs = state.phase === 'battle' ? GAME_CONFIG.stageDurationMs - state.stageElapsedMs : GAME_CONFIG.preparationDurationMs - state.phaseElapsedMs;
  const visibleLogs = state.logs.slice(0, 3);
  const enemyCounts = useMemo(() => state.enemies.reduce<Record<string, number>>((counts, enemy) => {
    counts[enemy.key] = (counts[enemy.key] ?? 0) + 1;
    return counts;
  }, {}), [state.enemies]);

  function spawn(unitKey: UnitKey) {
    setState((current) => {
      const result = applySpawnCommand(current, createSpawnCommand(current, unitKey));
      setFeedback(result.reason ?? `${UNIT_CONFIG[unitKey].name} 출전!`);
      if (result.accepted) commandsRef.current.push(createSpawnCommand(current, unitKey));
      return result.state;
    });
  }

  function reset() {
    setFeedback('토끼 카드를 눌러 수호대를 보내세요.');
    setSpeed(1);
    setRunId(null);
    commandsRef.current = [];
    setResultMessage('');
    setState(createInitialGameState());
  }

  async function beginRun() {
    if (!gameDatabaseReady) {
      setFeedback('게임 DB SQL을 먼저 적용해주세요.');
      return;
    }
    setStarting(true);
    setFeedback('서버에서 도전권을 확인하고 있어요.');
    const result = await startGameRun();
    setStarting(false);
    if (result.error || !result.runId) {
      setFeedback(result.error ?? '게임을 시작하지 못했습니다');
      return;
    }
    commandsRef.current = [];
    finishingRunRef.current = null;
    setRunId(result.runId);
    setAttemptsUsed(result.attemptsUsed ?? attemptsUsed + 1);
    setBestStage(result.bestStage ?? bestStage);
    setResultMessage('');
    setState((current) => startGame(current));
  }

  return (
    <main className="game-shell flex-1 overflow-hidden bg-[#f8f5ed] dark:bg-[#111310]">
      <section className="relative overflow-hidden border-b border-amber-200 bg-[#fffaf0] px-4 py-5 dark:border-amber-950 dark:bg-[#171610]">
        <div className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full bg-amber-200/35 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-amber-600">RABBIT HOLE GUARDIANS</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">토끼굴 수호대</h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400"><b className="text-gray-800 dark:text-gray-200">{nickname}</b> 수호대장 · {tierLabel} · 오늘 {attemptsUsed}/3회 · 최고 {bestStage}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 px-3 py-2 text-right shadow-sm dark:border-amber-900 dark:bg-black/20">
            <p className="text-[10px] font-bold text-gray-400">STAGE</p>
            <p className="text-lg font-black tabular-nums">{state.stage}<span className="text-xs text-gray-400"> / {GAME_CONFIG.maxStage}</span></p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-[#171816]">
        <div>
          <div className="flex justify-between text-[11px] font-bold"><span>토끼굴 내구도</span><span>{state.burrowHp}/100</span></div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200 dark:bg-stone-800 dark:ring-stone-700"><div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-[width]" style={{ width: `${Math.max(0, state.burrowHp)}%` }} /></div>
        </div>
        <div className="min-w-16 rounded-xl bg-orange-50 px-2.5 py-2 text-center dark:bg-orange-950/30"><p className="text-[9px] font-bold text-orange-500">CARROT</p><p className="font-black tabular-nums">🥕 {state.carrots}</p></div>
        <button type="button" onClick={() => setSpeed((value) => value === 1 ? 2 : value === 2 ? 3 : 1)} className="h-full min-w-14 rounded-xl border border-stone-200 bg-stone-50 px-2 text-xs font-black dark:border-stone-700 dark:bg-stone-900" aria-label="게임 속도 변경">{speed}×<span className="ml-1 text-[9px] text-gray-400">속도</span></button>
      </section>

      <section className="p-3 sm:p-4">
        <div className="battlefield relative h-64 overflow-hidden rounded-[28px] border border-[#b5d8ba] bg-gradient-to-b from-[#bde7f4] via-[#d9f1df] to-[#8cc47f] shadow-inner dark:border-emerald-900 dark:from-[#173342] dark:via-[#17382b] dark:to-[#28502d]">
          <div className="absolute left-5 top-5 h-10 w-16 rounded-full bg-white/70 blur-[1px] before:absolute before:-top-3 before:left-5 before:h-8 before:w-8 before:rounded-full before:bg-white/70" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[#77ad65]/75 dark:bg-[#204a2a]" />
          <div className="absolute inset-x-0 bottom-14 h-1 bg-white/25" />
          <div className="absolute bottom-10 right-1 z-10 flex h-24 w-20 items-center justify-center rounded-t-[50%] border-[5px] border-[#704226] bg-[#9b6238] shadow-lg" aria-label="토끼굴"><div className="h-14 w-11 rounded-t-full bg-[#312018] shadow-inner"><span className="absolute -top-6 right-1 text-3xl">🌿</span></div></div>

          {state.enemies.map((enemy) => {
            const config = ENEMY_CONFIG[enemy.key as EnemyKey];
            const boss = enemy.key === 'dragon';
            return <div key={enemy.id} className="game-combatant absolute bottom-14 z-20 -translate-x-1/2 transition-[left] duration-100" style={{ left: `${enemy.x / 10}%` }}><div className={`${boss ? 'w-16' : 'w-9'} mb-0.5 h-1 overflow-hidden rounded bg-black/20`}><div className="h-full bg-red-500" style={{ width: `${Math.max(0, enemy.hp / enemy.maxHp * 100)}%` }} /></div><div className={`${boss ? 'text-6xl' : 'text-3xl'} text-center drop-shadow-md`} title={config.name}>{ENEMY_MARK[enemy.key as EnemyKey]}</div>{boss && state.stageElapsedMs < 20_000 && <div className="absolute -inset-2 -z-10 rounded-full border-2 border-cyan-200/80 bg-cyan-300/10 shadow-[0_0_18px_rgba(103,232,249,.75)]" />}</div>;
          })}

          {state.allies.map((ally) => {
            const config = UNIT_CONFIG[ally.key as UnitKey];
            const attacking = state.totalElapsedMs - ally.lastAttackAtMs < 300;
            return (
              <div key={ally.id} className={`game-combatant absolute bottom-11 z-30 -translate-x-1/2 transition-[left] duration-100 ${attacking ? 'is-attacking' : ''}`} style={{ left: `${ally.x / 10}%`, ['--unit-color' as string]: config.color, ['--attack-distance' as string]: `${Math.max(30, Math.round(config.range / 2.8))}px` }}>
                <div className="mx-auto mb-0.5 h-1 w-10 overflow-hidden rounded bg-black/20"><div className="h-full" style={{ width: `${Math.max(0, ally.hp / ally.maxHp * 100)}%`, backgroundColor: config.color }} /></div>
                <div className="game-bunny origin-bottom"><TierBunny tier={config.tier} costume={config.costume} size={54} /></div>
                {attacking && <span className={`attack-effect attack-${config.attackStyle}`} aria-hidden="true">{ATTACK_MARK[config.attackStyle]}</span>}
              </div>
            );
          })}

          <div className="absolute left-3 top-3 z-40 rounded-xl border border-white/50 bg-white/85 px-3 py-2 text-[11px] font-black text-gray-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/45 dark:text-gray-100">
            <span className="mr-2 text-amber-600">{state.phase === 'ready' ? '준비' : state.phase === 'preparation' ? '정비' : formatTime(remainingMs)}</span>
            {Object.keys(enemyCounts).length === 0 ? '적 출현 대기' : Object.entries(enemyCounts).map(([key, count]) => `${ENEMY_CONFIG[key as EnemyKey].name} ${count}`).join(' · ')}
          </div>

          {(state.phase === 'ready' || state.phase === 'won' || state.phase === 'lost') && <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#fff3ba]/95 via-[#dff7d8]/95 to-[#8bc982]/95 px-6 text-center text-[#273322] backdrop-blur-[3px] dark:from-[#26351d]/95 dark:via-[#173126]/95 dark:to-[#173c24]/95 dark:text-white"><span className="game-intro-star absolute left-8 top-8 text-2xl text-amber-400">★</span><span className="game-intro-star absolute right-10 top-14 text-lg text-amber-300">✦</span><span className="game-intro-carrot absolute right-6 top-28 text-2xl">🥕</span>{state.phase === 'ready' ? <div className="relative h-28 w-56"><div className="absolute bottom-0 left-4 -rotate-6"><TierBunny tier="길토끼" size={78} /></div><div className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2"><TierBunny tier={tierLabel} size={105} /></div><div className="absolute bottom-0 right-3 rotate-6"><TierBunny tier={unlockedUnits.includes('ninja') ? '들토끼' : '풀토끼'} costume={unlockedUnits.includes('ninja') ? 'ninja' : undefined} size={78} /></div></div> : <div className="rounded-full bg-white/25 p-2 ring-1 ring-white/40"><TierBunny tier={tierLabel} size={88} /></div>}<p className="mt-1 text-[10px] font-black tracking-[0.22em] text-amber-700 dark:text-amber-300">RABBIT GUARDIANS</p><p className="mt-1 text-2xl font-black">{state.phase === 'ready' ? '토끼들아, 출동 준비!' : state.phase === 'won' ? '20스테이지 방어 성공!' : '토끼굴 방어 실패'}</p><p className="mt-1 text-xs text-current/70">{state.phase === 'ready' ? `매 스테이지 새 수호대를 편성해요 · 남은 도전 ${Math.max(0, 3 - attemptsUsed)}회` : resultMessage || `${state.clearedStages}스테이지 기록을 서버에서 검증 중...`}</p><button type="button" disabled={starting || (state.phase === 'ready' && attemptsUsed >= 3)} onClick={() => state.phase === 'ready' ? beginRun() : reset()} className="mt-3 rounded-full bg-amber-400 px-7 py-3 text-sm font-black text-gray-950 shadow-xl shadow-emerald-950/20 transition hover:-translate-y-0.5 disabled:opacity-40">{state.phase === 'ready' ? starting ? '도전권 확인 중...' : attemptsUsed >= 3 ? '오늘 도전 완료' : '수호대 출동!' : '다시 도전'}</button></div>}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-[#fffdf8] py-4 dark:border-stone-800 dark:bg-[#171816]">
        <div className="flex items-center justify-between px-4"><div><h2 className="text-sm font-black">출전 가능한 토끼</h2><p className="mt-0.5 text-[10px] text-gray-400">등급 토끼 + 보유 코스튬</p></div><div className="text-right"><p className="text-xs font-black">{state.allies.length}/{GAME_CONFIG.maxAllies}</p><p className="max-w-40 truncate text-[10px] text-gray-400">{feedback}</p></div></div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {unlockedUnits.map((key) => {
            const unit = UNIT_CONFIG[key];
            const disabled = !['battle', 'preparation'].includes(state.phase) || state.carrots < unit.cost || state.allies.length >= GAME_CONFIG.maxAllies;
            return <button key={key} type="button" disabled={disabled} onClick={() => spawn(key)} className="group relative w-[98px] shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-white px-2 pb-2 pt-1.5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900"><div className="mx-auto h-[62px] overflow-hidden"><TierBunny tier={unit.tier} costume={unit.costume} size={64} /></div><span className="block truncate text-[11px] font-black" style={{ color: unit.color }}>{unit.name}</span><span className="mt-0.5 block text-[10px] font-black text-orange-500">🥕 {unit.cost}</span><span className="mt-1 block truncate text-[8px] font-bold text-gray-400">공격 {unit.attack} · HP {unit.hp}</span><span className="mt-0.5 block text-[8px] font-black text-sky-600 dark:text-sky-400">{rangeLabel(unit.range)} · 사거리 {unit.range}</span></button>;
          })}
        </div>
      </section>

      <section className="px-4 py-4" aria-live="polite"><div className="flex items-center justify-between"><h2 className="text-xs font-black tracking-wide">BATTLE LOG</h2><span className="text-[10px] text-gray-400">10초마다 당근 +5</span></div><ol className="mt-2 space-y-1 rounded-2xl border border-stone-200 bg-white p-3 text-[11px] text-gray-600 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-gray-300">{visibleLogs.map((log, index) => <li key={`${log}-${index}`}><span className="mr-1 text-amber-500">›</span>{log}</li>)}</ol></section>
    </main>
  );
}
