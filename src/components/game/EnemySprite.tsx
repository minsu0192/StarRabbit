import type { EnemyKey } from '@/lib/game/types';

type Props = { enemy: EnemyKey; size?: number };

const palette: Record<EnemyKey, [string, string, string]> = {
  snake: ['#84cc16', '#365314', '#facc15'], fox: ['#f97316', '#7c2d12', '#fff7ed'],
  wolf: ['#64748b', '#1e293b', '#cbd5e1'], tiger: ['#ea580c', '#431407', '#fed7aa'],
  dragon: ['#dc2626', '#450a0a', '#fbbf24'],
};

export default function EnemySprite({ enemy, size = 48 }: Props) {
  const [body, dark, accent] = palette[enemy];
  if (enemy === 'snake') return <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true"><path d="M59 66c-22 8-43-2-40-18 2-11 18-10 27-13 12-4 13-16 5-22" fill="none" stroke={dark} strokeWidth="14" strokeLinecap="round"/><path d="M59 66c-22 8-43-2-40-18 2-11 18-10 27-13 12-4 13-16 5-22" fill="none" stroke={body} strokeWidth="10" strokeLinecap="round"/><path d="M45 9l14-4 12 9-6 17-17 1-8-12z" fill={body} stroke={dark} strokeWidth="3"/><path d="M43 13l-8-6 3 12m27-8 10-3-7 9" fill={accent} stroke={dark} strokeWidth="2"/><circle cx="51" cy="18" r="2.8"/><circle cx="64" cy="18" r="2.8"/><path d="M55 26l3 5 3-5M51 45l8 4m-32 3 9 5" stroke={dark} strokeWidth="2"/></svg>;
  if (enemy === 'dragon') return <svg viewBox="0 0 100 90" width={size} height={size * .9} aria-hidden="true"><path d="M28 39L5 22l8 34 20 4m39-21 23-17-8 34-20 4" fill={dark} stroke="#7f1d1d" strokeWidth="3"/><path d="M31 20L20 3l19 10m30 7L80 3 61 13" fill={accent} stroke={dark} strokeWidth="4"/><path d="M30 18h40l13 23-7 34-26 12-26-12-7-34z" fill={body} stroke={dark} strokeWidth="4"/><path d="M42 19l8-12 8 12m-24 8-12-7 6 15m38-8 12-7-6 15" fill={accent} stroke={dark} strokeWidth="3"/><path d="M31 43l14-5-5 12m29-7-14-5 5 12" fill="#fde68a" stroke={dark} strokeWidth="3"/><circle cx="40" cy="44" r="3"/><circle cx="60" cy="44" r="3"/><path d="M39 65l11 6 11-6M46 58h8" fill="none" stroke={dark} strokeWidth="4"/></svg>;
  const fox = enemy === 'fox';
  return <svg viewBox="0 0 80 84" width={size} height={size * 1.05} aria-hidden="true"><path d="M19 30L10 5l24 15m27 10L70 5 46 20" fill={body} stroke={dark} strokeWidth="4"/><path d="M18 25l22-13 22 13 8 28-12 24H22L10 53z" fill={body} stroke={dark} strokeWidth="4"/><path d="M17 36h46" stroke={fox ? '#7c2d12' : accent} strokeWidth={fox ? 9 : 4}/>{enemy === 'wolf' && <path d="M15 48l8-16 17 8 17-8 8 16-5 25H20z" fill="#334155" stroke="#0f172a" strokeWidth="3"/>}{enemy === 'tiger' && <><path d="M25 21l7 12m23-12-7 12M16 45l13 5m35-5-13 5" stroke={dark} strokeWidth="5"/><path d="M25 63h30l5 14H20z" fill="#78350f" stroke={dark} strokeWidth="3"/></>}<path d="M25 39l10 4-8 6m28-10-10 4 8 6" fill={accent} stroke={dark} strokeWidth="2"/><circle cx="31" cy="43" r="2.6"/><circle cx="49" cy="43" r="2.6"/><path d="M35 56l5 4 5-4M40 60v5" fill="none" stroke={dark} strokeWidth="3"/><path d="M26 76v6m28-6v6" stroke={dark} strokeWidth="7" strokeLinecap="round"/></svg>;
}
