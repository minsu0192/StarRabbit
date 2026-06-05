import Link from 'next/link';
import { WebtoonWithStats } from '@/types';
import ScoreBadge from './ScoreBadge';
import { PlatformBadges } from './PlatformBadge';

interface Props {
  webtoon: WebtoonWithStats;
  rank: number;
}

function getScoreSignal(webtoon: WebtoonWithStats) {
  if (webtoon.review_count < 8) return null;

  const lowRatio = webtoon.low_score_count / webtoon.review_count;
  const highRatio = webtoon.high_score_count / webtoon.review_count;
  const oneRatio = webtoon.one_score_count / webtoon.review_count;
  const tenRatio = webtoon.ten_score_count / webtoon.review_count;

  if (lowRatio >= 0.25 && highRatio >= 0.25) {
    return { label: '극과 극', className: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300' };
  }
  if (oneRatio >= 0.35 || lowRatio >= 0.55) {
    return { label: '테러 의심', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' };
  }
  if (tenRatio >= 0.45 || highRatio >= 0.75) {
    return { label: '10점 쏠림', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' };
  }

  return null;
}

export default function WebtoonRow({ webtoon, rank }: Props) {
  const scoreSignal = getScoreSignal(webtoon);

  const rankColor =
    rank === 1 ? 'text-amber-500 font-black' :
    rank === 2 ? 'text-gray-500 font-black' :
    rank === 3 ? 'text-orange-400 font-black' :
    'text-gray-300 dark:text-gray-600 font-bold';

  const platformAccent =
    webtoon.sources.some((source) => source.platform === 'naver') ? 'border-l-[#03C75A]' :
    webtoon.sources.some((source) => source.platform === 'kakao') ? 'border-l-[#FEE500]' :
    webtoon.sources.some((source) => source.platform === 'ridi') ? 'border-l-[#1f8ce6]' :
    'border-l-transparent';

  return (
    <li>
      <Link href={`/webtoon/${webtoon.id}`} className={`flex items-center gap-3 border-l-2 px-4 py-3.5 ${platformAccent} transition-colors hover:bg-white active:bg-gray-100 dark:hover:bg-gray-950 dark:active:bg-gray-900`}>
        <span className={`w-6 shrink-0 text-center text-sm tabular-nums ${rankColor}`}>
          {rank}
        </span>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold leading-snug">{webtoon.title}</span>
            {scoreSignal && (
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${scoreSignal.className}`}>
                {scoreSignal.label}
              </span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs text-gray-500 dark:text-gray-400">{webtoon.author}</span>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <PlatformBadges platforms={webtoon.sources.map((source) => source.platform)} />
            {webtoon.genre && (
              <span className="truncate text-xs text-gray-400 dark:text-gray-500">{webtoon.genre}</span>
            )}
          </div>
        </div>

        <div className="shrink-0 space-y-0.5 text-right">
          <ScoreBadge score={webtoon.avg_score} size="md" />
          <div className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
            {webtoon.review_count > 0 ? `${webtoon.review_count.toLocaleString()}명` : '−'}
          </div>
        </div>
      </Link>
    </li>
  );
}
