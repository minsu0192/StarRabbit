import Link from 'next/link';
import { WebtoonWithStats } from '@/types';
import ScoreBadge from './ScoreBadge';
import PlatformBadge from './PlatformBadge';

interface Props {
  webtoon: WebtoonWithStats;
  rank: number;
}

export default function WebtoonRow({ webtoon, rank }: Props) {
  const isPolarized =
    webtoon.review_count >= 10 &&
    webtoon.avg_score !== null &&
    (webtoon.avg_score <= 4.0 || webtoon.avg_score >= 8.5);

  const rankColor =
    rank === 1 ? 'text-amber-500 font-black' :
    rank === 2 ? 'text-gray-500 font-black' :
    rank === 3 ? 'text-orange-400 font-black' :
    'text-gray-300 dark:text-gray-600 font-bold';

  const platformAccent =
    webtoon.platform === 'naver' ? 'border-l-[#03C75A]' :
    webtoon.platform === 'kakao' ? 'border-l-[#FEE500]' :
    'border-l-transparent';

  return (
    <li>
      <Link href={`/webtoon/${webtoon.id}`} className={`flex items-center gap-3 px-4 py-3.5 border-l-2 ${platformAccent} hover:bg-gray-50 dark:hover:bg-gray-900/60 active:bg-gray-100 dark:active:bg-gray-800 transition-colors`}>

        {/* 순위 */}
        <span className={`w-6 text-center text-sm tabular-nums shrink-0 ${rankColor}`}>
          {rank}
        </span>

        {/* 정보 */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[15px] leading-snug">{webtoon.title}</span>
            {isPolarized && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-medium shrink-0">
                호불호
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">{webtoon.author}</span>
            <span className="text-gray-200 dark:text-gray-700">·</span>
            <PlatformBadge platform={webtoon.platform} />
            {webtoon.genre && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{webtoon.genre}</span>
            )}
          </div>
        </div>

        {/* 평점 */}
        <div className="text-right shrink-0 space-y-0.5">
          <div>
            <ScoreBadge score={webtoon.avg_score} size="md" />
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
            {webtoon.review_count > 0 ? `${webtoon.review_count.toLocaleString()}명` : '−'}
          </div>
        </div>
      </Link>
    </li>
  );
}
