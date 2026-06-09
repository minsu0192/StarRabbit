-- 칭호 시스템 분리 + 기간제 효과 아이템 추가

-- 1. 기존 칭호 상점에서 제거
UPDATE shop_items SET is_available = false WHERE type = 'title';

-- 2. shop_items에 duration_days 추가
ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS duration_days INT NULL;

-- 3. user_items에 expires_at 추가
ALTER TABLE user_items ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;

-- 4. type CHECK 제약 업데이트 (새 타입 추가)
ALTER TABLE shop_items DROP CONSTRAINT IF EXISTS shop_items_type_check;
ALTER TABLE shop_items ADD CONSTRAINT shop_items_type_check
  CHECK (type IN ('costume', 'title', 'frame', 'nickname_color', 'review_badge', 'review_highlight'));

-- 5. 프로필에 활성 효과 만료일 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nickname_color_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_badge_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_highlight_expires_at TIMESTAMPTZ;

-- 6. 새 구매 아이템 추가
INSERT INTO shop_items (name, description, type, price, duration_days, is_available) VALUES
  ('닉네임 컬러', '프로필과 한줄평에 닉네임을 포인트 컬러로 표시 (7일)', 'nickname_color', 300, 7, true),
  ('프로필 배지', '닉네임 옆에 반짝이는 배지 표시 (30일)', 'review_badge', 700, 30, true),
  ('한줄평 강조권', '내 한줄평 배경을 은은하게 강조 (30일)', 'review_highlight', 1200, 30, true);

-- 7. spend_points RPC 업데이트 (기간제 + 프로필 효과 연동)
CREATE OR REPLACE FUNCTION spend_points(p_user_id UUID, p_item_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price INT;
  v_balance INT;
  v_duration INT;
  v_type TEXT;
  v_name TEXT;
  v_already INT;
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

  INSERT INTO point_transactions (user_id, amount, reason)
  VALUES (p_user_id, -v_price, v_name || ' 구매');

  RETURN 'ok';
END;
$$;

-- 8. 칭호 테이블
CREATE TABLE IF NOT EXISTS titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  condition_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "titles_read" ON titles;
CREATE POLICY "titles_read" ON titles FOR SELECT USING (true);

-- 9. 유저 칭호 테이블
CREATE TABLE IF NOT EXISTS user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);

ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_titles_own" ON user_titles;
DROP POLICY IF EXISTS "user_titles_read" ON user_titles;
CREATE POLICY "user_titles_own" ON user_titles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_titles_read" ON user_titles FOR SELECT USING (true);

-- 10. 칭호 데이터
INSERT INTO titles (name, description, condition_key) VALUES
  ('리뷰왕',   '한줄평 30개 이상 작성',                   'reviews_30'),
  ('웹툰박사', '10개 이상의 웹툰에 한줄평 작성',           'webtoons_10'),
  ('극찬러',   '평균 평점 8.0 이상 (한줄평 10개 이상)',    'avg_score_high'),
  ('독설러',   '평균 평점 4.0 이하 (한줄평 10개 이상)',    'avg_score_low')
ON CONFLICT (condition_key) DO NOTHING;

-- 11. award_title RPC (멱등)
CREATE OR REPLACE FUNCTION award_title(p_user_id UUID, p_condition_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title_id UUID;
BEGIN
  SELECT id INTO v_title_id FROM titles WHERE condition_key = p_condition_key AND is_active = true;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  INSERT INTO user_titles (user_id, title_id)
  VALUES (p_user_id, v_title_id)
  ON CONFLICT (user_id, title_id) DO NOTHING;
  RETURN 'ok';
END;
$$;

-- 12. equip_title RPC
CREATE OR REPLACE FUNCTION equip_title(p_user_id UUID, p_title_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = p_title_id) THEN
    RETURN 'not_found';
  END IF;
  UPDATE user_titles SET is_equipped = false WHERE user_id = p_user_id;
  UPDATE user_titles SET is_equipped = true  WHERE user_id = p_user_id AND title_id = p_title_id;
  RETURN 'ok';
END;
$$;
