-- 상점 시스템 + 포인트 등급 분리
-- earned_points: 누적 획득량 (등급 기준, 절대 감소 안 함)
-- points: 현재 잔고 (상점에서 소비 가능)

-- 1. earned_points 컬럼 추가 및 기존 points로 초기화
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS earned_points int NOT NULL DEFAULT 0;

UPDATE public.profiles
  SET earned_points = points
  WHERE earned_points = 0 AND points > 0;

-- 2. award_points RPC: earned_points도 같이 증가 (양수 지급만)
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_unique_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
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
  SET
    points       = GREATEST(points + p_amount, 0),
    earned_points = earned_points + GREATEST(p_amount, 0)  -- 획득만, 소비는 안 건드림
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. 상점 아이템 테이블
CREATE TABLE IF NOT EXISTS public.shop_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  type        text NOT NULL CHECK (type IN ('costume', 'title', 'frame')),
  price       int  NOT NULL CHECK (price > 0),
  costume_key text,                         -- TierBunny 등에서 참조할 식별자
  is_available boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. 유저 보유 아이템 테이블
CREATE TABLE IF NOT EXISTS public.user_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id      uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  is_equipped  boolean NOT NULL DEFAULT false,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS user_items_user_id_idx ON public.user_items(user_id);

-- 5. 포인트 소비 함수 (잔고만 감소, earned_points 유지)
CREATE OR REPLACE FUNCTION public.spend_points(
  p_user_id uuid,
  p_item_id  uuid
)
RETURNS text AS $$
DECLARE
  v_price   int;
  v_balance int;
  inserted_count int;
BEGIN
  SELECT price INTO v_price
    FROM public.shop_items
   WHERE id = p_item_id AND is_available;
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  SELECT points INTO v_balance
    FROM public.profiles WHERE id = p_user_id;
  IF v_balance < v_price THEN
    RETURN 'insufficient';
  END IF;

  INSERT INTO public.user_items (user_id, item_id)
  VALUES (p_user_id, p_item_id)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    RETURN 'already_owned';
  END IF;

  -- earned_points는 건드리지 않음 — 등급 보호
  UPDATE public.profiles
     SET points = points - v_price
   WHERE id = p_user_id;

  -- 소비 이력 기록 (음수로 저장)
  INSERT INTO public.point_transactions (user_id, amount, reason, unique_key, metadata)
  VALUES (
    p_user_id,
    -v_price,
    '상점 구매',
    'shop:' || p_user_id || ':' || p_item_id || ':' || now()::text,
    jsonb_build_object('item_id', p_item_id)
  );

  RETURN 'ok';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. RLS
ALTER TABLE public.shop_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_items  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_items_read" ON public.shop_items;
CREATE POLICY "shop_items_read"
  ON public.shop_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_items_read_own" ON public.user_items;
CREATE POLICY "user_items_read_own"
  ON public.user_items FOR SELECT USING (auth.uid() = user_id);

-- 7. 시드 — 1차 코스튬 라인업
INSERT INTO public.shop_items (name, description, type, price, costume_key) VALUES
  ('닌자토끼',     '은밀하게, 빠르게. 어둠의 리뷰어.',        'costume', 800,  'ninja'),
  ('무사토끼',     '정정당당한 평점의 무사.',                  'costume', 800,  'samurai'),
  ('공주토끼',     '별토끼 왕국의 우아한 공주.',              'costume', 800,  'princess'),
  ('마법사토끼',   '마법으로 평점을 읽어내는 마법사.',        'costume', 1200, 'mage'),
  ('해적토끼',     '바다를 누비는 웹툰 탐험가.',              'costume', 1200, 'pirate'),
  ('우주비행사토끼','우주에서도 웹툰을 읽는다.',              'costume', 2000, 'astronaut'),
  ('악마토끼',     '세상 가장 혹독한 리뷰어.',                'costume', 1500, 'devil'),
  ('산타토끼',     '좋아요 대신 별점을 선물합니다.',          'costume', 500,  'santa')
ON CONFLICT DO NOTHING;

INSERT INTO public.shop_items (name, description, type, price, costume_key) VALUES
  ('리뷰왕',       '추천을 가장 많이 받은 자의 칭호.',        'title',   500,  null),
  ('웹툰 박사',    '장르를 꿰뚫는 전문가.',                   'title',   300,  null),
  ('극찬러',       '좋은 작품엔 아낌없이 칭찬.',              'title',   300,  null),
  ('독설러',       '쓴소리도 솔직하게.',                      'title',   300,  null)
ON CONFLICT DO NOTHING;
