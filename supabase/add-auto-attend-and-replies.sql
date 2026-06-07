-- ============================================================
-- 1. profiles에 points 컬럼 추가 (없으면)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points int NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_attendance_at timestamptz;

-- ============================================================
-- 2. point_transactions 테이블 (스타 획득 내역)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount     int     NOT NULL CHECK (amount <> 0),
  reason     text    NOT NULL,
  unique_key text    NOT NULL,
  metadata   jsonb   NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unique_key)
);

CREATE INDEX IF NOT EXISTS point_transactions_user_id_idx ON public.point_transactions(user_id);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "point_transactions_read_own" ON public.point_transactions;

CREATE POLICY "point_transactions_read_own"
  ON public.point_transactions FOR SELECT
  USING (auth.uid() = user_id);

GRANT SELECT ON public.point_transactions TO authenticated;

-- ============================================================
-- 3. award_points 함수 (중복 키로 멱등성 보장)
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id   uuid,
  p_amount    int,
  p_reason    text,
  p_unique_key text,
  p_metadata  jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean AS $$
DECLARE
  inserted_count int;
BEGIN
  INSERT INTO public.point_transactions (user_id, amount, reason, unique_key, metadata)
  VALUES (p_user_id, p_amount, p_reason, p_unique_key, p_metadata)
  ON CONFLICT (unique_key) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count = 0 THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET points = GREATEST(points + p_amount, 0)
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.award_points(uuid, int, text, text, jsonb) TO authenticated;

-- ============================================================
-- 4. 추천 트리거 업데이트 (points 컬럼 포함)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_recommend_insert()
RETURNS trigger AS $$
DECLARE
  v_review_owner uuid;
BEGIN
  UPDATE public.reviews
  SET recommend_count = recommend_count + 1
  WHERE id = NEW.review_id
  RETURNING user_id INTO v_review_owner;

  UPDATE public.profiles
  SET total_recommends = total_recommends + 1,
      points           = COALESCE(points, 0) + 10
  WHERE id = v_review_owner;

  INSERT INTO public.point_transactions (user_id, amount, reason, unique_key, metadata)
  VALUES (
    v_review_owner,
    10,
    '추천 받기',
    'recommend:' || NEW.id::text,
    jsonb_build_object('review_id', NEW.review_id, 'from_user', NEW.user_id)
  )
  ON CONFLICT (unique_key) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_recommend_delete()
RETURNS trigger AS $$
DECLARE
  v_review_owner uuid;
BEGIN
  UPDATE public.reviews
  SET recommend_count = GREATEST(recommend_count - 1, 0)
  WHERE id = OLD.review_id;

  SELECT user_id INTO v_review_owner FROM public.reviews WHERE id = OLD.review_id;

  UPDATE public.profiles
  SET total_recommends = GREATEST(total_recommends - 1, 0)
  WHERE id = v_review_owner;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 5. 자동 출석 체크 함수 (하루 1회만 반영)
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_attend(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_today   date := current_date;
  v_updated int;
BEGIN
  UPDATE public.profiles
  SET points             = COALESCE(points, 0) + 50,
      last_attendance_at = now()
  WHERE id = p_user_id
    AND (last_attendance_at IS NULL
         OR date(last_attendance_at AT TIME ZONE 'Asia/Seoul') < v_today);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    INSERT INTO public.point_transactions (user_id, amount, reason, unique_key, metadata)
    VALUES (
      p_user_id,
      50,
      '출석 체크',
      'attendance:' || p_user_id::text || ':' || v_today::text,
      jsonb_build_object('date', v_today::text)
    )
    ON CONFLICT (unique_key) DO NOTHING;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.auto_attend(uuid) TO authenticated;

-- ============================================================
-- 6. 대댓글(review_replies) 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.review_replies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  uuid NOT NULL REFERENCES public.reviews(id)  ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment    text NOT NULL CHECK (char_length(trim(comment)) >= 1 AND char_length(comment) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_replies_review_id_idx ON public.review_replies (review_id);

ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "replies_read"   ON public.review_replies;
DROP POLICY IF EXISTS "replies_insert" ON public.review_replies;
DROP POLICY IF EXISTS "replies_delete" ON public.review_replies;

CREATE POLICY "replies_read"   ON public.review_replies FOR SELECT USING (true);
CREATE POLICY "replies_insert" ON public.review_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "replies_delete" ON public.review_replies FOR DELETE USING  (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.review_replies TO authenticated;
GRANT SELECT ON public.review_replies TO anon;
