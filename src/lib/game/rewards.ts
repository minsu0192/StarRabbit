export const STARS_PER_CLEARED_STAGE = 10;
export const MAX_ATTEMPTS_PER_DAY = 3;
export const MAX_STARS_PER_RUN = 20 * STARS_PER_CLEARED_STAGE;
export const MAX_DAILY_GAME_STARS = MAX_ATTEMPTS_PER_DAY * MAX_STARS_PER_RUN;

export function gameRunReward(clearedStages: number) {
  return Math.min(20, Math.max(0, Math.floor(clearedStages))) * STARS_PER_CLEARED_STAGE;
}
