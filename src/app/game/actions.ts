'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { advanceGame, applySpawnCommand, createInitialGameState, startGame } from '@/lib/game/engine';
import { GAME_CONFIG, UNIT_CONFIG } from '@/lib/game/config';
import { MAX_ATTEMPTS_PER_DAY } from '@/lib/game/rewards';
import type { SpawnCommand, UnitKey } from '@/lib/game/types';

type StartResult = { runId?: string; attemptsUsed?: number; bestStage?: number; error?: string };
type FinishResult = { finalStage?: number; rewardStars?: number; bestStage?: number; error?: string };

export async function startGameRun(): Promise<StartResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };
  let { data, error } = await supabase.rpc('start_rabbit_game');
  if (error?.message.includes('active run exists')) {
    const service = createServiceClient();
    const { error: expireError } = await service.from('game_runs')
      .update({ status: 'expired', finished_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'active');
    if (expireError) return { error: '이전 게임을 종료하지 못했습니다. 잠시 후 다시 시도해주세요' };
    const retry = await supabase.rpc('start_rabbit_game');
    data = retry.data;
    error = retry.error;
  }
  if (error) {
    if (error.message.includes('daily attempts exhausted')) return { error: `오늘의 도전 ${MAX_ATTEMPTS_PER_DAY}회를 모두 사용했어요` };
    if (error.message.includes('active run exists')) return { error: '이전 게임을 정리하지 못했습니다. 다시 시도해주세요' };
    return { error: error.message.includes('start_rabbit_game') ? '게임 DB 설정이 필요합니다' : error.message };
  }
  const result = data as { run_id: string; attempts_used: number; best_stage: number };
  return { runId: result.run_id, attemptsUsed: result.attempts_used, bestStage: result.best_stage };
}

function parseCommands(value: unknown): SpawnCommand[] | null {
  if (!Array.isArray(value) || value.length > 200) return null;
  const commands: SpawnCommand[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index] as Partial<SpawnCommand>;
    if (item.type !== 'spawn' || item.seq !== index + 1 || !Number.isInteger(item.elapsedMs)
      || item.elapsedMs! < 0 || typeof item.unitKey !== 'string' || !(item.unitKey in UNIT_CONFIG)) return null;
    if (index > 0 && item.elapsedMs! < commands[index - 1].elapsedMs) return null;
    commands.push(item as SpawnCommand);
  }
  return commands;
}

export async function finishGameRun(runId: string, rawCommands: unknown, elapsedMs: number): Promise<FinishResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };
  const commands = parseCommands(rawCommands);
  if (!runId || !commands || !Number.isInteger(elapsedMs) || elapsedMs < 0 || elapsedMs > 45 * 60_000) return { error: '잘못된 게임 기록입니다' };

  const service = createServiceClient();
  const { data: run, error: runError } = await service.from('game_runs')
    .select('user_id, status, unlock_snapshot, started_at, expires_at').eq('id', runId).single();
  if (runError || !run || run.user_id !== user.id || run.status !== 'active') return { error: '유효한 게임 실행을 찾을 수 없습니다' };
  if (new Date(run.expires_at).getTime() < Date.now()) return { error: '게임 실행이 만료됐습니다' };

  const wallElapsed = Date.now() - new Date(run.started_at).getTime();
  if (elapsedMs > wallElapsed * 3.15 + 10_000) return { error: '게임 진행 시간이 서버 시간과 맞지 않습니다' };
  const unlocks = new Set(Array.isArray(run.unlock_snapshot) ? run.unlock_snapshot as UnitKey[] : []);
  if (commands.some((command) => !unlocks.has(command.unitKey))) return { error: '잠긴 토끼가 포함된 기록입니다' };

  let state = startGame(createInitialGameState());
  let commandIndex = 0;
  while (state.totalElapsedMs < elapsedMs && state.phase !== 'won' && state.phase !== 'lost') {
    while (commandIndex < commands.length && commands[commandIndex].elapsedMs <= state.totalElapsedMs) {
      const result = applySpawnCommand(state, commands[commandIndex]);
      if (!result.accepted) return { error: `검증되지 않은 생산 명령: ${result.reason}` };
      state = result.state;
      commandIndex += 1;
    }
    state = advanceGame(state, GAME_CONFIG.tickMs);
  }
  if (commandIndex < commands.length) return { error: '종료 시간 이후의 명령이 포함되어 있습니다' };
  if (state.phase !== 'won' && state.phase !== 'lost') return { error: '아직 종료되지 않은 게임입니다' };

  const { data, error } = await service.rpc('finish_rabbit_game_verified', {
    p_run_id: runId, p_user_id: user.id, p_final_stage: state.clearedStages,
    p_elapsed_ms: state.totalElapsedMs, p_command_log: commands,
  });
  if (error) return { error: error.message };
  const result = data as { final_stage: number; reward_stars: number; best_stage: number };
  return { finalStage: result.final_stage, rewardStars: result.reward_stars, bestStage: result.best_stage };
}
