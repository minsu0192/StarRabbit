-- Secure and atomic shop/title RPCs.
-- Run this after add-shop-system.sql and add-titles-system.sql.

CREATE OR REPLACE FUNCTION public.spend_points(p_user_id UUID, p_item_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price INT;
  v_balance INT;
  v_duration INT;
  v_type TEXT;
  v_name TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN 'unauthorized';
  END IF;

  SELECT price, duration_days, type, name
    INTO v_price, v_duration, v_type, v_name
    FROM public.shop_items
   WHERE id = p_item_id AND is_available = true;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  -- Serialize purchases for this user so balance and ownership checks stay atomic.
  SELECT points
    INTO v_balance
    FROM public.profiles
   WHERE id = p_user_id
   FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_balance < v_price THEN RETURN 'insufficient'; END IF;

  SELECT expires_at
    INTO v_expires_at
    FROM public.user_items
   WHERE user_id = p_user_id AND item_id = p_item_id;

  IF FOUND AND (v_duration IS NULL OR v_expires_at IS NULL OR v_expires_at > NOW()) THEN
    RETURN 'already_owned';
  END IF;

  UPDATE public.profiles
     SET points = points - v_price
   WHERE id = p_user_id;

  IF v_duration IS NOT NULL THEN
    v_expires_at := NOW() + make_interval(days => v_duration);

    INSERT INTO public.user_items (user_id, item_id, expires_at, is_equipped)
    VALUES (p_user_id, p_item_id, v_expires_at, false)
    ON CONFLICT (user_id, item_id) DO UPDATE
      SET expires_at = EXCLUDED.expires_at,
          purchased_at = NOW(),
          is_equipped = false;

    IF v_type = 'nickname_color' THEN
      UPDATE public.profiles SET nickname_color_expires_at = v_expires_at WHERE id = p_user_id;
    ELSIF v_type = 'review_badge' THEN
      UPDATE public.profiles SET review_badge_expires_at = v_expires_at WHERE id = p_user_id;
    ELSIF v_type = 'review_highlight' THEN
      UPDATE public.profiles SET review_highlight_expires_at = v_expires_at WHERE id = p_user_id;
    END IF;
  ELSE
    INSERT INTO public.user_items (user_id, item_id)
    VALUES (p_user_id, p_item_id);
  END IF;

  INSERT INTO public.point_transactions (user_id, amount, reason, unique_key, metadata)
  VALUES (
    p_user_id,
    -v_price,
    v_name || ' 구매',
    'purchase:' || p_user_id::text || ':' || p_item_id::text || ':' || gen_random_uuid()::text,
    jsonb_build_object('item_id', p_item_id)
  );

  RETURN 'ok';
END;
$$;

CREATE OR REPLACE FUNCTION public.equip_shop_item(p_user_id UUID, p_item_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RETURN 'unauthorized'; END IF;

  SELECT si.type
    INTO v_type
    FROM public.user_items ui
    JOIN public.shop_items si ON si.id = ui.item_id
   WHERE ui.user_id = p_user_id
     AND ui.item_id = p_item_id
     AND (ui.expires_at IS NULL OR ui.expires_at > NOW());
  IF NOT FOUND THEN RETURN 'not_owned'; END IF;

  UPDATE public.user_items ui
     SET is_equipped = false
    FROM public.shop_items si
   WHERE ui.item_id = si.id
     AND ui.user_id = p_user_id
     AND si.type = v_type;

  UPDATE public.user_items
     SET is_equipped = true
   WHERE user_id = p_user_id AND item_id = p_item_id;

  RETURN 'ok';
END;
$$;

CREATE OR REPLACE FUNCTION public.unequip_shop_item(p_user_id UUID, p_item_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RETURN 'unauthorized'; END IF;

  UPDATE public.user_items
     SET is_equipped = false
   WHERE user_id = p_user_id AND item_id = p_item_id;
  IF NOT FOUND THEN RETURN 'not_owned'; END IF;

  RETURN 'ok';
END;
$$;

CREATE OR REPLACE FUNCTION public.award_title(p_user_id UUID, p_condition_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title_id UUID;
  v_review_count INT;
  v_webtoon_count INT;
  v_avg_score NUMERIC;
  v_qualified BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RETURN 'unauthorized'; END IF;

  SELECT COUNT(*), COUNT(DISTINCT webtoon_id), AVG(score)
    INTO v_review_count, v_webtoon_count, v_avg_score
    FROM public.reviews
   WHERE user_id = p_user_id;

  v_qualified := CASE p_condition_key
    WHEN 'reviews_30' THEN v_review_count >= 30
    WHEN 'webtoons_10' THEN v_webtoon_count >= 10
    WHEN 'avg_score_high' THEN v_review_count >= 10 AND v_avg_score >= 8.0
    WHEN 'avg_score_low' THEN v_review_count >= 10 AND v_avg_score <= 4.0
    ELSE false
  END;
  IF NOT v_qualified THEN RETURN 'not_qualified'; END IF;

  SELECT id INTO v_title_id
    FROM public.titles
   WHERE condition_key = p_condition_key AND is_active = true;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  INSERT INTO public.user_titles (user_id, title_id)
  VALUES (p_user_id, v_title_id)
  ON CONFLICT (user_id, title_id) DO NOTHING;
  RETURN 'ok';
END;
$$;

CREATE OR REPLACE FUNCTION public.equip_title(p_user_id UUID, p_title_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RETURN 'unauthorized'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_titles WHERE user_id = p_user_id AND title_id = p_title_id
  ) THEN RETURN 'not_found'; END IF;

  UPDATE public.user_titles SET is_equipped = false WHERE user_id = p_user_id;
  UPDATE public.user_titles SET is_equipped = true
   WHERE user_id = p_user_id AND title_id = p_title_id;
  RETURN 'ok';
END;
$$;

CREATE OR REPLACE FUNCTION public.unequip_title(p_user_id UUID, p_title_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RETURN 'unauthorized'; END IF;

  UPDATE public.user_titles SET is_equipped = false
   WHERE user_id = p_user_id AND title_id = p_title_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.spend_points(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.equip_shop_item(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unequip_shop_item(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_title(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.equip_title(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unequip_title(UUID, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.spend_points(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_shop_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unequip_shop_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_title(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_title(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unequip_title(UUID, UUID) TO authenticated;
