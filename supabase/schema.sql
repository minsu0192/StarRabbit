-- 별토끼 DB 스키마
-- Supabase SQL Editor에 전체 복사-붙여넣기 후 실행

-- ============================================
-- 1. 테이블 생성
-- ============================================

-- 웹툰 테이블
CREATE TABLE webtoons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('naver', 'kakao', 'etc')),
  genre text,
  status text CHECK (status IN ('ongoing', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- 중복 제목 방지 (같은 제목+작가 조합)
CREATE UNIQUE INDEX webtoons_title_author_unique ON webtoons (title, author);

-- 유저 프로필 테이블 (Supabase auth.users와 1:1)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text UNIQUE NOT NULL,
  total_recommends int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 리뷰(평점+한줄평) 테이블
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webtoon_id uuid NOT NULL REFERENCES webtoons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score numeric(3,1) NOT NULL CHECK (score >= 1.0 AND score <= 10.0 AND score * 2 = floor(score * 2)), -- 0.5 단위
  comment text NOT NULL,
  recommend_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (webtoon_id, user_id) -- 1인 1평 강제
);

-- 추천 테이블
CREATE TABLE recommends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (review_id, user_id) -- 1인 1추 강제
);

-- 신고 테이블
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. 자동화 트리거
-- ============================================

-- 구글 로그인 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_nickname text;
BEGIN
  base_nickname := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))), '');

  INSERT INTO public.profiles (id, nickname)
  VALUES (
    NEW.id,
    left(COALESCE(base_nickname, '유저'), 8) || '-' || substr(NEW.id::text, 1, 4)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.profiles (id, nickname)
    VALUES (NEW.id, '유저-' || substr(NEW.id::text, 1, 8))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  WHEN others THEN
    -- 프로필 생성 실패가 Supabase Auth 가입 자체를 막지 않도록 한다.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 추천 추가 시 review.recommend_count + 1, profiles.total_recommends + 1
CREATE OR REPLACE FUNCTION handle_recommend_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE reviews SET recommend_count = recommend_count + 1 WHERE id = NEW.review_id;
  UPDATE profiles SET total_recommends = total_recommends + 1
    WHERE id = (SELECT user_id FROM reviews WHERE id = NEW.review_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_recommend_insert
  AFTER INSERT ON recommends
  FOR EACH ROW EXECUTE FUNCTION handle_recommend_insert();

-- 추천 취소 시 review.recommend_count - 1, profiles.total_recommends - 1
CREATE OR REPLACE FUNCTION handle_recommend_delete()
RETURNS trigger AS $$
BEGIN
  UPDATE reviews SET recommend_count = GREATEST(recommend_count - 1, 0) WHERE id = OLD.review_id;
  UPDATE profiles SET total_recommends = GREATEST(total_recommends - 1, 0)
    WHERE id = (SELECT user_id FROM reviews WHERE id = OLD.review_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_recommend_delete
  AFTER DELETE ON recommends
  FOR EACH ROW EXECUTE FUNCTION handle_recommend_delete();

-- reviews.updated_at 자동 갱신
CREATE OR REPLACE FUNCTION handle_review_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_update
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION handle_review_updated_at();

-- ============================================
-- 3. Row Level Security (RLS) 설정
-- ============================================

ALTER TABLE webtoons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommends ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- webtoons: 읽기 공개, 쓰기 로그인 필요
CREATE POLICY "webtoons_read" ON webtoons FOR SELECT USING (true);
CREATE POLICY "webtoons_insert" ON webtoons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- profiles: 읽기 공개, 수정 본인만
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- reviews: 읽기 공개, 쓰기/수정/삭제 본인만
CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- recommends: 읽기 공개, 본인 추천만 추가/취소
CREATE POLICY "recommends_read" ON recommends FOR SELECT USING (true);
CREATE POLICY "recommends_insert" ON recommends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recommends_delete" ON recommends FOR DELETE USING (auth.uid() = user_id);

-- reports: 로그인한 유저만 신고 가능
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
