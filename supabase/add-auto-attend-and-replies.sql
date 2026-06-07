-- 1. award_points GRANT (출석 포인트 안 쌓이던 버그 수정)
GRANT EXECUTE ON FUNCTION public.award_points(uuid, int, text, text, jsonb) TO authenticated;
GRANT SELECT ON public.point_transactions TO authenticated;

-- 2. 자동 출석 체크 함수 (Header에서 매 방문마다 호출 — 하루 1회만 반영)
CREATE OR REPLACE FUNCTION public.auto_attend(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_today   date := current_date;
  v_updated int;
BEGIN
  -- 오늘 아직 출석 안 했으면 포인트 지급 + 컬럼 갱신
  UPDATE public.profiles
  SET points             = COALESCE(points, 0) + 50,
      last_attendance_at = now()
  WHERE id = p_user_id
    AND (last_attendance_at IS NULL
         OR date(last_attendance_at AT TIME ZONE 'Asia/Seoul') < v_today);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    -- 트랜잭션 기록 (중복 무시)
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

-- 3. 대댓글 테이블
CREATE TABLE IF NOT EXISTS public.review_replies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  uuid NOT NULL REFERENCES public.reviews(id)  ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment    text NOT NULL CHECK (char_length(trim(comment)) >= 1 AND char_length(comment) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_replies_review_id_idx ON public.review_replies (review_id);

ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "replies_read"   ON public.review_replies FOR SELECT USING (true);
CREATE POLICY "replies_insert" ON public.review_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "replies_delete" ON public.review_replies FOR DELETE USING  (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.review_replies TO authenticated;
GRANT SELECT ON public.review_replies TO anon;
