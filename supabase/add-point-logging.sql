-- 추천받기 트리거: points 업데이트 + point_transactions 기록
CREATE OR REPLACE FUNCTION public.handle_recommend_insert()
RETURNS trigger AS $$
DECLARE
  v_review_owner uuid;
BEGIN
  -- review recommend_count + 1
  UPDATE public.reviews
  SET recommend_count = recommend_count + 1
  WHERE id = NEW.review_id
  RETURNING user_id INTO v_review_owner;

  IF v_review_owner IS NULL THEN
    SELECT user_id INTO v_review_owner FROM public.reviews WHERE id = NEW.review_id;
  END IF;

  -- 리뷰 작성자 points + 10, total_recommends + 1
  UPDATE public.profiles
  SET total_recommends = total_recommends + 1,
      points           = COALESCE(points, 0) + 10
  WHERE id = v_review_owner;

  -- 로그 기록 (중복 무시)
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

-- 추천 취소 트리거: recommend_count만 감소, points는 유지
CREATE OR REPLACE FUNCTION public.handle_recommend_delete()
RETURNS trigger AS $$
DECLARE
  v_review_owner uuid;
BEGIN
  UPDATE public.reviews
  SET recommend_count = GREATEST(recommend_count - 1, 0)
  WHERE id = OLD.review_id;

  SELECT user_id INTO v_review_owner FROM public.reviews WHERE id = OLD.review_id;

  -- total_recommends만 차감, points는 차감하지 않음 (이미 획득한 포인트는 유지)
  UPDATE public.profiles
  SET total_recommends = GREATEST(total_recommends - 1, 0)
  WHERE id = v_review_owner;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
