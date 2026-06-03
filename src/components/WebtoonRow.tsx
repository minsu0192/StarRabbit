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
    webtoon.review_count >= 10 && webtoon.avg_score !== null &&
    (webtoon.avg_score <= 4.0 || webtoon.avg_score >= 8.5);

  return (
    <Link href={`/webtoon/${webtoon.id}`}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-100 dark:border-gray-800">
        {/* 순위 */}
        <span className="w-7 text-center text-sm font-bold text-gray-400 tabular-nums shrink-0">
          {rank}
        </span>

        {/* 제목/작가/플랫폼 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm truncate">{webtoon.title}</span>
            {isPolarized && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 shrink-0">
                호불호
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500">{webtoon.author}</span>
            <PlatformBadge platform={webtoon.platform} />
            {webtoon.genre && (
              <span className="text-xs text-gray-400">{webtoon.genre}</span>
            )}
          </div>
        </div>

        {/* 평점 + 참여수 */}
        <div className="text-right shrink-0">
          <ScoreBadge score={webtoon.avg_score} size="md" />
          <div className="text-xs text-gray-400 mt-0.5">
            {webtoon.review_count > 0 ? `${webtoon.review_count}명` : '평가없음'}
          </div>
        </div>
      </div>
    </Link>
  );
}
