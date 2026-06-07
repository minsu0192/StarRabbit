-- 스타 시스템 업데이트
-- 1. 출석체크 컬럼 추가
-- 2. 추천 받을 때 +10 스타 트리거 업데이트
-- 3. 주간 랭킹 스타 배분 함수

-- 출석체크 마지막 시각 컬럼
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_attendance_at timestamptz;

-- 추천 추가 시 review.recommend_count + 1, profiles.total_recommends + 1, profiles.points + 10
CREATE OR REPLACE FUNCTION public.handle_recommend_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.reviews SET recommend_count = recommend_count + 1 WHERE id = NEW.review_id;
  UPDATE public.profiles
    SET total_recommends = total_recommends + 1,
        points = COALESCE(points, 0) + 10
    WHERE id = (SELECT user_id FROM public.reviews WHERE id = NEW.review_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 추천 취소 시 review.recommend_count - 1, profiles.total_recommends - 1
-- 이미 획득한 points는 유지한다.
CREATE OR REPLACE FUNCTION public.handle_recommend_delete()
RETURNS trigger AS $$
BEGIN
  UPDATE public.reviews SET recommend_count = GREATEST(recommend_count - 1, 0) WHERE id = OLD.review_id;
  UPDATE public.profiles
    SET total_recommends = GREATEST(total_recommends - 1, 0)
    WHERE id = (SELECT user_id FROM public.reviews WHERE id = OLD.review_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 주간 랭킹 스타 배분 함수 (매주 월요일 자정 실행)
-- 지난 주(월~일) 동안 추천을 가장 많이 받은 유저 TOP 5에게 스타 지급
CREATE OR REPLACE FUNCTION public.distribute_weekly_ranking_stars()
RETURNS int AS $$
DECLARE
  week_start timestamptz := date_trunc('week', now()) - interval '7 days';
  week_end   timestamptz := date_trunc('week', now());
  week_label text         := to_char(week_start, 'IYYY-IW');
  star_awards int[]       := ARRAY[500, 400, 300, 200, 100];
  winner     RECORD;
  rank_idx   int          := 0;
  distributed int         := 0;
BEGIN
  FOR winner IN (
    SELECT r.user_id, COUNT(*) AS weekly_recommends
    FROM   public.recommends rec
    JOIN   public.reviews r ON rec.review_id = r.id
    WHERE  rec.created_at >= week_start
      AND  rec.created_at <  week_end
    GROUP  BY r.user_id
    ORDER  BY weekly_recommends DESC
    LIMIT  5
  ) LOOP
    rank_idx := rank_idx + 1;
    PERFORM public.award_points(
      winner.user_id,
      star_awards[rank_idx],
      '주간랭킹 ' || rank_idx || '위',
      'weekly-rank:' || week_label || ':rank-' || rank_idx || ':' || winner.user_id::text,
      jsonb_build_object('week', week_label, 'rank', rank_idx, 'weekly_recommends', winner.weekly_recommends)
    );
    distributed := distributed + 1;
  END LOOP;
  RETURN distributed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.distribute_weekly_ranking_stars() TO anon, authenticated;
