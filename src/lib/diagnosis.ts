import { WebtoonWithStats } from '@/types';

export type DiagnosisResult = {
  label: string;
  desc: string;
  colorClass: string;
  bgClass: string;
};

export function getDiagnosis(
  webtoon: Pick<WebtoonWithStats, 'avg_score' | 'review_count' | 'low_score_count' | 'high_score_count' | 'one_score_count' | 'ten_score_count'>
): DiagnosisResult | null {
  const { avg_score, review_count, one_score_count, ten_score_count } = webtoon;
  if (review_count < 5) return null;

  const pct = (n: number) => Math.round((n / review_count) * 100);

  // 점수 인플레: 10점 40%↑, 1점 10%↓
  if (ten_score_count / review_count >= 0.4 && one_score_count / review_count < 0.1) {
    return {
      label: '점수 인플레 의심',
      desc: `10점 비율 ${pct(ten_score_count)}% — 팬덤 결집 투표가 의심돼요`,
      colorClass: 'text-purple-600 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900',
    };
  }

  // 점수 디플레: 1점 30%↑
  if (one_score_count / review_count >= 0.3) {
    return {
      label: '점수 디플레 의심',
      desc: `1점 비율 ${pct(one_score_count)}% — 안티 집중 투표가 의심돼요`,
      colorClass: 'text-red-600 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900',
    };
  }

  // 극단적 양극화: 1점+10점 합 50%↑
  if ((one_score_count + ten_score_count) / review_count >= 0.5) {
    return {
      label: '평가 극도 양극화',
      desc: `1점·10점 합계 ${pct(one_score_count + ten_score_count)}% — 호불호가 극명하게 갈려요`,
      colorClass: 'text-orange-600 dark:text-orange-400',
      bgClass: 'bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900',
    };
  }

  // 명작: 평균 8.5↑ + 20명↑
  if (avg_score !== null && avg_score >= 8.5 && review_count >= 20) {
    return {
      label: '별토끼 공인 명작',
      desc: `${review_count}명 평가 평균 ${avg_score.toFixed(1)}점 — 쏠림 없이 높은 점수`,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900',
    };
  }

  // 혹평작: 평균 4.0↓ + 10명↑
  if (avg_score !== null && avg_score <= 4.0 && review_count >= 10) {
    return {
      label: '별토끼 공인 혹평작',
      desc: `${review_count}명 평가 평균 ${avg_score.toFixed(1)}점 — 대다수가 낮은 점수`,
      colorClass: 'text-gray-500 dark:text-gray-400',
      bgClass: 'bg-gray-50 dark:bg-gray-950/30 border-gray-100 dark:border-gray-800',
    };
  }

  return null;
}
