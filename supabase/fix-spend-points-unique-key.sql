-- spend_points: unique_key 누락 수정

CREATE OR REPLACE FUNCTION spend_points(p_user_id UUID, p_item_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price    INT;
  v_balance  INT;
  v_duration INT;
  v_type     TEXT;
  v_name     TEXT;
  v_already  INT;
BEGIN
  SELECT price, duration_days, type, name
  INTO v_price, v_duration, v_type, v_name
  FROM shop_items WHERE id = p_item_id AND is_available = true;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  SELECT points INTO v_balance FROM profiles WHERE id = p_user_id;
  IF v_balance < v_price THEN RETURN 'insufficient'; END IF;

  IF v_duration IS NULL THEN
    SELECT COUNT(*) INTO v_already FROM user_items WHERE user_id = p_user_id AND item_id = p_item_id;
    IF v_already > 0 THEN RETURN 'already_owned'; END IF;
  ELSE
    SELECT COUNT(*) INTO v_already FROM user_items
    WHERE user_id = p_user_id AND item_id = p_item_id
      AND (expires_at IS NULL OR expires_at > NOW());
    IF v_already > 0 THEN RETURN 'already_owned'; END IF;
  END IF;

  UPDATE profiles SET points = points - v_price WHERE id = p_user_id;

  IF v_duration IS NOT NULL THEN
    INSERT INTO user_items (user_id, item_id, expires_at)
    VALUES (p_user_id, p_item_id, NOW() + (v_duration || ' days')::INTERVAL)
    ON CONFLICT (user_id, item_id) DO UPDATE
      SET expires_at = NOW() + (v_duration || ' days')::INTERVAL, purchased_at = NOW();

    IF v_type = 'nickname_color' THEN
      UPDATE profiles SET nickname_color_expires_at = NOW() + (v_duration || ' days')::INTERVAL WHERE id = p_user_id;
    ELSIF v_type = 'review_badge' THEN
      UPDATE profiles SET review_badge_expires_at = NOW() + (v_duration || ' days')::INTERVAL WHERE id = p_user_id;
    ELSIF v_type = 'review_highlight' THEN
      UPDATE profiles SET review_highlight_expires_at = NOW() + (v_duration || ' days')::INTERVAL WHERE id = p_user_id;
    END IF;
  ELSE
    INSERT INTO user_items (user_id, item_id)
    VALUES (p_user_id, p_item_id)
    ON CONFLICT (user_id, item_id) DO NOTHING;
  END IF;

  INSERT INTO point_transactions (user_id, amount, reason, unique_key)
  VALUES (
    p_user_id,
    -v_price,
    v_name || ' 구매',
    'purchase_' || p_user_id::text || '_' || p_item_id::text || '_' || extract(epoch from now())::bigint
  )
  ON CONFLICT (unique_key) DO NOTHING;

  RETURN 'ok';
END;
$$;
