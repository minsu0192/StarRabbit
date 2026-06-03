interface Props {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreBadge({ score, size = 'md' }: Props) {
  if (score === null) {
    const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-2xl font-black' : 'text-sm font-bold';
    return <span className={`${sizeClass} text-gray-400`}>-</span>;
  }

  const color =
    score >= 8.0 ? 'text-green-500' :
    score >= 5.0 ? 'text-yellow-500' :
    'text-red-500';

  const sizeClass =
    size === 'sm' ? 'text-xs font-bold' :
    size === 'lg' ? 'text-3xl font-black' :
    'text-sm font-bold';

  return <span className={`${sizeClass} ${color} tabular-nums`}>{score.toFixed(1)}</span>;
}
