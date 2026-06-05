interface Props {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreBadge({ score, size = 'md' }: Props) {
  const n = score === null ? null : Number(score);

  if (n === null || !Number.isFinite(n)) {
    const cls = size === 'sm' ? 'text-[11px] px-1.5 py-px' : size === 'lg' ? 'text-lg px-2.5 py-1' : 'text-xs px-2 py-0.5';
    return (
      <span className={`inline-flex items-center justify-center rounded-md font-black tabular-nums ${cls} bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500`}>
        −
      </span>
    );
  }

  const bg =
    n >= 8.0 ? 'bg-green-500 text-white' :
    n >= 5.0 ? 'bg-amber-400 text-white' :
               'bg-red-500 text-white';

  const cls =
    size === 'sm' ? 'text-[11px] px-1.5 py-px rounded-md' :
    size === 'lg' ? 'text-xl px-3 py-1.5 rounded-xl' :
                    'text-sm px-2 py-0.5 rounded-md';

  return (
    <span className={`inline-flex items-center justify-center font-black tabular-nums ${cls} ${bg}`}>
      {n.toFixed(1)}
    </span>
  );
}
